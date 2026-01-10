use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::FromRow;
use uuid::Uuid;

use crate::models::test_step::CreateTestStepRequest;
use crate::models::test_case::TestStepResponse;

// Alias so frontend can use same entity type
pub type SharedStepStepResponse = TestStepResponse;

#[derive(Debug, Clone, FromRow)]
pub struct SharedStepWithCountRow {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_by_name: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub step_count: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SharedStepSummary {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub step_count: i64,
    pub created_by: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<SharedStepWithCountRow> for SharedStepSummary {
    fn from(row: SharedStepWithCountRow) -> Self {
        Self {
            id: row.id.to_string(),
            name: row.name,
            description: row.description,
            step_count: row.step_count,
            created_by: row.created_by_name,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Debug, Clone, FromRow)]
pub struct SharedStepStepRow {
    pub id: Uuid,
    pub step_order: i32,
    pub action_type: String,
    pub action_params: JsonValue,
    pub assertions: JsonValue,
    pub custom_expected_result: Option<String>,
}

impl From<SharedStepStepRow> for TestStepResponse {
    fn from(row: SharedStepStepRow) -> Self {
        Self {
            id: row.id.to_string(),
            step_type: "regular".to_string(),
            step_order: row.step_order,
            action_type: row.action_type,
            action_params: row.action_params,
            assertions: row.assertions,
            custom_expected_result: row.custom_expected_result,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SharedStepDetailResponse {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub step_count: i64,
    pub created_by: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub steps: Vec<SharedStepStepResponse>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSharedStepRequest {
    pub name: String,
    pub description: Option<String>,
    pub steps: Vec<CreateTestStepRequest>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSharedStepRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub steps: Option<Vec<CreateTestStepRequest>>,
}
