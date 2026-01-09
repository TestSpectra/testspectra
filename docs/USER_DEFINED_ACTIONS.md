# Shared Steps - Implementation Plan

## Overview

Shared Steps allow users to create reusable collections of test steps that can be used across multiple test cases. This feature enables teams to standardize common workflows (like login flows, setup procedures, or complex interactions) and maintain them in one central location.

## Benefits

- **Reusability**: Create once, use everywhere
- **Maintainability**: Update shared steps in one place, changes reflect across all test cases
- **Consistency**: Ensure standard procedures are followed consistently
- **Efficiency**: Quickly add common workflows to test cases

## Database Schema (New Migration Needed)

We need to create a new `shared_steps` table with the following schema:

```sql
CREATE TABLE shared_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_shared_steps_created_by ON shared_steps(created_by);
CREATE INDEX idx_shared_steps_name ON shared_steps(name);

-- Trigger for updated_at
CREATE TRIGGER update_shared_steps_updated_at
    BEFORE UPDATE ON shared_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migration for test_steps table to support shared steps
ALTER TABLE test_steps 
ALTER COLUMN test_case_id DROP NOT NULL,
ADD COLUMN IF NOT EXISTS step_type VARCHAR(20) NOT NULL DEFAULT 'regular',
ADD COLUMN IF NOT EXISTS shared_step_id UUID REFERENCES shared_steps(id);

-- Index for shared step lookups
CREATE INDEX idx_test_steps_shared_step_id ON test_steps(shared_step_id);
```

## Data Structure

### Shared Step Metadata

```json
{
  "id": "uuid-here",
  "name": "Login Flow",
  "description": "Standard login flow with email and password",
  "created_by": "user-uuid",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Shared Step Implementation Data

When a shared step is created, individual `test_steps` records are created that belong ONLY to the shared step:

```sql
-- Create shared step definition
INSERT INTO shared_steps (id, name, description, created_by)
VALUES ('shared-uuid', 'Login Flow', 'Standard login flow', 'user-uuid');

-- Create individual steps that belong to this shared step (NO test_case_id)
INSERT INTO test_steps (shared_step_id, step_order, action_type, action_params, assertions)
VALUES 
  ('shared-uuid', 1, 'navigate', '{"url": "https://example.com/login"}', '[{"assertionType": "urlContains", "expectedValue": "/login"}]'),
  ('shared-uuid', 2, 'type', '{"selector": "#email", "text": "user@example.com"}', '[]'),
  ('shared-uuid', 3, 'type', '{"selector": "#password", "text": "password123"}', '[]'),
  ('shared-uuid', 4, 'click', '{"selector": "#submit"}', '[]'),
  ('shared-uuid', 5, 'waitForElement', '{"selector": "#dashboard", "timeout": 10000}', '[{"assertionType": "elementVisible", "selector": "#dashboard"}]');
```

### Usage in Test Case

When adding a shared step to a test case, create a single reference record:

```sql
-- Regular step
INSERT INTO test_steps (test_case_id, step_order, step_type, action_type, action_params, assertions)
VALUES ('test-case-uuid', 1, 'regular', 'navigate', '{"url": "https://app.example.com"}', '[]');

