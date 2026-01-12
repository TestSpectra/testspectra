use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::FromRow;
use uuid::Uuid;

use crate::models::test_step::CreateTestStepRequest;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct TestCase {
    pub id: Uuid,
    pub case_id: String,  // TC-0001, TC-0002, etc.
    pub title: String,
    pub description: Option<String>,
    pub suite: String,
    pub priority: Priority,
    pub case_type: CaseType,
    pub automation: AutomationStatus,
    pub last_status: String,
    pub page_load_avg: Option<String>,
    pub last_run: Option<String>,
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

#[derive(Debug, Clone, PartialEq, Eq, Hash, Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub enum Priority {
    Low,
    Medium,
    High,
    Critical,
}

impl std::fmt::Display for Priority {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Priority::Low => write!(f, "Low"),
            Priority::Medium => write!(f, "Medium"),
            Priority::High => write!(f, "High"),
            Priority::Critical => write!(f, "Critical"),
        }
    }
}

impl std::str::FromStr for Priority {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Low" => Ok(Priority::Low),
            "Medium" => Ok(Priority::Medium),
            "High" => Ok(Priority::High),
            "Critical" => Ok(Priority::Critical),
            _ => Err(format!("'{}' is not a valid Priority", s)),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub enum CaseType {
    Positive,
    Negative,
    Edge,
}

impl std::fmt::Display for CaseType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CaseType::Positive => write!(f, "Positive"),
            CaseType::Negative => write!(f, "Negative"),
            CaseType::Edge => write!(f, "Edge"),
        }
    }
}

impl std::str::FromStr for CaseType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Positive" => Ok(CaseType::Positive),
            "Negative" => Ok(CaseType::Negative),
            "Edge" => Ok(CaseType::Edge),
            _ => Err(format!("'{}' is not a valid CaseType", s)),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub enum AutomationStatus {
    Manual,
    Automated,
}

impl std::fmt::Display for AutomationStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AutomationStatus::Manual => write!(f, "Manual"),
            AutomationStatus::Automated => write!(f, "Automated"),
        }
    }
}

