# Shared Steps - Implementation Plan

## Overview

Shared Steps allow users to create reusable collections of test steps that can be used across multiple test cases. This feature enables teams to standardize common workflows (like login flows, setup procedures, or complex interactions) and maintain them in one central location.

## Benefits

- **Reusability**: Create once, reuse as a template when building test cases
- **Maintainability**: Shared steps live in a central library that can be updated for future usage
- **Consistency**: Ensure standard procedures are followed consistently across newly created test cases
- **Efficiency**: Quickly add common workflows to test cases without re-authoring individual steps

## Database Schema (New Migration Needed)

We need to create a new `shared_steps` table with the following schema and update `test_steps` accordingly:

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

-- Add CHECK constraint for valid step_type values
ALTER TABLE test_steps
ADD CONSTRAINT test_steps_step_type_check
CHECK (step_type IN ('regular', 'shared_definition', 'shared_reference'));
```

### Step Type Values

- **`regular`**: Step milik test case (default).
- **`shared_definition`**: Step definisi milik shared step (test_case_id IS NULL, shared_step_id IS NOT NULL).
- **`shared_reference`**: Baris referensi dari test case ke shared step (test_case_id IS NOT NULL, shared_step_id IS NOT NULL, action fields NULL).

## Relationship & Invariants

### Table Relationships

```
+----------------+       +----------------------+
|  shared_steps  |       |     test_steps      |
+----------------+       +----------------------+
| id (PK)        |◀─────| shared_step_id (FK) |
| name (UNIQUE)  |       | test_case_id (FK)   |
| description    |       | step_type            |
| created_by     |       | step_order           |
| created_at     |       | action_type          |
| updated_at     |       | action_params        |
+----------------+       | assertions           |
        │               | custom_expected_res  |
        │               +----------------------+
        │                         ▲
        │                         │
        │                         │
        │               +----------------------+
        └───────────────|     test_cases      |
                        +----------------------+
                        | id (PK)            |
                        | title               |
                        | suite               |
                        | ...                 |
                        +----------------------+
```

### Core Invariants

1. **A test step belongs to exactly one owner:**
   - **Test case** (`test_case_id IS NOT NULL`, `shared_step_id IS NULL`, `step_type = 'regular'`)
   - **Shared step** (`test_case_id IS NULL`, `shared_step_id IS NOT NULL`, `step_type = 'shared_definition'`)

2. **Shared step can be referenced by many test cases** via rows in `test_steps` where:
   - `test_case_id IS NOT NULL` (the referencing test case)
   - `shared_step_id IS NOT NULL` (the referenced shared step)
   - `step_type = 'shared_reference'`
   - `action_type`, `action_params`, `assertions` are **NULL/empty** because the definition lives in the shared step.

3. **Test step can belong to only one test case** (`test_case_id` is not nullable when referencing a test case).

4. **Shared step names must be unique** across the system.

### Example Data

#### Shared Step Definition (steps owned by shared step)

```sql
-- shared_steps
INSERT INTO shared_steps (id, name, description, created_by)
VALUES ('ss-111', 'Login Flow', 'Standard login', 'user-001');

-- test_steps owned by shared step (definition steps)
INSERT INTO test_steps (shared_step_id, test_case_id, step_type, step_order, action_type, action_params, assertions)
VALUES
  ('ss-111', NULL, 'shared_definition', 1, 'navigate', '{"url":"https://example.com/login"}', '[]'),
  ('ss-111', NULL, 'shared_definition', 2, 'type',    '{"selector":"#email","text":"user@example.com"}', '[]'),
  ('ss-111', NULL, 'shared_definition', 3, 'click',   '{"selector":"#submit"}', '[]');
```

#### Test Case with Regular Steps (no shared steps)

```sql
-- test_cases
INSERT INTO test_cases (id, title, suite, ...)
VALUES ('tc-222', 'Direct Test', 'E2E', ...);

-- test_steps owned by test case (regular steps)
INSERT INTO test_steps (test_case_id, shared_step_id, step_type, step_order, action_type, action_params, assertions)
VALUES
  ('tc-222', NULL, 'regular', 1, 'navigate', '{"url":"https://example.com"}', '[]'),
  ('tc-222', NULL, 'regular', 2, 'type',    '{"selector":"#search","text":"query"}', '[]');
```

#### Test Case Referencing a Shared Step

```sql
-- test_cases
INSERT INTO test_cases (id, title, suite, ...)
VALUES ('tc-333', 'Test with Shared Step', 'E2E', ...);

-- test_steps mixing regular and shared step references
INSERT INTO test_steps (test_case_id, shared_step_id, step_type, step_order, action_type, action_params, assertions)
VALUES
  ('tc-333', NULL, 'regular', 1, 'navigate', '{"url":"https://example.com"}', '[]'),               -- regular step
  ('tc-333', 'ss-111', 'shared_reference', 2, NULL, NULL, NULL),                                  -- shared step reference
  ('tc-333', NULL, 'regular', 3, 'click', '{"selector":"#logout"}', '[]');                        -- regular step
