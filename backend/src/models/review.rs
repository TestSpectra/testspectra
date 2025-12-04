use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct TestCaseReview {
    pub id: Uuid,
    pub test_case_id: Uuid,
    pub reviewer_id: Uuid,
    pub action: String,
    pub comment: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReviewResponse {
    pub id: String,
    pub test_case_id: String,
    pub reviewer_id: String,
    pub reviewer_name: String,
    pub action: String,
    pub comment: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateReviewRequest {
    pub action: String,
    pub comment: Option<String>,
}

#[derive(Debug, Clone, FromRow)]
pub struct ReviewWithReviewer {
    // Review fields
    pub id: Uuid,
    pub test_case_id: Uuid,
    pub reviewer_id: Uuid,
    pub action: String,
    pub comment: Option<String>,
    pub created_at: DateTime<Utc>,
    // Reviewer fields
    pub reviewer_name: String,
}

impl ReviewResponse {
    pub fn from_review_with_reviewer(rwr: ReviewWithReviewer, case_id: String) -> Self {
        Self {
            id: rwr.id.to_string(),
            test_case_id: case_id,
            reviewer_id: rwr.reviewer_id.to_string(),
            reviewer_name: rwr.reviewer_name,
            action: rwr.action,
            comment: rwr.comment,
            created_at: rwr.created_at.to_rfc3339(),
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReviewStats {
    pub pending: i64,
    pub pending_revision: i64,
    pub approved: i64,
    pub needs_revision: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReviewQueueQuery {
    pub status: Option<String>,
    pub search: Option<String>,
    pub priority: Option<String>,
    pub suite: Option<String>,
    pub page: Option<i32>,
}

#[derive(Debug, Clone, FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReviewQueueItem {
    pub case_id: String,
    pub title: String,
    pub suite: String,
    pub priority: String,
    pub case_type: String,
    pub automation: String,
    pub last_status: String,
    pub page_load_avg: Option<String>,
    pub last_run: Option<String>,
    pub execution_order: f64,
    pub updated_at: DateTime<Utc>,
    pub review_status: String,
    pub created_by_name: Option<String>,
    pub submitted_for_review_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReviewQueueResponse {
    pub items: Vec<ReviewQueueItem>,
    pub total: i64,
    pub page: i32,
    pub page_size: i32,
    pub available_suites: Vec<String>,
}
