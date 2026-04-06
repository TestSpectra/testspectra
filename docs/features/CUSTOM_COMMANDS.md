# Reusable Components: Spectra Actions & Shared Steps

## Overview

TestSpectra provides two powerful reusability mechanisms that serve different purposes in test automation:

1. **Spectra Actions**: Technical utility functions that provide the "core engine" functionality
2. **Shared Steps**: Business logic workflows that can be used as templates across test cases

Both features enhance code reusability but operate at different levels of abstraction and use different storage mechanisms.

## Key Differences

| Aspect               | Shared Steps                                | Spectra Actions                                             |
| -------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| **Purpose**          | Business logic workflows (e.g., login flow) | Technical reusable logic (e.g., custom assertions, helpers) |
| **Usage**            | Template for step sequences                 | Global object: `Spectra.login(args)`                        |
| **Structure**        | Single function implementation              | Single function implementation                              |
| **Storage**          | Pseudo-git & Database                       | Pseudo-git & Database                                       |
| **Access**           | `Step.login(args)`                          | `Spectra.login(args)`                                       |
| **Scope**            | High-level business flows                   | Low-level technical utilities                               |
| **Virtual Location** | `/support/steps/`                           | `/support/actions/`                                         |
| **File Extension**   | `.step.ts`                                  | `.action.ts`                                                |
| **Logic Location**   | `handlers/shared_step.rs`                   | `handlers/spectra_actions.rs`                               |

---

## Part 1: Spectra Actions

### Architecture Design

#### 1. Virtual File System Structure (Pseudo-Git)

Spectra Actions are stored in a bare **Pseudo-git** repository and are versioned with commits. They do not exist as physical files in the project directory except during test preparation.

```
/support/actions/
  ├── login.action.ts
  ├── safeClick.action.ts
  ├── verifyToast.action.ts
  ├── clearSession.action.ts
  ├── uploadAndVerify.action.ts
  └── ...
```

### 2. File Naming Convention

- **Format**: `camelCaseName.action.ts`
- **Icon**: Different icon from regular TypeScript files in UI
- **Example**: `login.action.ts`, `verifyToast.action.ts`

### 3. File Content Structure

Each action file contains only the function body:

```typescript
// login.action.ts
export default async function (userType: "admin" | "staff") {
  const user = userType === "admin" ? Fixture.admin : Fixture.staff;
  await browser.url("/auth/login");
  await $("#email").setValue(user.email);
  await $("#password").setValue(user.password);
  await $("#btn-submit").click();
}
```

### 4. Dynamic Spectra Object (Runtime Injection)

The system automatically injects the `Spectra` global object into the test environment during execution. This logic is handled by `preparer.rs` in the `core/test-runner`, which generates the object based on the current Spectra Actions and injects it into the WebdriverIO `before` hook. It is NOT saved as a persistent file in the repository.

```typescript
export const Spectra = {
  /**
   * Menangani flow login ke aplikasi
   */
  login: async (userType: "admin" | "staff") => {
    // Auto-generated import and execution
    return await (await import("./actions/login.action.ts")).default(userType);
  },

  /**
   * Memastikan element muncul dan melakukan klik
   */
  safeClick: async (selector: string) => {
    return await (
      await import("./actions/safeClick.action.ts")
    ).default(selector);
  },

  /**
   * Custom assertion untuk verifikasi toast message
   */
  verifyToast: async (message: string) => {
    return await (
      await import("./actions/verifyToast.action.ts")
    ).default(message);
  },
};
```

## Script Editor Integration

### 1. Editor Restrictions

#### Allowed Operations:

- **Function Parameters**: Users can edit parameter definitions
- **Function Body**: Full access to implement logic within function scope
- **WDIO API**: Access to browser, $, $$, and other WebdriverIO globals
- **Return Values**: Can return any serializable value

#### Restricted Operations:

- **Fixed File Name**: Cannot rename the .action.ts file

### 2. Code Validation

#### Syntax Validation:

```typescript
// Valid
export default async function (
  selector: string,
  text: string,
  options?: {
    timeout?: number;
  },
) {
  const element = await $(selector);
  return await element.getText();
}
```

### 3. Editor UI Structure

#### Standard Editor Integration

Spectra Actions use the **same editor interface** as existing test cases and page objects:

- **File Explorer**: Access `.action.ts` files through existing file explorer
- **Monaco Editor**: Standard Monaco Editor with TypeScript support
- **UnifiedScriptEditor**: Same interface as test cases and page objects
- **File Icons**: Special icon for `.action.ts` files to distinguish from regular TypeScript files