```

### Backend Implications

- **GET /api/test-cases/:id** → backend must expand shared step references by fetching definition steps (`test_steps WHERE shared_step_id = X AND test_case_id IS NULL AND step_type = 'shared_definition'`) and return a nested structure to the frontend.
- **POST/PUT test cases** → frontend can send mixed steps:
  - Regular steps (`shared_step_id` null)
  - Shared step references (`shared_step_id` set, `action_type` null/empty)
- **DELETE shared step** → block if any `test_steps` rows reference it with `test_case_id IS NOT NULL` (i.e., used by test cases). If allowed, cascade delete its definition steps (`shared_definition`) first, then the shared step.

## Data Structure

### Shared Step Metadata

```json
{
  "id": "uuid-here",
  "name": "Login Flow",
  "description": "Standard login flow with email and password",
  "createdBy": "user-uuid",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Shared Step Implementation Data

When a shared step is created, individual `test_steps` records are created that belong **only** to the shared step (no `test_case_id`):

```sql
-- Create shared step definition (metadata)
INSERT INTO shared_steps (id, name, description, created_by)
VALUES ('shared-uuid', 'Login Flow', 'Standard login flow', 'user-uuid');

-- Create individual steps that belong to this shared step (NO test_case_id)
INSERT INTO test_steps (shared_step_id, step_order, step_type, action_type, action_params, assertions)
VALUES 
  ('shared-uuid', 1, 'regular', 'navigate', '{"url": "https://example.com/login"}', '[{"assertionType": "urlContains", "expectedValue": "/login"}]'),
  ('shared-uuid', 2, 'regular', 'type', '{"selector": "#email", "text": "user@example.com"}', '[]'),
  ('shared-uuid', 3, 'regular', 'type', '{"selector": "#password", "text": "password123"}', '[]'),
  ('shared-uuid', 4, 'regular', 'click', '{"selector": "#submit"}', '[]'),
  ('shared-uuid', 5, 'regular', 'waitForElement', '{"selector": "#dashboard", "timeout": 10000}', '[{"assertionType": "elementVisible", "selector": "#dashboard"}]');
```

### Usage in Test Case

Using shared steps in a test case is **optional**.

Ketika user menambahkan shared step ke sebuah test case:

1. Frontend menyimpan **referensi** ke shared step pada posisi step tertentu (misalnya melalui `stepType = "shared"` dan `sharedStepId` di data langkah test case yang dikirim/diterima API).
2. Tidak ada baris `test_steps` tambahan yang disalin khusus untuk test case tersebut – sumber kebenaran urutan shared step tetap di kombinasi `shared_steps` + `test_steps` yang memiliki `shared_step_id`.
3. Untuk tampilan, frontend akan **expand** shared step menjadi struktur `steps` yang nested dengan cara mengambil data langkah terkini dari definisi shared step.
4. Karena yang disimpan adalah referensi, setiap perubahan pada shared step definition akan otomatis tercermin saat test case dibuka atau dieksekusi lagi.

**API Response (camelCase, nested tree di frontend saja):**
Backend dapat mengembalikan:

- Daftar flat langkah test case reguler (yang terikat ke `test_case_id`)
- Daftar shared step metadata dan langkah-langkah definisinya
- Informasi referensi di struktur langkah test case (misalnya `stepType = "shared"`, `sharedStepId`)

Frontend yang kemudian menyusun semuanya menjadi tree `steps` yang nested untuk keperluan UI.

Example nested structure on the frontend:

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
      "id": "virtual-step-login-flow",
      "stepType": "shared",
      "sharedStepId": "shared-step-uuid",
      "sharedStepName": "Login Flow",
      "steps": [
        {
          "id": "shared-1",
          "stepType": "regular",
          "actionType": "navigate",
          "actionParams": { "url": "https://example.com/login" },
          "assertions": [{"assertionType": "urlContains", "expectedValue": "/login"}]
        },
        {
          "id": "shared-2",
          "stepType": "regular",
          "actionType": "type",
          "actionParams": { "selector": "#email", "text": "user@example.com" },
          "assertions": []
        }
        // ... more nested steps
      ]
    }
  ]
}
```

> NOTE: The nested `steps` property is a **frontend-expanded hierarchy**. In the database:
> - Test case steps: `test_case_id IS NOT NULL` and `shared_step_id IS NULL`
> - Shared step definition steps: `test_case_id IS NULL` and `shared_step_id IS NOT NULL`
> - There is **no** row that has both `test_case_id` and `shared_step_id` populated.

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
   - `DELETE /api/shared-steps/:id` - Delete shared step (blocked if still has definition steps)

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
    }
  ],
  "keyOptions": [...]
}
```

## Test Case Data Structure Changes

The `test_steps` table is extended to support **either** test case steps **or** shared step definition steps, but never both at once.

**Relevant columns after migration:**

- `test_case_id UUID NULL` – set **only** for test case steps
- `shared_step_id UUID NULL` – set **only** for shared step definition steps
- `step_type VARCHAR(20) NOT NULL DEFAULT 'regular'` – for now only the value `"regular"` is used

**Data Examples:**
- **Regular test case step**  
  `step_type='regular', test_case_id='uuid', shared_step_id=NULL, action_type='navigate'`

- **Shared step definition step**  
  `step_type='regular', test_case_id=NULL, shared_step_id='uuid', action_type='navigate'`

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

**Total Estimated Time: 5-8 days**

## Related Files

- `backend/migrations/20250110_create_shared_steps.sql` - New migration with shared_steps table and test_steps updates
- `backend/src/models/shared_step.rs` - New model definitions
- `backend/src/models/test_step.rs` - Update to support stepType and sharedStepId
- `backend/src/handlers/shared_steps.rs` - New API handlers
- `frontend/src/components/TestCaseForm.tsx` - Integration point
- `frontend/src/components/SharedStepLibrary.tsx` - New component
- `frontend/src/components/SharedStepEditor.tsx` - New component
- `frontend/src/services/shared-step-service.ts` - New API service

