-- Migration: Update test steps schema for actions and assertions
-- This migration updates the schema to support:
-- 1. Pre-condition and post-condition rich text fields
-- 2. Action steps with JSON parameters
-- 3. Multiple assertions per step (stored as JSONB)
-- 4. Custom expected result per step (rich text)

-- Add pre_condition and post_condition to test_cases
ALTER TABLE test_cases 
ADD COLUMN IF NOT EXISTS pre_condition TEXT,
ADD COLUMN IF NOT EXISTS post_condition TEXT;

-- Drop old test_steps table and recreate with new schema
DROP TABLE IF EXISTS test_steps CASCADE;

CREATE TABLE test_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    -- Action parameters stored as JSONB for flexibility
    -- Example: {"url": "https://example.com"} for navigate
    -- Example: {"selector": "#btn", "text": "Click me"} for click
    action_params JSONB NOT NULL DEFAULT '{}',
    -- Multiple assertions per step stored as JSONB array
    -- Example: [{"type": "elementVisible", "selector": "#success"}, {"type": "textContains", "value": "Success"}]
    assertions JSONB NOT NULL DEFAULT '[]',
    -- Custom expected result (rich text HTML)
    custom_expected_result TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for test_steps
CREATE INDEX idx_test_steps_test_case_id ON test_steps(test_case_id);
CREATE INDEX idx_test_steps_step_order ON test_steps(step_order);
CREATE INDEX idx_test_steps_action_type ON test_steps(action_type);

-- Updated_at trigger for test_steps
CREATE TRIGGER update_test_steps_updated_at
    BEFORE UPDATE ON test_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- Action Definitions Table
-- Stores available action types (can be extended by admins later)
-- ================================================================
CREATE TABLE action_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_key VARCHAR(100) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    platform VARCHAR(50) NOT NULL DEFAULT 'both', -- 'web', 'mobile', 'both'
    description TEXT,
    -- Required parameters schema (JSON Schema format)
    param_schema JSONB NOT NULL DEFAULT '{}',
    -- Is this a system-defined action or user-defined
    is_system BOOLEAN NOT NULL DEFAULT true,
    -- For user-defined actions: the user who created it
    created_by UUID REFERENCES users(id),
    -- Order for display in UI
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- Assertion Definitions Table
-- Stores available assertion types
-- ================================================================
CREATE TABLE assertion_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assertion_key VARCHAR(100) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    description TEXT,
    -- Required parameters schema
    param_schema JSONB NOT NULL DEFAULT '{}',
    -- Which action types this assertion is valid for (empty = all)
    valid_for_actions TEXT[] NOT NULL DEFAULT '{}',
    is_system BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES users(id),
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- User Defined Actions Table (for future nested/composite actions)
-- This is prepared for future implementation
-- ================================================================
CREATE TABLE user_defined_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    -- The steps that make up this user-defined action
    -- Stored as JSONB array of step objects
    steps JSONB NOT NULL DEFAULT '[]',
    -- Tags for categorization
    tags TEXT[] NOT NULL DEFAULT '{}',
    -- Is this shared across team or private
    is_shared BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_action_definitions_category ON action_definitions(category);
CREATE INDEX idx_action_definitions_platform ON action_definitions(platform);
CREATE INDEX idx_assertion_definitions_category ON assertion_definitions(category);
CREATE INDEX idx_user_defined_actions_created_by ON user_defined_actions(created_by);

-- Triggers for updated_at
CREATE TRIGGER update_action_definitions_updated_at
    BEFORE UPDATE ON action_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assertion_definitions_updated_at
    BEFORE UPDATE ON assertion_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_defined_actions_updated_at
    BEFORE UPDATE ON user_defined_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- Seed default action definitions
-- ================================================================
INSERT INTO action_definitions (action_key, label, category, platform, description, param_schema, display_order) VALUES
-- Navigation
('navigate', 'Navigate to URL', 'navigation', 'both', 'Navigate browser/app to specified URL', '{"required": ["url"], "properties": {"url": {"type": "string", "description": "URL to navigate to"}}}', 1),
('back', 'Go Back', 'navigation', 'both', 'Navigate back in history', '{}', 2),
('refresh', 'Refresh Page', 'navigation', 'web', 'Refresh the current page', '{}', 3),

-- Interaction
('click', 'Click / Tap', 'interaction', 'both', 'Click or tap on an element', '{"required": ["selector"], "properties": {"selector": {"type": "string", "description": "Element selector"}}}', 10),
('type', 'Type Text', 'interaction', 'both', 'Type text into an input field', '{"required": ["selector", "text"], "properties": {"selector": {"type": "string"}, "text": {"type": "string"}}}', 11),
('clear', 'Clear Input', 'interaction', 'both', 'Clear text from input field', '{"required": ["selector"], "properties": {"selector": {"type": "string"}}}', 12),
('select', 'Select Option', 'interaction', 'both', 'Select an option from dropdown', '{"required": ["selector", "value"], "properties": {"selector": {"type": "string"}, "value": {"type": "string"}}}', 13),
('hover', 'Hover', 'interaction', 'web', 'Hover over an element', '{"required": ["selector"], "properties": {"selector": {"type": "string"}}}', 14),
('doubleTap', 'Double Click / Tap', 'interaction', 'both', 'Double click or double tap', '{"required": ["selector"], "properties": {"selector": {"type": "string"}}}', 15),
('longPress', 'Long Press / Hold', 'interaction', 'both', 'Long press or hold on element', '{"required": ["selector"], "properties": {"selector": {"type": "string"}, "duration": {"type": "number", "default": 1000}}}', 16),
('dragDrop', 'Drag and Drop', 'interaction', 'both', 'Drag element to target', '{"required": ["sourceSelector", "targetSelector"], "properties": {"sourceSelector": {"type": "string"}, "targetSelector": {"type": "string"}}}', 17),
('pressKey', 'Press Key', 'interaction', 'both', 'Press a keyboard key', '{"required": ["key"], "properties": {"key": {"type": "string", "enum": ["Enter", "Tab", "Escape", "Backspace", "Delete", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]}}}', 18),