#### Editor Features (Existing):

- **Syntax Highlighting**: TypeScript syntax highlighting
- **Auto-completion**: WDIO commands and parameter names
- **Error Detection**: Real-time syntax and validation errors
- **File Management**: Standard save, cancel, and file operations
- **Restrictions**: Enforced through Monaco Editor restriction system

#### File Access:

1. **File Explorer** → Navigate to `/support/actions/`
2. **Click `.action.ts` file** → Opens in standard editor
3. **Edit with restrictions** → Only function parameters and body editable
4. **Save** → Validates code, commits to **Pseudo-git**, and updates the database record.

## API Design

### 1. Pseudo-Git & Database Endpoints

CRUD operations for Spectra Actions interact with both the **Pseudo-git** repository (for versioned content) and the **Project-specific Database Table**.

```rust
// List all actions (from database metadata)
GET /api/projects/{project_slug}/spectra-actions

// Get single action content (from pseudogit/db)
GET /api/projects/{project_slug}/spectra-actions/{action_name}

// Create new action (Commit to pseudogit + Insert to {project_slug}.spectra_actions)
POST /api/projects/{project_slug}/spectra-actions
Body: {
  "name": "login",
  "content": "export default async function (userType: 'admin' | 'staff') { ... }"
}

// Update action (Commit to pseudogit + Update {project_slug}.spectra_actions)
PUT /api/projects/{project_slug}/spectra-actions/{action_name}
Body: {
  "content": "export default async function (userType: 'admin' | 'staff') { ... }"
}

// Delete action (Commit removal + Delete from {project_slug}.spectra_actions)
DELETE /api/projects/{project_slug}/spectra-actions/{action_name}

// Validate action code (TS validation service)
POST /api/projects/{project_slug}/spectra-actions/validate
Body: {
  "content": "export default async function..."
}

// Regenerate spectra runtime registry
POST /api/projects/{project_slug}/spectra-actions/regenerate
```

### 2. Integration with Database Tables

TestSpectra uses a dual-table strategy. Metadata is stored in the `public` schema for global tracking, while action content is stored in the **project-specific schema**.

```sql
-- 1. Project-specific table (e.g., "default".spectra_actions)
INSERT INTO "project-slug".spectra_actions (id, name, file_path, content, created_at)
VALUES (gen_random_uuid(), 'login', 'support/actions/login.action.ts', '...', NOW());

-- 2. Global metadata for editor sync
INSERT INTO public.script_metadata (id, project_slug, file_path, last_commit_hash)
VALUES (gen_random_uuid(), 'project-slug', 'support/actions/login.action.ts', 'commit-sha-from-pseudogit');
```

### 3. Script Generation Integration

When generating test scripts, Spectra Actions are available as global functions:

```typescript
describe("Test Suite", () => {
  it("Test Case", async () => {
    // Test steps can use Spectra Actions
    await Spectra.login("admin");
    await Spectra.safeClick("#submit");
    await Spectra.verifyToast("Login successful");
  });
});
```

---

## Part 2: Shared Steps

### Overview

Shared Steps allow users to create reusable business logic workflows that can be used across multiple test cases. **This is an evolution of the existing Shared Steps feature** - the database-driven UI and functionality remain the same, but we're adding **Pseudo-git synchronization** where each shared step database row has a corresponding versioned `.step.ts` virtual file.

Unlike Spectra Actions which provide technical utilities, Shared Steps focus on high-level business workflows and are managed through the existing UI with Pseudo-git and Database synchronization.

### Benefits

- **Reusability**: Create once, reuse as a template when building test cases (existing feature)
- **Maintainability**: Shared steps live in database with file-based backup and IDE access
- **Consistency**: Ensure standard procedures are followed consistently across newly created test cases
- **Efficiency**: Quickly add common workflows to test cases without re-authoring individual steps
- **Collaboration**: Team members can work on different step files through IDE without conflicts
- **IDE Integration**: Edit shared steps directly in script editor with full TypeScript support

### Evolution from Existing System

#### **Existing Features (Retained)**

- ✅ Database-driven Shared Steps UI (already implemented)
- ✅ CRUD operations through existing interface
- ✅ Step sequence validation and management
- ✅ Integration with TestCaseForm for adding shared steps
- ✅ Usage tracking and analytics

#### **New Enhancements**

- 🆕 **File Synchronization**: Each database row → corresponding `.step.ts` file
- 🆕 **IDE Access**: Edit shared steps directly in script editor
- 🆕 **TypeScript Validation**: Enhanced code validation in IDE
- 🆕 **Global Object Access**: `Step.login()` in test scripts
- 🆕 **File Icons**: Special icons for `.step.ts` files

