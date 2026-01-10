use chrono::{DateTime, Utc};
use serde::{Serialize};
use serde_json::Value as JsonValue;
use sqlx::FromRow;
use uuid::Uuid;

/// Database model for action definitions
#[derive(Debug, Clone, FromRow, Serialize)]
pub struct ActionDefinition {
    pub id: Uuid,
    pub action_key: String,
    pub label: String,
    pub category: String,
    pub platform: String,
    pub description: Option<String>,
    pub param_schema: JsonValue,
    pub is_system: bool,
    pub created_by: Option<Uuid>,
    pub display_order: i32,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Database model for assertion definitions
#[derive(Debug, Clone, FromRow, Serialize)]
pub struct AssertionDefinition {
    pub id: Uuid,
    pub assertion_key: String,
    pub label: String,
    pub category: String,
    pub description: Option<String>,
    pub param_schema: JsonValue,
    pub valid_for_actions: Vec<String>,
    pub is_system: bool,
    pub created_by: Option<Uuid>,
    pub display_order: i32,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// API Response for action definition
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActionDefinitionResponse {
    pub id: String,
    pub action_key: String,
    pub label: String,
    pub category: String,
    pub platform: String,
    pub description: Option<String>,
    pub param_schema: JsonValue,
    pub is_system: bool,
    pub display_order: i32,
}

impl From<ActionDefinition> for ActionDefinitionResponse {
    fn from(ad: ActionDefinition) -> Self {
        Self {
            id: ad.id.to_string(),
            action_key: ad.action_key,
            label: ad.label,
            category: ad.category,
            platform: ad.platform,
            description: ad.description,
            param_schema: ad.param_schema,
            is_system: ad.is_system,
            display_order: ad.display_order,
        }
    }
}

/// API Response for assertion definition
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssertionDefinitionResponse {
    pub id: String,
    pub assertion_key: String,
    pub label: String,
    pub category: String,
    pub description: Option<String>,
    pub param_schema: JsonValue,
    pub valid_for_actions: Vec<String>,
    pub is_system: bool,
    pub display_order: i32,
}

impl From<AssertionDefinition> for AssertionDefinitionResponse {
    fn from(ad: AssertionDefinition) -> Self {
        Self {
            id: ad.id.to_string(),
            assertion_key: ad.assertion_key,
            label: ad.label,
            category: ad.category,
            description: ad.description,
            param_schema: ad.param_schema,
            valid_for_actions: ad.valid_for_actions,
            is_system: ad.is_system,
            display_order: ad.display_order,
        }
    }
}

/// Combined response for fetching all definitions
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DefinitionsResponse {
    pub actions: Vec<ActionDefinitionResponse>,
    pub assertions: Vec<AssertionDefinitionResponse>,
}

// ================================================================
// IMPLEMENTATION NOTES: User Defined Actions (Future Feature)
// ================================================================
//
// User Defined Actions allow users to create reusable composite actions
// that consist of multiple steps. This is useful for common workflows.
//
// Database table `user_defined_actions` is already created with schema:
// - id: UUID primary key
// - name: Display name for the action
// - description: Optional description
// - steps: JSONB array of step objects (same structure as test_steps)
// - tags: Array of tags for categorization
// - is_shared: Whether this is shared with team or private
// - created_by: User who created it
//
// To implement:
// 1. Create UserDefinedAction model and response types
// 2. Create CRUD handlers for user defined actions
// 3. Update frontend TestCaseForm to:
//    - Show user defined actions in action type dropdown
//    - When selected, expand to show the nested steps (read-only or editable)
//    - Allow overriding parameters for each nested step
// 4. Update test runner to expand user defined actions into individual steps
//
// Example user defined action structure:
// {
//   "name": "Login Flow",
//   "steps": [
//     {"action_type": "navigate", "action_params": {"url": "{{baseUrl}}/login"}},
//     {"action_type": "type", "action_params": {"selector": "#email", "text": "{{email}}"}},
//     {"action_type": "type", "action_params": {"selector": "#password", "text": "{{password}}"}},
//     {"action_type": "click", "action_params": {"selector": "#submit"}},
//     {"action_type": "waitForElement", "action_params": {"selector": "#dashboard"}}
//   ],
//   "parameters": ["baseUrl", "email", "password"]
// }
//
// The {{variable}} syntax allows parameterization when using the action.
// ================================================================
