use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
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
    pub tags: Vec<String>,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct TestStep {
    pub id: Uuid,
    pub test_case_id: Uuid,
    pub step_order: i32,
    pub action: String,
    pub target: Option<String>,
    pub value: Option<String>,
    pub description: Option<String>,
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
    pub created_by_name: Option<String>,
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
    pub tags: Vec<String>,
    pub steps: Vec<TestStepResponse>,
    pub created_by_id: String,
    pub created_by_name: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TestStepResponse {
    pub step_order: i32,
    pub action: String,
    pub target: Option<String>,
    pub value: Option<String>,
    pub description: Option<String>,
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
            tags: tc.test_case.tags,
            steps: tc.steps.into_iter().map(|s| TestStepResponse {
                step_order: s.step_order,
                action: s.action,
                target: s.target,
                value: s.value,
                description: s.description,
            }).collect(),
            created_by_id: tc.test_case.created_by.to_string(),
            created_by_name: tc.created_by_name,
            created_at: tc.test_case.created_at.to_rfc3339(),
            updated_at: tc.test_case.updated_at.to_rfc3339(),
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
    pub tags: Option<Vec<String>>,
    pub steps: Option<Vec<CreateTestStepRequest>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTestStepRequest {
    pub step_order: i32,
    pub action: String,
    pub target: Option<String>,
    pub value: Option<String>,
    pub description: Option<String>,
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
    pub tags: Option<Vec<String>>,
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkDeleteResponse {
    pub success: bool,
    pub deleted_count: i32,
    pub message: String,
}