### Database + Pseudo-Git Hybrid

```
Database Row (Existing)                    Pseudo-Git (New)
┌─────────────────────┐                ┌─────────────────────┐
│ {slug}.shared_steps │ ← Sync →      │ /support/steps/      │
│ - id: uuid         │                │ - login.step.ts      │
│ - name: "Login Flow"│                │ - createUser.step.ts │
│ - description      │                │ - setupSession.step.ts│
│ - created_by       │                └─────────────────────┘
│ - test_steps[]     │
└─────────────────────┘
```

### Virtual File System Structure (Pseudo-Git)

```
/support/steps/
  ├── login.step.ts
  ├── createUser.step.ts
  ├── setupSession.step.ts
  ├── verifyDashboard.step.ts
  ├── logout.step.ts
  └── ...
```

### File Naming Convention

- **Format**: `camelCaseName.step.ts`
- **Icon**: Different icon from regular TypeScript files and .action.ts files
- **Example**: `login.step.ts`, `createUser.step.ts`

### File Content Structure

Each step file contains only the function body:

```typescript
// login.step.ts
export default async function (
  userType: "admin" | "staff",
  options?: {
    rememberMe?: boolean;
  },
) {
  const user = userType === "admin" ? Fixture.admin : Fixture.staff;
  await browser.url("/auth/login");
  await $("#email").setValue(user.email);
  await $("#password").setValue(user.password);
  await $("#btn-submit").click();
  await expect($(".dashboard")).toBeDisplayed();
}
```

### Generated Global Object

System automatically generates `/support/steps.ts`:

```typescript
export const Step = {
  /**
   * Menangani flow login ke aplikasi
   */
  login: async (userType: "admin" | "staff") => {
    return await (await import("./steps/login.step.ts")).default(userType);
  },

  /**
   * Membuat user baru melalui admin panel
   */
  createUser: async (userData: UserCreationData) => {
    return await (await import("./steps/createUser.step.ts")).default(userData);
  },

  /**
   * Setup session awal untuk testing
   */
  setupSession: async () => {
    return await (await import("./steps/setupSession.step.ts")).default();
  },
};
```

### API Design

#### **Existing APIs (Retained)**

```rust
// Existing Shared Steps APIs (no changes)
GET /api/projects/{project_slug}/shared-steps          // List from database
GET /api/projects/{project_slug}/shared-steps/{id}      // Get from database
POST /api/projects/{project_slug}/shared-steps         // Create in database
PUT /api/projects/{project_slug}/shared-steps/{id}      // Update in database
DELETE /api/projects/{project_slug}/shared-steps/{id}    // Delete from database
```

#### **New Enhancement APIs**

```rust
// File synchronization APIs
GET /api/projects/{project_slug}/shared-steps/{id}/file    // Get .step.ts file content
PUT /api/projects/{project_slug}/shared-steps/{id}/file    // Update .step.ts file content
POST /api/projects/{project_slug}/shared-steps/sync        // Sync database → files
POST /api/projects/{project_slug}/shared-steps/regenerate  // Regenerate steps.ts

// Validation for IDE editing
POST /api/projects/{project_slug}/shared-steps/validate-file
Body: {
  "content": "export default async function..."
}
```

### Synchronization Logic

#### **Database → Pseudo-Git (Primary)**

1. **Create**: When shared step created in database → generate `.step.ts` file
2. **Update**: When shared step updated in database → update `.step.ts` file
3. **Delete**: When shared step deleted in database → delete `.step.ts` file

#### **Pseudo-Git → Database (Secondary)**

1. **IDE Edit**: When `.step.ts` file edited in IDE → update database test_steps
2. **Validation**: Validate TypeScript before database update
3. **Conflict Resolution**: Follow existing conflict resolution system (ResolveConflictDialog.tsx)
4. **Outdated Draft Detection**: Check base_commit_hash vs last_commit_hash before applying changes

#### **Generated File Structure**

```typescript
// /support/steps/login.step.ts (generated from database)
export default async function () {
  // Generated from database test_steps
  await browser.url("/auth/login");
  await $("#email").setValue("admin@example.com");
  await $("#password").setValue("password");
  await $("#btn-submit").click();
}
```

### 2. Integration with Database Tables

Shared Step files are synchronized with the **project-specific `shared_steps` table** and tracked globally in `public.script_metadata`.

