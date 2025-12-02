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

    // Get reviewer info and check role
    let reviewer: User = sqlx::query_as(
        "SELECT * FROM users WHERE id = $1"
    )
    .bind(reviewer_uuid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Reviewer not found".to_string()))?;

    // Check if user has QA Lead role
    if reviewer.role != "QA Lead" {
        return Err(AppError::Forbidden(
            "Only QA Lead can review test cases".to_string()
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

fn verify_token(state: &ReviewState, headers: &HeaderMap) -> Result<String, AppError> {
    let token = extract_bearer_token(headers.get("authorization").and_then(|v| v.to_str().ok()))
        .ok_or_else(|| AppError::Unauthorized("Missing token".to_string()))?;

    state.jwt.get_user_id_from_token(&token)
        .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))
}
