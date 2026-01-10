use axum::{
    extract::{Path, State},
    http::HeaderMap,
    routing::{get, put},
    Json, Router,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::{extract_bearer_token, JwtService};
use crate::error::AppError;
use crate::models::test_case::{TestCase, TestCaseResponse, TestCaseWithSteps};
use crate::models::test_step::*;
use crate::models::shared_step::{SharedStepSummary, SharedStepWithCountRow};
use sqlx::PgPool;

fn is_valid_action_type(action_type: &str) -> bool {
    ACTION_DEFINITIONS
        .iter()
        .any(|def| def.value.eq_ignore_ascii_case(action_type))
}

fn is_valid_assertion_type(assertion_type: &str) -> bool {
    ASSERTION_DEFINITIONS
        .iter()
        .any(|def| def.value == assertion_type)
}

fn get_assertion_definition(assertion_type: &str) -> Option<&'static AssertionDefinition> {
    ASSERTION_DEFINITIONS
        .iter()
        .find(|def| def.value == assertion_type)
}

fn allowed_assertions_for_action(action_type: &str) -> &'static [&'static str] {
    match action_type {
        "navigate" => &[
            "urlContains",
            "urlEquals",
            "titleContains",
            "titleEquals",
            "elementDisplayed",
            "elementExists",
        ],
        "click" => &[
            "elementDisplayed",
            "elementNotDisplayed",
            "elementExists",
            "textContains",
            "textEquals",
            "urlContains",
            "hasClass",
            "isEnabled",
            "isDisabled",
        ],
        "type" => &[
            "valueEquals",
            "valueContains",
            "elementDisplayed",
            "hasClass",
            "isEnabled",
            "textContains",
        ],
        "clear" => &["valueEquals", "elementDisplayed"],
        "select" => &[
            "valueEquals",
            "isSelected",
            "textEquals",
            "elementDisplayed",
        ],
        "scroll" => &["elementDisplayed", "elementInViewport", "elementExists"],
        "swipe" => &[
            "elementDisplayed",
            "elementNotDisplayed",
            "elementExists",
            "hasAttribute",
        ],
        "wait" => &[
            "elementDisplayed",
            "elementExists",
            "elementClickable",
            "hasAttribute",
        ],
        "waitForElement" => &[
            "elementDisplayed",
            "elementExists",
            "elementClickable",
            "hasAttribute",
        ],
        "pressKey" => &[
            "elementDisplayed",
            "valueContains",
            "textContains",
            "urlContains",
        ],
        "longPress" => &[
            "elementDisplayed",
            "textContains",
            "hasClass",
            "elementExists",
        ],
        "doubleClick" => &[
            "elementDisplayed",
            "textContains",
            "hasClass",
            "elementExists",
        ],
        "hover" => &[
            "elementDisplayed",
            "hasClass",
            "hasAttribute",
            "textContains",
        ],
        "dragDrop" => &["elementDisplayed", "hasClass", "elementExists"],
        "back" => &["urlContains", "elementDisplayed", "titleContains"],
        "refresh" => &["elementDisplayed", "elementExists"],
        _ => &[],
    }
}