```sql
-- 1. Project-specific table (e.g., "default".shared_steps)
-- This table stores the business logic structure

-- 2. Global metadata for editor sync
INSERT INTO public.script_metadata (id, project_slug, file_path, last_commit_hash)
VALUES
  (gen_random_uuid(), 'project-slug', 'support/steps/login.step.ts', 'commit-sha'),
  (gen_random_uuid(), 'project-slug', 'support/steps.ts', 'commit-sha');
```

---

## Usage Examples

### Combined Usage in Test Script

```typescript
// No import needed for Spectra and Step - they are global objects!

describe("User Management Test", () => {
  it("should create and manage user", async () => {
    // Use Spectra Actions for technical operations
    await Spectra.login("admin");
    await Spectra.safeClick("#users-menu");
    await Spectra.verifyToast("Users loaded");

    // Use Shared Steps for business workflows
    await Step.createNewUser();
    await Step.verifyUserInList();

    // Mix with regular test steps
    await $("#edit-user").click();
    await expect(await $("#user-form")).toBeDisplayed();
  });
});
```

### File Explorer Structure After Implementation

```
project/
├── support/
│   ├── actions/
│   │   ├── login.action.ts
│   │   ├── safeClick.action.ts
│   │   └── verifyToast.action.ts
│   └── steps/
│       ├── login.step.ts
│       ├── createUser.step.ts
│       └── setupSession.step.ts
├── specs/
│   └── user-management.test.ts
```

### Runtime Generated Registry Objects

#### **Purpose of Runtime Generation**

The `Spectra` and `Step` objects are **generated at runtime** during test execution, not stored as physical files. They are available as **global objects** in test scripts. This provides:

1. **Clean API**: Global objects with no import statements needed
2. **Type Safety**: Monaco Editor generates .d.ts files for TypeScript support
3. **Dynamic Loading**: Runtime imports of individual files
4. **Auto-discovery**: Automatically include new components without manual registration
5. **No File Clutter**: No generated files in the project directory
6. **IDE Integration**: Full autocomplete and intellisense via Monaco Editor

#### **Runtime Generation Logic**

**During Test Execution:**

1. **Spectra Object Generation:**

```typescript
// Generated at runtime, not saved to file
export const Spectra = {
  login: async (userType: "admin" | "staff") => {
    return await (await import("./actions/login.action.ts")).default(userType);
  },
  safeClick: async (selector: string) => {
    return await (
      await import("./actions/safeClick.action.ts")
    ).default(selector);
  },
  verifyToast: async (message: string) => {
    return await (
      await import("./actions/verifyToast.action.ts")
    ).default(message);
  },
  // ... more actions discovered at runtime
};
```

2. **Step Object Generation:**

```typescript
// Generated at runtime from database, not saved to file
export const Step = {
  login: async () => {
    return await (await import("./steps/login.step.ts")).default();
  },
  createUser: async (userData: UserCreationData) => {
    return await (await import("./steps/createUser.step.ts")).default(userData);
  },
  setupSession: async () => {
    return await (await import("./steps/setupSession.step.ts")).default();
  },
  // ... more steps from database
};
```

#### **Usage in Test Scripts**

```typescript
// No import needed - Spectra and Step are global objects
// Monaco Editor generates .d.ts files for TypeScript support

describe("User Management Test", () => {
  it("should create and manage user", async () => {
    // Use Spectra Actions for technical operations (global)
    await Spectra.login("admin");
    await Spectra.safeClick("#users-menu");
    await Spectra.verifyToast("Users loaded");

    // Use Shared Steps for business workflows (global)
    await Step.createUser({ name: "John Doe", email: "john@example.com" });
    await Step.verifyUserInList();
  });
});
```

#### **Generation Process**

The generation and injection process is managed by `core/test-runner/src/preparer.rs` at the start of each test session.

**For Spectra Object:**

1. At test startup, `ExecutionPreparer` identifies all required `.action.ts` files from the database/pseudo-git.
2. It generates a temporary TypeScript file for each action and the `Spectra` global registry in a **temporary run directory**.
3. It injects the `Spectra` object definition into the WebdriverIO `wdio.conf.js` within the `before` hook.
4. The object uses dynamic imports to load actions only when they are called.

**For Step Object:**

1. `ExecutionPreparer` queries the project's `shared_steps` table.
2. It generates corresponding `.step.ts` virtual files and a `Step` global registry.
3. Like the Spectra object, the `Step` object is injected into the WDIO `before` hook.

#### **Benefits of This Architecture**

