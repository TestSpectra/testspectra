# User Defined Actions - Implementation Plan

## Overview

User Defined Actions allow users to create reusable composite actions that consist of multiple steps. This is useful for common workflows that are repeated across many test cases.

## Database Schema (Already Created)

The `user_defined_actions` table is prepared with the following schema:

```sql
CREATE TABLE user_defined_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    -- The steps that make up this user-defined action (JSONB array)
    steps JSONB NOT NULL DEFAULT '[]',
    -- Tags for categorization
    tags TEXT[] NOT NULL DEFAULT '{}',
    -- Is this shared across team or private
    is_shared BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Data Structure

### User Defined Action Example

```json
{
  "id": "uuid-here",
  "name": "Login Flow",
  "description": "Standard login flow with email and password",
  "steps": [
    {
      "action_type": "navigate",
      "action_params": { "url": "{{baseUrl}}/login" },
      "assertions": [{ "type": "urlContains", "value": "/login" }]
    },
    {
      "action_type": "type",
      "action_params": { "selector": "#email", "text": "{{email}}" },
      "assertions": []
    },
    {
      "action_type": "type",
      "action_params": { "selector": "#password", "text": "{{password}}" },
      "assertions": []
    },
    {
      "action_type": "click",
      "action_params": { "selector": "#submit" },
      "assertions": []
    },
    {
      "action_type": "waitForElement",
      "action_params": { "selector": "#dashboard", "timeout": 10000 },
      "assertions": [{ "type": "elementVisible", "selector": "#dashboard" }]
    }
  ],
  "parameters": ["baseUrl", "email", "password"],
  "is_shared": true
}
```

### Parameter Syntax

The `{{variable}}` syntax allows parameterization when using the action:
- `{{baseUrl}}` - Base URL of the application
- `{{email}}` - User email to login with
- `{{password}}` - User password

## Implementation Steps

### Backend Tasks

1. **Create Rust Models**
   - `UserDefinedAction` struct
   - `UserDefinedActionResponse` struct
   - `CreateUserDefinedActionRequest` struct
   - `UpdateUserDefinedActionRequest` struct

2. **Create CRUD Handlers** (`/api/user-defined-actions`)
   - `GET /api/user-defined-actions` - List all (filter by created_by or is_shared)
   - `POST /api/user-defined-actions` - Create new
   - `GET /api/user-defined-actions/:id` - Get single
   - `PUT /api/user-defined-actions/:id` - Update
   - `DELETE /api/user-defined-actions/:id` - Delete

3. **Update Action Definitions API**
   - Add flag to differentiate system vs user actions
   - Include user-defined actions in definitions response

### Frontend Tasks

1. **Update TestCaseForm Action Dropdown**
   - Add section for "User Defined Actions" in dropdown
   - Show with different styling (e.g., folder icon, different color)
   - When selected, show expandable preview of nested steps

2. **Create User Defined Action Editor**
   - New page/modal to create/edit user-defined actions
   - Similar UI to TestCaseForm but for creating reusable actions
   - Parameter detection from `{{variable}}` syntax
   - Preview of the action sequence

3. **Parameter Override UI**
   - When user selects a user-defined action in test case
   - Show input fields for each parameter
   - Allow overriding default values

4. **Action Library Page**
   - List all available user-defined actions
   - Filter by tags, creator, shared status
   - Quick actions: duplicate, edit, delete

### Test Runner Integration

1. **Expand User Defined Actions**
   - Before running test, expand all user-defined actions into individual steps
   - Replace `{{parameter}}` with actual values

2. **Reporting**
   - Show expanded steps in test report
   - Group by original user-defined action for clarity

## API Response Changes

When fetching definitions, include user-defined actions:

```json
{
  "actions": [...system actions...],
  "assertions": [...assertions...],
  "userDefinedActions": [
    {
      "id": "uuid",
      "name": "Login Flow",
      "description": "...",
      "parameters": ["baseUrl", "email", "password"],
      "stepCount": 5,
      "createdBy": "Ahmad R.",
      "isShared": true
    }
  ]
}
```

## UI/UX Considerations

1. **Visual Differentiation**
   - Use folder/package icon for user-defined actions
   - Different background color in action type dropdown
   - Show step count badge

2. **Inline Expansion**
   - When hovering over user-defined action, show tooltip with step preview
   - Click to expand/collapse nested steps in test case form

3. **Validation**
   - Ensure all required parameters are provided
   - Validate parameter syntax in action params

## Timeline

- **Phase 1**: Backend CRUD for user-defined actions (1-2 days)
- **Phase 2**: Frontend action library page (2-3 days)
- **Phase 3**: Integration in TestCaseForm (2-3 days)
- **Phase 4**: Test runner integration (1-2 days)

## Related Files

- `backend/src/models/action_definition.rs` - Contains implementation notes
- `backend/migrations/20241126005_update_test_steps_schema.sql` - Schema
- `frontend/src/components/TestCaseForm.tsx` - Will need updates
