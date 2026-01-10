use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::FromRow;
use uuid::Uuid;

// Centralized definitions for actions, assertions, and key options used in test steps.

#[derive(Debug, Serialize)]
pub struct ActionDefinition {
    pub value: &'static str,
    pub label: &'static str,
    pub platform: &'static str, // "both" | "web" | "mobile"
    pub icon: &'static str,
}

#[derive(Debug, Serialize)]
pub struct AssertionDefinition {
    pub value: &'static str,
    pub label: &'static str,
    #[serde(rename = "needsSelector")]
    pub needs_selector: bool,
    #[serde(rename = "needsValue")]
    pub needs_value: bool,
    #[serde(rename = "needsAttribute")]
    pub needs_attribute: bool,
}

#[derive(Debug, Serialize)]
pub struct KeyOption {
    pub value: &'static str,
    pub label: &'static str,
}

// These are the canonical action definitions (mirrors frontend ACTION_DEFINITIONS)
pub static ACTION_DEFINITIONS: &[ActionDefinition] = &[
    ActionDefinition { value: "navigate", label: "Navigate to URL", platform: "both", icon: "🌐" },
    ActionDefinition { value: "click", label: "Click / Tap", platform: "both", icon: "👆" },
    ActionDefinition { value: "type", label: "Type Text", platform: "both", icon: "⌨️" },
    ActionDefinition { value: "clear", label: "Clear Input", platform: "both", icon: "🧹" },
    ActionDefinition { value: "select", label: "Select Option", platform: "both", icon: "📋" },
    ActionDefinition { value: "scroll", label: "Scroll", platform: "both", icon: "📜" },
    ActionDefinition { value: "swipe", label: "Swipe", platform: "mobile", icon: "👉" },
    ActionDefinition { value: "wait", label: "Wait (Duration)", platform: "both", icon: "⏱️" },
    ActionDefinition { value: "waitForElement", label: "Wait for Element", platform: "both", icon: "⏳" },
    ActionDefinition { value: "pressKey", label: "Press Key", platform: "both", icon: "⌨️" },
    ActionDefinition { value: "longPress", label: "Long Press / Hold", platform: "both", icon: "👆⏱️" },
    ActionDefinition { value: "doubleClick", label: "Double Click / Tap", platform: "both", icon: "👆👆" },
    ActionDefinition { value: "hover", label: "Hover", platform: "web", icon: "🖱️" },
    ActionDefinition { value: "dragDrop", label: "Drag and Drop", platform: "both", icon: "↔️" },
    ActionDefinition { value: "back", label: "Go Back", platform: "both", icon: "◀️" },
    ActionDefinition { value: "refresh", label: "Refresh Page", platform: "web", icon: "🔄" },
];

