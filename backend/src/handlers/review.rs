use axum::{
    extract::{Path, State},
    http::HeaderMap,
    routing::{get, post},
    Json, Router,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::{extract_bearer_token, JwtService};
use crate::error::AppError;
use crate::models::review::*;
use crate::models::test_case::TestCase;
use crate::models::user::User;

use crate::websocket::WsManager;

#[derive(Clone)]
pub struct ReviewState {
    pub db: PgPool,
    pub jwt: JwtService,
    pub ws_manager: WsManager,
}

pub fn review_routes(state: ReviewState) -> Router {
    Router::new()
        .route("/test-cases/:id/reviews", post(create_review))
        .route("/test-cases/:id/reviews", get(get_review_history))
        .route("/test-cases/:id/last-review", get(get_last_review))
        .route("/reviews/stats", get(get_review_stats))
        .with_state(state)
}

async fn create_review(
    State(state): State<ReviewState>,
    headers: HeaderMap,
    Path(case_id): Path<String>,
    Json(payload): Json<CreateReviewRequest>,
) -> Result<Json<ReviewResponse>, AppError> {
    let user_id = verify_token(&state, &headers)?;
    let reviewer_uuid = Uuid::parse_str(&user_id)
        .map_err(|_| AppError::Internal("Invalid user ID".to_string()))?;

    // Validate action
    if payload.action != "approved" && payload.action != "needs_revision" {
        return Err(AppError::BadRequest(
            "Invalid action. Must be 'approved' or 'needs_revision'".to_string()
        ));
    }

    // Validate comment for request edit
    if payload.action == "needs_revision" {
        if let Some(ref comment) = payload.comment {
            if comment.trim().is_empty() {
                return Err(AppError::BadRequest(
                    "Comment is required when requesting edit".to_string()
                ));
            }
        } else {
            return Err(AppError::BadRequest(
                "Comment is required when requesting edit".to_string()
            ));
        }
    }

    // Get reviewer info and check permissions
    let reviewer: User = sqlx::query_as(
        "SELECT * FROM users WHERE id = $1"
    )
    .bind(reviewer_uuid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Reviewer not found".to_string()))?;

    // Get user permissions
    let special_permissions = get_user_special_permissions(&state.db, reviewer.id).await?;
    let base_permissions = get_base_permissions_for_role(&reviewer.role);
    
    // Check if user has review permission
    let has_review_permission = base_permissions.contains(&"review_approve_test_cases".to_string())
        || special_permissions.contains(&"review_approve_test_cases".to_string());
    
    if !has_review_permission {
        return Err(AppError::Forbidden(
            "You don't have permission to review test cases".to_string()
        ));
    }

    // Get test case
    let test_case: TestCase = sqlx::query_as(
        "SELECT * FROM test_cases WHERE case_id = $1"
    )
    .bind(&case_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Test case not found".to_string()))?;

    // Prevent self-review
    if test_case.created_by == reviewer_uuid {
        return Err(AppError::BadRequest(
            "You cannot review your own test case".to_string()
        ));
    }

    // Start transaction
    let mut tx = state.db.begin().await?;

    // Create review record
    let review_id = Uuid::new_v4();
    let review: TestCaseReview = sqlx::query_as(
        r#"INSERT INTO test_case_reviews 
           (id, test_case_id, reviewer_id, action, comment)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *"#
    )
    .bind(review_id)
    .bind(test_case.id)
    .bind(reviewer_uuid)
    .bind(&payload.action)
    .bind(&payload.comment)
    .fetch_one(&mut *tx)
    .await?;

    // Update test case review_status
    let new_status = match payload.action.as_str() {
        "approved" => "approved",
        "needs_revision" => "needs_revision",
        _ => "pending",
    };

    sqlx::query(
        "UPDATE test_cases SET review_status = $1, updated_at = NOW() WHERE id = $2"
    )
    .bind(new_status)
    .bind(test_case.id)
    .execute(&mut *tx)
    .await?;

    // Commit transaction
    tx.commit().await?;

    // Create notification for test case creator
    let notification_result = match payload.action.as_str() {
        "approved" => {
            crate::handlers::notification::create_review_approval_notification(
                &state.db,
                Some(&state.ws_manager),
                test_case.created_by,
                &reviewer.name,
                &case_id,
            ).await
        },
        "needs_revision" => {
            crate::handlers::notification::create_review_request_edit_notification(
                &state.db,
                Some(&state.ws_manager),
                test_case.created_by,
                &reviewer.name,
                &case_id,
            ).await
        },
        _ => Ok(crate::models::notification::Notification {
            id: Uuid::new_v4(),
            user_id: test_case.created_by,
            notification_type: "unknown".to_string(),
            title: "".to_string(),
            message: "".to_string(),
            related_entity_type: None,
            related_entity_id: None,
            is_read: false,
            created_at: chrono::Utc::now(),
        }),
    };

    // Log error if notification creation fails, but don't fail the review
    if let Err(e) = notification_result {
        tracing::error!("Failed to create notification: {:?}", e);
    }

    // Broadcast review stats update via WebSocket
    let stats_result = broadcast_review_stats_update(&state).await;
    if let Err(e) = stats_result {
        tracing::error!("Failed to broadcast review stats: {:?}", e);
    }

    // Return response
    Ok(Json(ReviewResponse {
        id: review.id.to_string(),
        test_case_id: case_id,
        reviewer_id: reviewer.id.to_string(),
        reviewer_name: reviewer.name,
        action: review.action,
        comment: review.comment,
        created_at: review.created_at.to_rfc3339(),
    }))
}

async fn get_review_history(
    State(state): State<ReviewState>,
    headers: HeaderMap,
    Path(case_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    verify_token(&state, &headers)?;

    // Get test case to verify it exists
    let test_case: TestCase = sqlx::query_as(
        "SELECT * FROM test_cases WHERE case_id = $1"
    )
    .bind(&case_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Test case not found".to_string()))?;

    // Get review history with reviewer names
    let reviews: Vec<ReviewWithReviewer> = sqlx::query_as(
        r#"SELECT 
            r.id, r.test_case_id, r.reviewer_id, r.action, r.comment, r.created_at,
            u.name as reviewer_name
           FROM test_case_reviews r
           JOIN users u ON r.reviewer_id = u.id
           WHERE r.test_case_id = $1
           ORDER BY r.created_at DESC"#
    )
    .bind(test_case.id)
    .fetch_all(&state.db)
    .await?;

    let review_responses: Vec<ReviewResponse> = reviews
        .into_iter()
        .map(|r| ReviewResponse::from_review_with_reviewer(r, case_id.clone()))
        .collect();

    Ok(Json(serde_json::json!({
        "reviews": review_responses
    })))
}

async fn get_last_review(
    State(state): State<ReviewState>,
    headers: HeaderMap,
    Path(case_id): Path<String>,
) -> Result<Json<Option<ReviewResponse>>, AppError> {
    verify_token(&state, &headers)?;

    // Get test case to verify it exists
    let test_case: TestCase = sqlx::query_as(
        "SELECT * FROM test_cases WHERE case_id = $1"
    )
    .bind(&case_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Test case not found".to_string()))?;

    // Get last review with reviewer name
    let last_review: Option<ReviewWithReviewer> = sqlx::query_as(
        r#"SELECT 
            r.id, r.test_case_id, r.reviewer_id, r.action, r.comment, r.created_at,
            u.name as reviewer_name
           FROM test_case_reviews r
           JOIN users u ON r.reviewer_id = u.id
           WHERE r.test_case_id = $1
           ORDER BY r.created_at DESC
           LIMIT 1"#
    )
    .bind(test_case.id)
    .fetch_optional(&state.db)
    .await?;

    let response = last_review.map(|r| ReviewResponse::from_review_with_reviewer(r, case_id));

    Ok(Json(response))
}

async fn get_review_stats(
    State(state): State<ReviewState>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, AppError> {
    verify_token(&state, &headers)?;

    // Get counts for each review status
    let pending_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM test_cases WHERE review_status = 'pending'"
    )
    .fetch_one(&state.db)
    .await?;

    let approved_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM test_cases WHERE review_status = 'approved'"
    )
    .fetch_one(&state.db)
    .await?;

    let needs_revision_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM test_cases WHERE review_status = 'needs_revision'"
    )
    .fetch_one(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "pending": pending_count.0,
        "approved": approved_count.0,
        "needs_revision": needs_revision_count.0
    })))
}

fn verify_token(state: &ReviewState, headers: &HeaderMap) -> Result<String, AppError> {
    let token = extract_bearer_token(headers.get("authorization").and_then(|v| v.to_str().ok()))
        .ok_or_else(|| AppError::Unauthorized("Missing token".to_string()))?;

    state.jwt.get_user_id_from_token(&token)
        .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))
}