-- Reference to shared step (single record, no duplicate data)
INSERT INTO test_steps (test_case_id, step_order, step_type, shared_step_id)
VALUES ('test-case-uuid', 2, 'shared', 'shared-step-uuid');
```

**API Response with JOIN:**
When fetching test case steps, API will resolve shared step data:

```json
{
  "steps": [
    {
      "id": "step-1",
      "stepType": "regular",
      "actionType": "navigate",
      "actionParams": { "url": "https://app.example.com" },
      "assertions": []
    },
    {
      "id": "step-2", 
      "stepType": "shared",
      "sharedStepId": "shared-step-uuid",
      "sharedStepName": "Login Flow",
      "sharedSteps": [  // Nested steps from shared step definition
        {
          "actionType": "navigate",
          "actionParams": { "url": "https://example.com/login" },
          "assertions": [{"assertionType": "urlContains", "expectedValue": "/login"}]
        },
        {
          "actionType": "type",
          "actionParams": { "selector": "#email", "text": "user@example.com" },
          "assertions": []
        },
        {
          "actionType": "type",
          "actionParams": { "selector": "#password", "text": "password123" },
          "assertions": []
        },
        {
          "actionType": "click",
          "actionParams": { "selector": "#submit" },
          "assertions": []
        },
        {
          "actionType": "waitForElement",
          "actionParams": { "selector": "#dashboard", "timeout": 10000 },
          "assertions": [{"assertionType": "elementVisible", "selector": "#dashboard"}]
        }
      ]
    }
  ]
}
```

## Implementation Steps

### Backend Tasks

1. **Create Rust Models**
   - `SharedStep` struct
   - `SharedStepResponse` struct  
   - `CreateSharedStepRequest` struct
   - `UpdateSharedStepRequest` struct

2. **Create CRUD Handlers** (`/api/shared-steps`)
   - `GET /api/shared-steps` - List all shared steps
   - `POST /api/shared-steps` - Create new shared step
   - `GET /api/shared-steps/:id` - Get single shared step
   - `PUT /api/shared-steps/:id` - Update shared step
   - `DELETE /api/shared-steps/:id` - Delete shared step

3. **Update Action Definitions API**
   - Add shared steps to the metadata response
   - Include shared steps in test step definitions response

4. **Step Validation**
   - Validate each step matches regular step structure
   - Ensure action types and assertions are valid

### Frontend Tasks

1. **Update TestCaseForm Step Addition**
   - Add "Add Shared Step" button alongside regular "Add Step"
   - Create shared step selection modal with search
   - Show shared steps with different visual styling (e.g., folder icon, badge)
   - Display step count for each shared step

2. **Create Shared Step Editor**
   - New page/modal to create/edit shared steps
   - Similar UI to TestCaseForm but for creating reusable step collections
   - Validate steps during creation
   - Preview of the step sequence

3. **Shared Step Display in TestCaseForm**
   - Show shared steps using TestCaseDisplay component style
   - No input fields - display only
   - Steps collapsed by default, expandable on click
   - Show distinctive styling to differentiate from regular steps

4. **Shared Steps Library Page**
   - List all available shared steps with search
   - Quick actions: duplicate, edit, delete, use in test case
   - Show usage statistics (how many test cases use each shared step)

### Test Runner Integration

1. **Expand Shared Steps**
   - Before running test, expand all shared steps into individual test steps
   - Maintain step numbering and hierarchy for reporting

2. **Reporting**
   - Show expanded steps in test execution report
   - Group steps by original shared step for clarity
   - Link back to shared step definition for debugging

## API Response Changes

When fetching test step metadata, include shared steps:

```json
{
  "actions": [...system actions...],
  "assertions": [...assertions...],
  "sharedSteps": [
    {
      "id": "uuid",
      "name": "Login Flow",
      "description": "Standard authentication flow",
      "stepCount": 5,
      "createdBy": "Ahmad R.",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "keyOptions": [...]
}
```

## Test Case Data Structure Changes

The `test_steps` table will be extended to support shared steps:

**Current test_steps table:**
```sql
CREATE TABLE test_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_params JSONB NOT NULL DEFAULT '{}',
    assertions JSONB NOT NULL DEFAULT '[]',
    custom_expected_result TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**After migration:**
```sql
ALTER TABLE test_steps 
ADD COLUMN IF NOT EXISTS step_type VARCHAR(20) NOT NULL DEFAULT 'regular',
ADD COLUMN IF NOT EXISTS shared_step_id UUID REFERENCES shared_steps(id);
```

**Data Examples:**
- **Regular step**: `step_type='regular', test_case_id='uuid', shared_step_id=NULL, action_type='navigate'`
- **Shared step definition**: `step_type='regular', test_case_id=NULL, shared_step_id='uuid', action_type='navigate'`
- **Shared step reference**: `step_type='shared', test_case_id='uuid', shared_step_id='uuid', action_type=NULL`

## UI/UX Considerations

1. **Visual Differentiation**
   - Use folder/package icon for shared steps
   - Different background color and border styling
   - Show step count badge
   - Clear indication that steps are collapsed by default

2. **Interactive Elements**
   - Hover tooltip with step preview
   - Click to expand/collapse nested steps in test case form
   - No editing capability - display only

3. **Search and Discovery**
   - Full-text search across shared step names and descriptions
   - Recently used shared steps
   - Popular shared steps (most used)

4. **Validation and Feedback**
   - Validate step structure during creation
   - Ensure action types and assertions are valid
   - Real-time validation feedback

5. **Performance Considerations**
   - Lazy load shared steps in large lists
   - Cache shared step definitions
   - Minimal re-renders when expanding/collapsing

## Migration Strategy

1. **Database Migration**
   - Create new `shared_steps` table with clean schema
   - Remove old `user_defined_actions` table (if exists)
   - No data migration needed (fresh start)

2. **API Implementation**
   - Create new models and handlers for shared_steps
   - Update definitions endpoint to include shared steps
   - Clean separation from old system

3. **Frontend Implementation**
   - Create new components for shared steps
   - Update TestCaseForm to support shared steps
   - Use new table names throughout frontend

## Timeline

- **Phase 1**: Backend CRUD for shared steps (1-2 days)
  - Create new database migration
  - Database models using new shared_steps table
  - API endpoints implementation
  - Step validation logic

- **Phase 2**: Shared Steps Library page (2-3 days)
  - List and search functionality
  - Create/edit shared steps interface
  - Step validation during creation

- **Phase 3**: TestCaseForm integration (2-3 days)
  - Add shared step selection modal
  - Display shared steps using TestCaseDisplay style
  - Collapsed by default, expandable UI

- **Phase 4**: Test runner integration (1-2 days)
  - Shared step expansion logic
  - Enhanced error reporting

**Total Estimated Time: 6-10 days**

## Related Files

- `backend/migrations/20250110_create_shared_steps.sql` - New migration with shared_steps table and test_steps updates
- `backend/src/models/shared_step.rs` - New model definitions
- `backend/src/models/test_step.rs` - Update to support stepType and sharedStepId
- `backend/src/handlers/shared_steps.rs` - New API handlers
- `frontend/src/components/TestCaseForm.tsx` - Integration point
- `frontend/src/components/SharedStepLibrary.tsx` - New component
- `frontend/src/components/SharedStepEditor.tsx` - New component
- `frontend/src/services/shared-step-service.ts` - New API service