impl std::str::FromStr for AutomationStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Manual" => Ok(AutomationStatus::Manual),
            "Automated" => Ok(AutomationStatus::Automated),
            _ => Err(format!("'{}' is not a valid AutomationStatus", s)),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct TestCaseWithSteps {
    #[serde(flatten)]
    pub test_case: TestCase,
    pub steps: Vec<NestedTestStepResponse>, // Changed to nested response
    pub created_by_name: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TestCaseSummary {
    pub id: String,
    pub title: String,
    pub suite: String,
    pub priority: Priority,
    pub case_type: CaseType,
    pub automation: AutomationStatus,
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
    pub pre_condition: Option<String>,
    pub post_condition: Option<String>,
    pub tags: Vec<String>,
    pub execution_order: f64,
    pub steps: Vec<NestedTestStepResponse>, // Changed to nested response
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
    pub step_type: String,
    pub step_order: i32,
    pub action_type: String,
    pub action_params: JsonValue,
    pub assertions: JsonValue,
    pub custom_expected_result: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NestedTestStepResponse {
    pub id: String,
    pub step_type: String, // "regular" or "shared"
    pub step_order: i32,
    // For regular steps - always present
    #[serde(skip_serializing_if = "Option::is_none")]
    pub action_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub action_params: Option<JsonValue>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub assertions: Option<JsonValue>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_expected_result: Option<String>,
    // For shared steps
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shared_step_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shared_step_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shared_step_description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub steps: Option<Vec<NestedTestStepResponse>>, // Nested steps for shared references
}

impl TestCaseResponse {
    pub fn from_with_nested_steps(tc: TestCaseWithSteps) -> Self {
        Self {
            id: tc.test_case.case_id.clone(),
            title: tc.test_case.title,
            description: tc.test_case.description,
            suite: tc.test_case.suite,
            priority: tc.test_case.priority.to_string(), // Convert enum to string
            case_type: tc.test_case.case_type.to_string(), // Convert enum to string
            automation: tc.test_case.automation.to_string(), // Convert enum to string
            last_status: tc.test_case.last_status,
            page_load_avg: tc.test_case.page_load_avg,
            last_run: tc.test_case.last_run,
            pre_condition: tc.test_case.pre_condition,
            post_condition: tc.test_case.post_condition,
            tags: tc.test_case.tags,
            execution_order: tc.test_case.execution_order,
            steps: tc.steps,
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
    pub priority: Priority,
    pub case_type: CaseType,
    pub automation: AutomationStatus,
    pub pre_condition: Option<String>,
    pub post_condition: Option<String>,
    pub tags: Option<Vec<String>>,
    pub steps: Option<Vec<CreateTestStepRequest>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTestCaseRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub suite: Option<String>,
    pub priority: Option<Priority>,
    pub case_type: Option<CaseType>,
    pub automation: Option<AutomationStatus>,
    pub pre_condition: Option<String>,
    pub post_condition: Option<String>,
    pub tags: Option<Vec<String>>,
    pub steps: Option<Vec<CreateTestStepRequest>>,
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

// SQLX Type and Decode implementations for enums
impl sqlx::Type<sqlx::Postgres> for Priority {
    fn type_info() -> sqlx::postgres::PgTypeInfo {
        sqlx::postgres::PgTypeInfo::with_name("VARCHAR")
    }
}

impl<'r> sqlx::Decode<'r, sqlx::Postgres> for Priority {
    fn decode(
        value: sqlx::postgres::PgValueRef<'r>,
    ) -> Result<Self, sqlx::error::BoxDynError> {
        let s = <String as sqlx::Decode<sqlx::Postgres>>::decode(value)?;
        s.parse().map_err(Into::into)
    }
}
impl<'q> sqlx::Encode<'q, sqlx::Postgres> for Priority {
    fn encode_by_ref(
        &self,
        buf: &mut sqlx::postgres::PgArgumentBuffer,
    ) -> sqlx::encode::IsNull {
        let s = self.to_string();
        <String as sqlx::Encode<sqlx::Postgres>>::encode_by_ref(&s, buf)
    }
}

impl sqlx::Type<sqlx::Postgres> for CaseType {
    fn type_info() -> sqlx::postgres::PgTypeInfo {
        sqlx::postgres::PgTypeInfo::with_name("VARCHAR")
    }
}

impl<'r> sqlx::Decode<'r, sqlx::Postgres> for CaseType {
    fn decode(
        value: sqlx::postgres::PgValueRef<'r>,
    ) -> Result<Self, sqlx::error::BoxDynError> {
        let s = <String as sqlx::Decode<sqlx::Postgres>>::decode(value)?;
        s.parse().map_err(Into::into)
    }
}

impl<'q> sqlx::Encode<'q, sqlx::Postgres> for CaseType {
    fn encode_by_ref(
        &self,
        buf: &mut sqlx::postgres::PgArgumentBuffer,
    ) -> sqlx::encode::IsNull {
        let s = self.to_string();
        <String as sqlx::Encode<sqlx::Postgres>>::encode_by_ref(&s, buf)
    }
}

impl sqlx::Type<sqlx::Postgres> for AutomationStatus {
    fn type_info() -> sqlx::postgres::PgTypeInfo {
        sqlx::postgres::PgTypeInfo::with_name("VARCHAR")
    }
}

impl<'r> sqlx::Decode<'r, sqlx::Postgres> for AutomationStatus {
    fn decode(
        value: sqlx::postgres::PgValueRef<'r>,
    ) -> Result<Self, sqlx::error::BoxDynError> {
        let s = <String as sqlx::Decode<sqlx::Postgres>>::decode(value)?;
        s.parse().map_err(Into::into)
    }
}

impl<'q> sqlx::Encode<'q, sqlx::Postgres> for AutomationStatus {
    fn encode_by_ref(
        &self,
        buf: &mut sqlx::postgres::PgArgumentBuffer,
    ) -> sqlx::encode::IsNull {
        let s = self.to_string();
        <String as sqlx::Encode<sqlx::Postgres>>::encode_by_ref(&s, buf)
    }
}