// Canonical assertion definitions (mirrors frontend ASSERTION_DEFINITIONS)
pub static ASSERTION_DEFINITIONS: &[AssertionDefinition] = &[
    AssertionDefinition {
        value: "elementDisplayed",
        label: "Element is Visible",
        needs_selector: true,
        needs_value: false,
        needs_attribute: false,
    },
    AssertionDefinition {
        value: "elementNotDisplayed",
        label: "Element is Hidden",
        needs_selector: true,
        needs_value: false,
        needs_attribute: false,
    },
    AssertionDefinition {
        value: "elementExists",
        label: "Element Exists",
        needs_selector: true,
        needs_value: false,
        needs_attribute: false,
    },
    AssertionDefinition {
        value: "elementClickable",
        label: "Element is Clickable",
        needs_selector: true,
        needs_value: false,
        needs_attribute: false,
    },
    AssertionDefinition {
        value: "elementInViewport",
        label: "Element in Viewport",
        needs_selector: true,
        needs_value: false,
        needs_attribute: false,
    },
    AssertionDefinition {
        value: "textEquals",
        label: "Text Equals",
        needs_selector: true,
        needs_value: true,
        needs_attribute: false,
    },
    AssertionDefinition {
        value: "textContains",
        label: "Text Contains",
        needs_selector: true,
        needs_value: true,
        needs_attribute: false,
    },
    AssertionDefinition {
        value: "valueEquals",
        label: "Value Equals",
        needs_selector: true,
        needs_value: true,
        needs_attribute: false,
    },
    AssertionDefinition {
        value: "valueContains",
        label: "Value Contains",
        needs_selector: true,
        needs_value: true,
        needs_attribute: false,
    },
    AssertionDefinition {
        value: "urlEquals",
        label: "URL Equals",
        needs_selector: false,
        needs_value: true,
        needs_attribute: false,
    },
    AssertionDefinition {
        value: "urlContains",
        label: "URL Contains",
        needs_selector: false,
        needs_value: true,
        needs_attribute: false,
    },
    AssertionDefinition {
        value: "titleEquals",
        label: "Title Equals",
        needs_selector: false,
        needs_value: true,
        needs_attribute: false,
    },
    AssertionDefinition {
        value: "titleContains",
        label: "Title Contains",
        needs_selector: false,
        needs_value: true,
        needs_attribute: false,
    },
    AssertionDefinition {
        value: "hasClass",
        label: "Has CSS Class",
        needs_selector: true,
        needs_value: true,
        needs_attribute: false,
    },
    AssertionDefinition {
        value: "hasAttribute",
        label: "Has Attribute",
        needs_selector: true,
        needs_value: false,
        needs_attribute: true,
    },
    AssertionDefinition {
        value: "isEnabled",
        label: "Is Enabled",
        needs_selector: true,
        needs_value: false,
        needs_attribute: false,
    },
    AssertionDefinition {
        value: "isDisabled",
        label: "Is Disabled",
        needs_selector: true,
        needs_value: false,
        needs_attribute: false,
    },
    AssertionDefinition {
        value: "isSelected",
        label: "Is Selected / Checked",
        needs_selector: true,
        needs_value: false,
        needs_attribute: false,
    },
];

// Key options for the pressKey action (mirrors KEY_OPTIONS)
pub static KEY_OPTIONS: &[KeyOption] = &[
    KeyOption { value: "Enter", label: "Enter" },
    KeyOption { value: "Tab", label: "Tab" },
    KeyOption { value: "Escape", label: "Escape" },
    KeyOption { value: "Backspace", label: "Backspace" },
    KeyOption { value: "Delete", label: "Delete" },
    KeyOption { value: "ArrowUp", label: "Arrow Up" },
    KeyOption { value: "ArrowDown", label: "Arrow Down" },
    KeyOption { value: "ArrowLeft", label: "Arrow Left" },
    KeyOption { value: "ArrowRight", label: "Arrow Right" },
    KeyOption { value: "Space", label: "Space" },
];

#[derive(Debug, Clone, Deserialize, Serialize, sqlx::Type)]
#[sqlx(type_name = "VARCHAR")]
pub enum StepType {
    #[serde(rename = "regular")]
    #[sqlx(rename = "regular")]
    Regular,
    #[serde(rename = "shared_definition")]
    #[sqlx(rename = "shared_definition")]
    SharedDefinition,
    #[serde(rename = "shared_reference")]
    #[sqlx(rename = "shared_reference")]
    SharedReference,
}

impl Default for StepType {
    fn default() -> Self {
        StepType::Regular
    }
}

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct TestStep {
    pub id: Uuid,
    pub test_case_id: Uuid,
    pub step_order: i32,
    pub step_type: StepType,
    pub action_type: String,
    pub action_params: JsonValue,
    pub assertions: JsonValue,
    pub custom_expected_result: Option<String>, // Rich text HTML
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTestStepRequest {
    pub id: Option<String>,  // Optional: for preserving frontend IDs
    #[serde(alias = "step_order")]
    pub step_order: i32,
    /// Step type determines ownership:
    /// - 'regular': owned by a test case (default)
    /// - 'shared_definition': owned by a shared step (definition)
    /// - 'shared_reference': reference from test case to shared step (action fields should be null/empty)
    #[serde(default)]
    pub step_type: StepType,
    pub action_type: String,
    pub action_params: Option<JsonValue>,
    pub assertions: Option<JsonValue>,
    pub custom_expected_result: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTestStepsRequest {
    pub steps: Vec<CreateTestStepRequest>,
}