// Helper function to get base permissions for a role
fn get_base_permissions_for_role(role: &str) -> Vec<String> {
    match role {
        "admin" | "ROLE_ADMIN" => vec![
            "view_all_data".to_string(),
            "manage_users".to_string(),
            "full_test_case_access".to_string(),
            "execute_all_tests".to_string(),
            "manage_configurations".to_string(),
            "export_reports".to_string(),
            "manage_integrations".to_string(),
            "review_approve_test_cases".to_string(),
        ],
        "qa_lead" | "ROLE_QA_LEAD" => vec![
            "view_all_data".to_string(),
            "manage_qa_team".to_string(),
            "full_test_case_access".to_string(),
            "execute_all_tests".to_string(),
            "manage_test_configurations".to_string(),
            "review_approve_test_cases".to_string(),
            "export_reports".to_string(),
        ],
        "qa_engineer" | "ROLE_QA_ENGINEER" => vec![
            "view_all_data".to_string(),
            "create_edit_test_cases".to_string(),
            "execute_all_tests".to_string(),
            "record_test_results".to_string(),
        ],
        "developer" | "ROLE_DEVELOPER" => vec![
            "view_all_data".to_string(),
            "execute_automated_tests".to_string(),
        ],
        _ => vec!["view_all_data".to_string()],
    }
}

// Helper function to get user special permissions from database
async fn get_user_special_permissions(db: &PgPool, user_id: Uuid) -> Result<Vec<String>, AppError> {
    let permissions: Vec<(String,)> = sqlx::query_as(
        "SELECT permission FROM user_special_permissions WHERE user_id = $1"
    )
    .bind(user_id)
    .fetch_all(db)
    .await?;

    Ok(permissions.into_iter().map(|(p,)| p).collect())
}

// Helper function to broadcast review stats update
async fn broadcast_review_stats_update(state: &ReviewState) -> Result<(), AppError> {
    // Get current stats
    let pending_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM test_cases WHERE review_status = 'pending'"
    )
    .fetch_one(&state.db)
    .await?;

    let approved_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM test_cases WHERE review_status = 'approved'"
    )
    .fetch_one(&state.db)
    .await?;

    let needs_revision_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM test_cases WHERE review_status = 'needs_revision'"
    )
    .fetch_one(&state.db)
    .await?;

    // Broadcast to all connected clients
    let message = serde_json::json!({
        "type": "review_stats_update",
        "data": {
            "pending": pending_count.0,
            "approved": approved_count.0,
            "needs_revision": needs_revision_count.0
        }
    });

    state.ws_manager.broadcast(message.to_string()).await;

    Ok(())
}