fn is_valid_key_option(key: &str) -> bool {
    KEY_OPTIONS.iter().any(|opt| opt.value == key)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct IncomingAssertion {
    #[serde(rename = "assertionType")]
    assertion_type: String,
    selector: Option<String>,
    #[serde(rename = "expectedValue")]
    expected_value: Option<String>,
    #[serde(rename = "attributeName")]
    attribute_name: Option<String>,
    #[serde(rename = "attributeValue")]
    attribute_value: Option<String>,
}

// Helper function to clean up action_params based on action_type
fn cleanup_action_params(action_type: &str, params: &serde_json::Value) -> serde_json::Value {
    if !params.is_object() {
        return serde_json::json!({});
    }

    let obj = params.as_object().unwrap();
    let mut cleaned = serde_json::Map::new();

    match action_type {
        "navigate" => {
            if let Some(url) = obj.get("url") {
                cleaned.insert("url".to_string(), url.clone());
            }
        }
        "click" | "doubleClick" | "longPress" => {
            if let Some(selector) = obj.get("selector") {
                cleaned.insert("selector".to_string(), selector.clone());
            }
            if let Some(text) = obj.get("text") {
                cleaned.insert("text".to_string(), text.clone());
            }
        }
        "type" => {
            if let Some(selector) = obj.get("selector") {
                cleaned.insert("selector".to_string(), selector.clone());
            }
            if let Some(value) = obj.get("value") {
                cleaned.insert("value".to_string(), value.clone());
            }
        }
        "clear" | "hover" => {
            if let Some(selector) = obj.get("selector") {
                cleaned.insert("selector".to_string(), selector.clone());
            }
        }
        "select" => {
            if let Some(selector) = obj.get("selector") {
                cleaned.insert("selector".to_string(), selector.clone());
            }
            if let Some(value) = obj.get("value") {
                cleaned.insert("value".to_string(), value.clone());
            }
        }
        "scroll" | "swipe" => {
            if let Some(direction) = obj.get("direction") {
                cleaned.insert("direction".to_string(), direction.clone());
            }
            if let Some(selector) = obj.get("selector") {
                cleaned.insert("selector".to_string(), selector.clone());
            }
        }
        "wait" => {
            if let Some(timeout) = obj.get("timeout") {
                cleaned.insert("timeout".to_string(), timeout.clone());
            }
        }
        "waitForElement" => {
            if let Some(selector) = obj.get("selector") {
                cleaned.insert("selector".to_string(), selector.clone());
            }
            if let Some(timeout) = obj.get("timeout") {
                cleaned.insert("timeout".to_string(), timeout.clone());
            }
        }
        "pressKey" => {
            if let Some(key) = obj.get("key") {
                cleaned.insert("key".to_string(), key.clone());
            }
        }
        "dragDrop" => {
            if let Some(selector) = obj.get("selector") {
                cleaned.insert("selector".to_string(), selector.clone());
            }
            if let Some(target) = obj.get("targetSelector") {
                cleaned.insert("targetSelector".to_string(), target.clone());
            }
        }
        "back" | "refresh" => {
            // No params needed
        }
        _ => {
            // Unknown action type, keep all params
            return params.clone();
        }
    }

    serde_json::Value::Object(cleaned)
}

// Validate a single test step against the canonical definitions and
// return cleaned action_params and assertions JSON values to be stored.
pub(crate) fn validate_and_prepare_step(
    step: &CreateTestStepRequest,
) -> Result<(serde_json::Value, serde_json::Value), AppError> {
    let action_type = step.action_type.as_str();

    if !is_valid_action_type(action_type) {
        return Err(AppError::BadRequest(format!(
            "Invalid action type: {}",
            action_type
        )));
    }

    // Validate and clean action params using existing logic
    let raw_params = step
        .action_params
        .clone()
        .unwrap_or_else(|| serde_json::json!({}));
    let action_params = cleanup_action_params(action_type, &raw_params);

    // Validate assertions
    let assertions_value = step
        .assertions
        .clone()
        .unwrap_or_else(|| serde_json::json!([]));

    if !assertions_value.is_array() {
        return Err(AppError::BadRequest(
            "Assertions must be an array".to_string(),
        ));
    }

    let allowed_for_action = allowed_assertions_for_action(action_type);

    for item in assertions_value.as_array().unwrap() {
        let assertion: IncomingAssertion = serde_json::from_value(item.clone())
            .map_err(|_| AppError::BadRequest("Invalid assertion format".to_string()))?;

        if !is_valid_assertion_type(&assertion.assertion_type) {
            return Err(AppError::BadRequest(format!(
                "Invalid assertion type: {}",
                assertion.assertion_type
            )));
        }

        if !allowed_for_action
            .iter()
            .any(|allowed| *allowed == assertion.assertion_type)
        {
            return Err(AppError::BadRequest(format!(
                "Assertion '{}' is not allowed for action '{}'",
                assertion.assertion_type, action_type
            )));
        }

        if let Some(def) = get_assertion_definition(&assertion.assertion_type) {
            if def.needs_selector
                && assertion
                    .selector
                    .as_ref()
                    .map(|s| s.trim().is_empty())
                    .unwrap_or(true)
            {
                return Err(AppError::BadRequest(format!(
                    "Assertion '{}' requires a selector",
                    assertion.assertion_type
                )));
            }

            if def.needs_value
                && assertion
                    .expected_value
                    .as_ref()
                    .map(|s| s.trim().is_empty())
                    .unwrap_or(true)
            {
                return Err(AppError::BadRequest(format!(
                    "Assertion '{}' requires an expectedValue",
                    assertion.assertion_type
                )));
            }

            if def.needs_attribute
                && assertion
                    .attribute_name
                    .as_ref()
                    .map(|s| s.trim().is_empty())
                    .unwrap_or(true)
            {
                return Err(AppError::BadRequest(format!(
                    "Assertion '{}' requires an attributeName",
                    assertion.assertion_type
                )));
            }
        }
    }

    // Additional validation for specific actions
    if action_type == "pressKey" {
        if let Some(key_val) = action_params.get("key").and_then(|v| v.as_str()) {
            if !is_valid_key_option(key_val) {
                return Err(AppError::BadRequest(format!(
                    "Invalid key '{}' for pressKey action",
                    key_val
                )));
            }
        } else {
            return Err(AppError::BadRequest(
                "pressKey action requires a 'key' parameter".to_string(),
            ));
        }
    }

    Ok((action_params, assertions_value))
}

// Endpoint to expose canonical action/assertion/key definitions to the frontend
pub async fn get_test_step_metadata(
    State(state): State<TestStepState>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, AppError> {
    // Reuse the same auth as other test case endpoints
    verify_token(&state, &headers)?;

    let actions: Vec<serde_json::Value> = ACTION_DEFINITIONS
        .iter()
        .map(|a| {
            serde_json::json!({
                "value": a.value,
                "label": a.label,
                "platform": a.platform,
                "icon": a.icon,
            })
        })
        .collect();

    let assertions: Vec<serde_json::Value> = ASSERTION_DEFINITIONS
        .iter()
        .map(|a| {
            serde_json::json!({
                "value": a.value,
                "label": a.label,
                "needsSelector": a.needs_selector,
                "needsValue": a.needs_value,
                "needsAttribute": a.needs_attribute,
            })
        })
        .collect();

    let mut assertions_by_action = serde_json::Map::new();
    for action in ACTION_DEFINITIONS {
        let allowed = allowed_assertions_for_action(action.value);
        assertions_by_action.insert(action.value.to_string(), serde_json::json!(allowed));
    }

    let key_options: Vec<serde_json::Value> = KEY_OPTIONS
        .iter()
        .map(|k| serde_json::json!({ "value": k.value, "label": k.label }))
        .collect();

    // Fetch shared steps summary for metadata response
    let rows: Vec<SharedStepWithCountRow> = sqlx::query_as(
        r#"
        SELECT s.id,
               s.name,
               s.description,
               u.name AS created_by_name,
               s.created_at,
               s.updated_at,
               COALESCE(COUNT(t.id), 0) AS step_count
        FROM shared_steps s
        LEFT JOIN users u ON s.created_by = u.id
        LEFT JOIN test_steps t
               ON t.shared_step_id = s.id
              AND t.test_case_id IS NULL
              AND t.step_type = 'shared_definition'
        GROUP BY s.id, s.name, s.description, u.name, s.created_at, s.updated_at
        ORDER BY s.created_at DESC
        "#,
    )
    .fetch_all(&state.db)
    .await?;

    let shared_steps: Vec<SharedStepSummary> =
        rows.into_iter().map(SharedStepSummary::from).collect();

    Ok(Json(serde_json::json!({
        "actions": actions,
        "assertions": assertions,
        "assertionsByAction": assertions_by_action,
        "sharedSteps": shared_steps,
        "keyOptions": key_options,
    })))
}

// Handler to replace all steps for a given test case
pub async fn update_test_steps(
    State(state): State<TestStepState>,
    headers: HeaderMap,
    Path(case_id): Path<String>,
    Json(payload): Json<UpdateTestStepsRequest>,
) -> Result<Json<TestCaseResponse>, AppError> {
    verify_token(&state, &headers)?;

    let test_case: TestCase = sqlx::query_as("SELECT * FROM test_cases WHERE case_id = $1")
        .bind(&case_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Test case not found".to_string()))?;

    // Delete existing steps
    sqlx::query("DELETE FROM test_steps WHERE test_case_id = $1")
        .bind(test_case.id)
        .execute(&state.db)
        .await?;

    // Insert new steps with proper ordering (use array index for step_order)
    let mut steps = Vec::new();
    for (order, step) in payload.steps.iter().enumerate() {
        let step_id = Uuid::new_v4();

        // Validate and normalize according to backend definitions
        let (action_params, assertions) = validate_and_prepare_step(step)?;

        let inserted: TestStep = sqlx::query_as(
            r#"INSERT INTO test_steps 
               (id, test_case_id, step_order, action_type, action_params, assertions, custom_expected_result)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               RETURNING *"#
        )
        .bind(step_id)
        .bind(test_case.id)
        .bind((order + 1) as i32)  // Always use array index + 1 for ordering
        .bind(&step.action_type)
        .bind(&action_params)
        .bind(&assertions)
        .bind(&step.custom_expected_result)
        .fetch_one(&state.db)
        .await?;
        steps.push(inserted);
    }

    // Update test case timestamp
    sqlx::query("UPDATE test_cases SET updated_at = NOW() WHERE id = $1")
        .bind(test_case.id)
        .execute(&state.db)
        .await?;

    let creator_name: Option<(String,)> = sqlx::query_as("SELECT name FROM users WHERE id = $1")
        .bind(test_case.created_by)
        .fetch_optional(&state.db)
        .await?;

    Ok(Json(TestCaseResponse::from_with_steps(TestCaseWithSteps {
        test_case,
        steps,
        created_by_name: creator_name.map(|(n,)| n),
    })))
}

#[derive(Clone)]
pub struct TestStepState {
    pub db: PgPool,
    pub jwt: JwtService,
}

// Public router for test-step-specific routes
pub fn test_step_routes(state: TestStepState) -> Router {
    Router::new()
        .route("/test-steps/metadata", get(get_test_step_metadata))
        .route("/test-steps/:caseId", put(update_test_steps))
        .with_state(state)
}

fn verify_token(state: &TestStepState, headers: &HeaderMap) -> Result<String, AppError> {
    let token = extract_bearer_token(headers.get("authorization").and_then(|v| v.to_str().ok()))
        .ok_or_else(|| AppError::Unauthorized("Missing token".to_string()))?;

    state
        .jwt
        .get_user_id_from_token(&token)
        .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))
}