1. **No Disk Pollution**: The project directory remains clean as physical test files are only created in `/tmp` (or run-dir) during execution.
2. **Version Control**: Every change is committed to Pseudo-git, providing a full audit trail without needing a local git working tree.
3. **Multi-Tenancy**: Data is strictly isolated using PostgreSQL schemas (`search_path`).
4. **Consistency**: `preparer.rs` ensures that the exact state of the database/git at the moment of run is what gets executed.

#### **Implementation Notes**

- **In-Memory Injection Point**: `core/test-runner/src/preparer.rs` (Injects code into WDIO's `before` hook).
- **Physical Write Point**: `core/test-runner/src/preparer.rs` (Writes temporary files to `/tmp/run-*/support/` only during execution).
- **Main Storage**: Database ({project_slug}.shared_steps, {project_slug}.spectra_actions) + Pseudo-Git blobs.
- **Editor Metadata**: `public.script_metadata` tracks the latest commit hash for each virtual file for Monaco Editor synchronization.

## Security Considerations

### 1. Code Sandboxing

- Static analysis for forbidden patterns in TypeScript
- Runtime validation in isolated context
- No access to Node.js APIs or file system from actions
- Restrict external imports and require statements

### 2. Execution Limits

- Timeout limits for action execution
- Memory usage monitoring
- Error boundary handling

### 3. Access Control

- Permission-based action creation/editing
- Audit logging for action changes
- Pseudo-Git repository permissions for /support/actions/ directory

## Error Handling

### 1. Validation Errors

```json
{
  "error": "VALIDATION_ERROR",
  "details": {
    "line": 5,
    "column": 10,
    "message": "Global variable 'globalVar' is not allowed",
    "type": "SECURITY_VIOLATION"
  }
}
```

### 2. Runtime Errors

```json
{
  "error": "RUNTIME_ERROR",
  "details": {
    "actionName": "login",
    "message": "Timeout exceeded",
    "stack": "Error: Timeout exceeded\n    at login..."
  }
}
```

## Performance Considerations

### 1. Blob & Metadata Caching

- Cache validated action ASTs
- Pre-compile frequently used actions
- Lazy loading of action definitions

### 2. Script Generation

- Efficient action injection
- Minimize generated script size
- Optimize action loading order

## Testing Strategy

### 1. Unit Tests

- Action validation logic
- TypeScript AST parsing and security checks
- File system API endpoint functionality

### 2. Integration Tests

- Script generation with Spectra Actions
- Test runner execution
- Error handling scenarios

### 3. Security Tests

- Code injection attempts
- Forbidden pattern detection
- Sandboxing effectiveness

## Related Files

### Backend - Spectra Actions (New Feature)

- `backend/src/handlers/spectra_actions.rs` - API handlers & Runtime Generation (Consolidated)

### Backend - Shared Steps (Existing Feature Enhancement)

- `backend/src/handlers/shared_step.rs` - Extend existing handlers for file sync & Generation (Consolidated)

### Frontend - Spectra Actions (New Feature)

- `src/components/editor/FileExplorer.tsx` - Add .action.ts files support
- `src/services/spectra-actions-service.ts` - API service

### Frontend - Shared Steps (Existing Feature Enhancement)

- `src/components/SharedStepLibrary.tsx` - Keep existing (no changes)
- `src/components/SharedStepEditor.tsx` - Keep existing (no changes)
- `src/services/shared-step-service.ts` - Keep existing (no changes)
- `src/components/editor/FileExplorer.tsx` - Add .step.ts files support

### Core Integration

- `backend/src/test_runner.rs` - Updated test execution
- `src/components/editor/MonacoEditor.tsx` - Updated with restrictions for both

## Success Metrics

1. **Adoption Rate**: Number of reusable components created per project
2. **Reusability**: Average usage count per component
3. **Quality**: Low error rate in component execution
4. **Performance**: Minimal impact on test execution time
5. **Security**: Zero security incidents from both features

## Risks and Mitigations

| Risk                           | Impact | Mitigation                       |
| ------------------------------ | ------ | -------------------------------- |
| Code injection vulnerabilities | High   | Strict validation, sandboxing    |
| Performance degradation        | Medium | Caching, lazy loading            |
| Complex debugging              | Medium | Detailed error messages, logging |
| Pseudo-git conflicts           | Low    | Transactional consistency        |
| Database conflicts             | Low    | Proper transaction handling      |
| Maintenance overhead           | Low    | Clear documentation, templates   |

---

This comprehensive planning document covers both **Spectra Actions** and **Shared Steps** as complementary reusability mechanisms in TestSpectra, providing a solid foundation for implementing both features together while maintaining security, performance, and usability standards.
