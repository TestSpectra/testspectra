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
