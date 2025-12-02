use axum::{
    extract::{Path, Query, State},
    http::HeaderMap,
    routing::{get, put},
    Json, Router,
};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::{extract_bearer_token, JwtService};
use crate::error::AppError;
use crate::models::notification::*;

use crate::websocket::{WsManager, WsMessage};

#[derive(Clone)]
pub struct NotificationState {
    pub db: PgPool,
    pub jwt: JwtService,
    pub ws_manager: WsManager,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationQuery {
    #[serde(default = "default_page")]
    pub page: i64,
    #[serde(default = "default_page_size")]
    pub page_size: i64,
    #[serde(default)]
    pub unread_only: bool,
}

fn default_page() -> i64 {
    1
}

fn default_page_size() -> i64 {
    20
}

pub fn notification_routes(state: NotificationState) -> Router {
    Router::new()
        .route("/notifications", get(list_notifications))
        .route("/notifications/:id/read", put(mark_as_read))
        .route("/notifications/mark-all-read", put(mark_all_as_read))
        .with_state(state)
}

async fn list_notifications(
    State(state): State<NotificationState>,
    headers: HeaderMap,
    Query(query): Query<NotificationQuery>,
) -> Result<Json<NotificationListResponse>, AppError> {
    let user_id = verify_token(&state, &headers)?;
    let user_uuid = Uuid::parse_str(&user_id)
        .map_err(|_| AppError::Internal("Invalid user ID".to_string()))?;

    // Calculate offset
    let offset = (query.page - 1) * query.page_size;

    // Build query based on unread_only filter
    let notifications: Vec<Notification> = if query.unread_only {
        sqlx::query_as(
            r#"SELECT * FROM notifications 
               WHERE user_id = $1 AND is_read = false
               ORDER BY created_at DESC
               LIMIT $2 OFFSET $3"#
        )
        .bind(user_uuid)
        .bind(query.page_size)
        .bind(offset)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as(
            r#"SELECT * FROM notifications 
               WHERE user_id = $1
               ORDER BY 
                   CASE WHEN is_read = false THEN 0 ELSE 1 END,
                   created_at DESC
               LIMIT $2 OFFSET $3"#
        )
        .bind(user_uuid)
        .bind(query.page_size)
        .bind(offset)
        .fetch_all(&state.db)
        .await?
    };

    // Get total count
    let total: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM notifications WHERE user_id = $1"
    )
    .bind(user_uuid)
    .fetch_one(&state.db)
    .await?;

    // Get unread count
    let unread_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false"
    )
    .bind(user_uuid)
    .fetch_one(&state.db)
    .await?;

    let notification_responses: Vec<NotificationResponse> = notifications
        .into_iter()
        .map(NotificationResponse::from_notification)
        .collect();

    Ok(Json(NotificationListResponse {
        notifications: notification_responses,
        total: total.0,
        unread_count: unread_count.0,
    }))
}

async fn mark_as_read(
    State(state): State<NotificationState>,
    headers: HeaderMap,
    Path(notification_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let user_id = verify_token(&state, &headers)?;
    let user_uuid = Uuid::parse_str(&user_id)
        .map_err(|_| AppError::Internal("Invalid user ID".to_string()))?;

    let notification_uuid = Uuid::parse_str(&notification_id)
        .map_err(|_| AppError::BadRequest("Invalid notification ID".to_string()))?;

    // Check if notification exists and belongs to user
    let notification: Option<Notification> = sqlx::query_as(
        "SELECT * FROM notifications WHERE id = $1"
    )
    .bind(notification_uuid)
    .fetch_optional(&state.db)
    .await?;

    let notification = notification
        .ok_or_else(|| AppError::NotFound("Notification not found".to_string()))?;

    // Verify ownership
    if notification.user_id != user_uuid {
        return Err(AppError::Forbidden(
            "You can only access your own notifications".to_string()
        ));
    }

    // Update notification
    sqlx::query(
        "UPDATE notifications SET is_read = true WHERE id = $1"
    )
    .bind(notification_uuid)
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "success": true
    })))
}

async fn mark_all_as_read(
    State(state): State<NotificationState>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, AppError> {
    let user_id = verify_token(&state, &headers)?;
    let user_uuid = Uuid::parse_str(&user_id)
        .map_err(|_| AppError::Internal("Invalid user ID".to_string()))?;

    // Update all unread notifications for user
    let result = sqlx::query(
        "UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false"
    )
    .bind(user_uuid)
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "success": true,
        "updatedCount": result.rows_affected()
    })))
}

fn verify_token(state: &NotificationState, headers: &HeaderMap) -> Result<String, AppError> {
    let token = extract_bearer_token(headers.get("authorization").and_then(|v| v.to_str().ok()))
        .ok_or_else(|| AppError::Unauthorized("Missing token".to_string()))?;

    state.jwt.get_user_id_from_token(&token)
        .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))
}

// Notification service functions
pub async fn create_notification(
    db: &PgPool,
    ws_manager: Option<&WsManager>,
    request: CreateNotificationRequest,
) -> Result<Notification, AppError> {
    let notification_id = Uuid::new_v4();
    
    let notification: Notification = sqlx::query_as(
        r#"INSERT INTO notifications 
           (id, user_id, notification_type, title, message, related_entity_type, related_entity_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *"#
    )
    .bind(notification_id)
    .bind(request.user_id)
    .bind(&request.notification_type)
    .bind(&request.title)
    .bind(&request.message)
    .bind(&request.related_entity_type)
    .bind(&request.related_entity_id)
    .fetch_one(db)
    .await?;

    // Broadcast notification via WebSocket if manager is provided
    if let Some(ws_mgr) = ws_manager {
        let ws_message = WsMessage {
            msg_type: "notification".to_string(),
            payload: Some(serde_json::to_value(NotificationResponse::from_notification(notification.clone())).unwrap()),
        };
        ws_mgr.send_to_user(&request.user_id, ws_message).await;
    }

    Ok(notification)
}

pub async fn create_review_approval_notification(
    db: &PgPool,
    ws_manager: Option<&WsManager>,
    creator_id: Uuid,
    reviewer_name: &str,
    case_id: &str,
) -> Result<Notification, AppError> {
    let request = CreateNotificationRequest {
        user_id: creator_id,
        notification_type: "review_approved".to_string(),
        title: "Test Case Approved".to_string(),
        message: format!("Your test case {} has been approved by {}", case_id, reviewer_name),
        related_entity_type: Some("test_case".to_string()),
        related_entity_id: Some(case_id.to_string()),
    };

    create_notification(db, ws_manager, request).await
}

pub async fn create_review_request_edit_notification(
    db: &PgPool,
    ws_manager: Option<&WsManager>,
    creator_id: Uuid,
    reviewer_name: &str,
    case_id: &str,
) -> Result<Notification, AppError> {
    let request = CreateNotificationRequest {
        user_id: creator_id,
        notification_type: "review_needs_revision".to_string(),
        title: "Test Case Needs Revision".to_string(),
        message: format!("Your test case {} needs revision. Reviewed by {}", case_id, reviewer_name),
        related_entity_type: Some("test_case".to_string()),
        related_entity_id: Some(case_id.to_string()),
    };

    create_notification(db, ws_manager, request).await
}
