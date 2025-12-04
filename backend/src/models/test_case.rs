use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct TestCase {
    pub id: Uuid,
    pub case_id: String,  // TC-0001, TC-0002, etc.
    pub title: String,
    pub description: Option<String>,
    pub suite: String,
    pub priority: String,
    pub case_type: String,
    pub automation: String,
    pub last_status: String,
    pub page_load_avg: Option<String>,
    pub last_run: Option<String>,
    pub expected_outcome: Option<String>,
    pub pre_condition: Option<String>,  // Rich text HTML
    pub post_condition: Option<String>, // Rich text HTML
    pub tags: Vec<String>,
    pub execution_order: f64,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub review_status: String,
    pub submitted_for_review_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct TestStep {
    pub id: Uuid,
    pub test_case_id: Uuid,
    pub step_order: i32,
    pub action_type: String,
    pub action_params: JsonValue,
    pub assertions: JsonValue,
    pub custom_expected_result: Option<String>, // Rich text HTML
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct TestCaseWithSteps {
    #[serde(flatten)]
    pub test_case: TestCase,
    pub steps: Vec<TestStep>,
    pub created_by_name: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TestCaseSummary {
    pub id: String,
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
    pub created_by_name: Option<String>,
    pub review_status: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TestCaseResponse {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub suite: String,
    pub priority: String,
    pub case_type: String,
    pub automation: String,
    pub last_status: String,
    pub page_load_avg: Option<String>,
    pub last_run: Option<String>,
    pub expected_outcome: Option<String>,
    pub pre_condition: Option<String>,
    pub post_condition: Option<String>,
    pub tags: Vec<String>,
    pub execution_order: f64,
    pub steps: Vec<TestStepResponse>,
    pub created_by_id: String,
    pub created_by_name: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub review_status: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TestStepResponse {
    pub id: String,
    pub step_order: i32,
    pub action_type: String,
    pub action_params: JsonValue,
    pub assertions: JsonValue,
    pub custom_expected_result: Option<String>,
}

impl TestCaseResponse {
    pub fn from_with_steps(tc: TestCaseWithSteps) -> Self {
        Self {
            id: tc.test_case.case_id.clone(),
            title: tc.test_case.title,
            description: tc.test_case.description,
            suite: tc.test_case.suite,
            priority: tc.test_case.priority,
            case_type: tc.test_case.case_type,
            automation: tc.test_case.automation,
            last_status: tc.test_case.last_status,
            page_load_avg: tc.test_case.page_load_avg,
            last_run: tc.test_case.last_run,
            expected_outcome: tc.test_case.expected_outcome,
            pre_condition: tc.test_case.pre_condition,
            post_condition: tc.test_case.post_condition,
            tags: tc.test_case.tags,
            execution_order: tc.test_case.execution_order,
            steps: tc.steps.into_iter().map(|s| TestStepResponse {
                id: s.id.to_string(),
                step_order: s.step_order,
                action_type: s.action_type,
                action_params: s.action_params,
                assertions: s.assertions,
                custom_expected_result: s.custom_expected_result,
            }).collect(),
            created_by_id: tc.test_case.created_by.to_string(),
            created_by_name: tc.created_by_name,
            created_at: tc.test_case.created_at.to_rfc3339(),
            updated_at: tc.test_case.updated_at.to_rfc3339(),
            review_status: tc.test_case.review_status,
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTestCaseRequest {
    pub title: String,
    pub description: Option<String>,
    pub suite: String,
    pub priority: String,
    pub case_type: String,
    pub automation: String,
    pub expected_outcome: Option<String>,
    pub pre_condition: Option<String>,
    pub post_condition: Option<String>,
    pub tags: Option<Vec<String>>,
    pub steps: Option<Vec<CreateTestStepRequest>>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTestStepRequest {
    pub id: Option<String>,  // Optional: for preserving frontend IDs
    pub step_order: i32,
    pub action_type: String,
    pub action_params: Option<JsonValue>,
    pub assertions: Option<JsonValue>,
    pub custom_expected_result: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTestCaseRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub suite: Option<String>,
    pub priority: Option<String>,
    pub case_type: Option<String>,
    pub automation: Option<String>,
    pub expected_outcome: Option<String>,
    pub pre_condition: Option<String>,
    pub post_condition: Option<String>,
    pub tags: Option<Vec<String>>,
    pub steps: Option<Vec<CreateTestStepRequest>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTestStepsRequest {
    pub steps: Vec<CreateTestStepRequest>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListTestCasesQuery {
    pub search_query: Option<String>,
    pub suite_filter: Option<String>,
    pub priority_filter: Option<String>,
    pub automation_filter: Option<String>,
    pub status_filter: Option<String>,
    pub review_status_filter: Option<String>,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ListTestCasesResponse {
    pub test_cases: Vec<TestCaseSummary>,
    pub total: i64,
    pub page: i32,
    pub page_size: i32,
    pub available_suites: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkDeleteRequest {
    pub test_case_ids: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReorderRequest {
    pub moved_ids: Vec<String>,
    pub prev_id: Option<String>,
    pub next_id: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkDeleteResponse {
    pub success: bool,
    pub deleted_count: i32,
    pub message: String,
}
