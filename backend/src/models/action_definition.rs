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