-- Scroll & Swipe
('scroll', 'Scroll', 'scroll', 'both', 'Scroll the page or element', '{"properties": {"direction": {"type": "string", "enum": ["up", "down", "left", "right"]}, "pixels": {"type": "number"}, "selector": {"type": "string"}}}', 20),
('swipe', 'Swipe', 'scroll', 'mobile', 'Swipe gesture on mobile', '{"required": ["direction"], "properties": {"direction": {"type": "string", "enum": ["up", "down", "left", "right"]}, "distance": {"type": "number"}}}', 21),

-- Wait
('wait', 'Wait (Duration)', 'wait', 'both', 'Wait for specified duration', '{"required": ["duration"], "properties": {"duration": {"type": "number", "description": "Duration in milliseconds"}}}', 30),
('waitForElement', 'Wait for Element', 'wait', 'both', 'Wait until element appears', '{"required": ["selector"], "properties": {"selector": {"type": "string"}, "timeout": {"type": "number", "default": 10000}}}', 31)

ON CONFLICT (action_key) DO NOTHING;

-- ================================================================
-- Seed default assertion definitions
-- ================================================================
INSERT INTO assertion_definitions (assertion_key, label, category, description, param_schema, valid_for_actions, display_order) VALUES
-- Element assertions
('elementVisible', 'Element Visible', 'element', 'Assert element is visible on page', '{"required": ["selector"], "properties": {"selector": {"type": "string"}}}', '{}', 1),
('elementNotVisible', 'Element Not Visible', 'element', 'Assert element is not visible', '{"required": ["selector"], "properties": {"selector": {"type": "string"}}}', '{}', 2),
('elementExists', 'Element Exists', 'element', 'Assert element exists in DOM', '{"required": ["selector"], "properties": {"selector": {"type": "string"}}}', '{}', 3),
('elementEnabled', 'Element Enabled', 'element', 'Assert element is enabled', '{"required": ["selector"], "properties": {"selector": {"type": "string"}}}', '{}', 4),
('elementDisabled', 'Element Disabled', 'element', 'Assert element is disabled', '{"required": ["selector"], "properties": {"selector": {"type": "string"}}}', '{}', 5),

-- Text assertions
('textContains', 'Text Contains', 'text', 'Assert element contains text', '{"required": ["selector", "value"], "properties": {"selector": {"type": "string"}, "value": {"type": "string"}}}', '{}', 10),
('textEquals', 'Text Equals', 'text', 'Assert element text equals value', '{"required": ["selector", "value"], "properties": {"selector": {"type": "string"}, "value": {"type": "string"}}}', '{}', 11),
('textNotContains', 'Text Not Contains', 'text', 'Assert element does not contain text', '{"required": ["selector", "value"], "properties": {"selector": {"type": "string"}, "value": {"type": "string"}}}', '{}', 12),

-- URL assertions
('urlContains', 'URL Contains', 'url', 'Assert current URL contains value', '{"required": ["value"], "properties": {"value": {"type": "string"}}}', '{navigate,click,back}', 20),
('urlEquals', 'URL Equals', 'url', 'Assert current URL equals value', '{"required": ["value"], "properties": {"value": {"type": "string"}}}', '{navigate,click,back}', 21),

-- Value assertions
('valueEquals', 'Value Equals', 'value', 'Assert input value equals', '{"required": ["selector", "value"], "properties": {"selector": {"type": "string"}, "value": {"type": "string"}}}', '{type,clear,select}', 30),
('valueContains', 'Value Contains', 'value', 'Assert input value contains', '{"required": ["selector", "value"], "properties": {"selector": {"type": "string"}, "value": {"type": "string"}}}', '{type,clear,select}', 31),

-- Attribute assertions
('attributeEquals', 'Attribute Equals', 'attribute', 'Assert element attribute equals value', '{"required": ["selector", "attributeName", "attributeValue"], "properties": {"selector": {"type": "string"}, "attributeName": {"type": "string"}, "attributeValue": {"type": "string"}}}', '{}', 40),
('attributeContains', 'Attribute Contains', 'attribute', 'Assert element attribute contains value', '{"required": ["selector", "attributeName", "attributeValue"], "properties": {"selector": {"type": "string"}, "attributeName": {"type": "string"}, "attributeValue": {"type": "string"}}}', '{}', 41),

-- Count assertions
('elementCount', 'Element Count', 'count', 'Assert number of elements', '{"required": ["selector", "count"], "properties": {"selector": {"type": "string"}, "count": {"type": "number"}}}', '{}', 50),
('elementCountGreaterThan', 'Element Count >', 'count', 'Assert element count greater than', '{"required": ["selector", "count"], "properties": {"selector": {"type": "string"}, "count": {"type": "number"}}}', '{}', 51),

-- State assertions
('pageLoaded', 'Page Loaded', 'state', 'Assert page has finished loading', '{}', '{navigate,click,back,refresh}', 60),
('noErrors', 'No Console Errors', 'state', 'Assert no JavaScript errors in console', '{}', '{}', 61),
('screenshot', 'Take Screenshot', 'state', 'Capture screenshot for comparison', '{"properties": {"name": {"type": "string"}}}', '{}', 62)

ON CONFLICT (assertion_key) DO NOTHING;
