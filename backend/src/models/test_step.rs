use serde::{Serialize};

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
