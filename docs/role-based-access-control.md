# Permission-Based Access Control (PBAC) Documentation

## Overview

TestSpectra implements a **Permission-Based Access Control (PBAC)** system where permissions are the primary access control mechanism. Roles serve as a convenient abstraction layer that bundles commonly-used permission sets together.

## Architecture

### Permission-First Design
- **Permissions** are the fundamental unit of access control
- **Roles** are predefined permission bundles for convenience
- **Users** receive permissions from their role + any additional special permissions
- **Pages/Actions** are protected by checking required permissions

This approach avoids permission duplication across roles and provides granular control.

## Permission-to-Access Mapping

### Page Access Permissions

| Page | Required Permission | Description |
|------|-------------------|-------------|
| **Dashboard** | `view_all_data` | View dashboard and analytics |
| **Test Cases (View)** | `view_all_data` | View test case list and details |
| **Test Cases (Create/Edit/Delete)** | `create_edit_test_cases` | Full test case management |
| **Test Suites** | `view_all_data` | View test suite information |
| **Shared Steps (View)** | `view_all_data` | View shared step library |
| **Shared Steps (Create/Edit/Delete)** | `create_edit_test_cases` | Full shared step management |
| **Review Queue** | `review_approve_test_cases` | Access review workflow |
| **Runs History** | `view_all_data` | View test execution history |
| **Configuration** | `manage_configurations` | System configuration access |
| **Tools** | *No permission required* | Internal tools for all users |
| **User Management** | `manage_users` | User and role management |
| **Account** | *No permission required* | Personal account settings |

### Action-Level Permissions

| Action | Required Permission | Description |
|--------|-------------------|-------------|
| **Run Automated Tests** | `execute_automated_tests` OR `execute_all_tests` | Execute automated test cases |
| **Execute All Tests** | `execute_all_tests` | Both automated and manual test execution |
| **Record Manual Results** | `record_test_results` | Record manual test execution results |
| **Review Test Cases** | `review_approve_test_cases` | Review and approve test cases |
| **Export Reports** | `export_reports` | Generate and export reports |
| **Manage Integrations** | `manage_integrations` | Configure external tool integrations |
| **Manage Test Configurations** | `manage_test_configurations` | Test-specific configuration management |
| **Manage QA Team** | `manage_qa_team` | QA team member management |

## Role Permission Bundles

Roles are predefined permission sets that simplify user management:

### Admin Role
**Purpose**: Full system administration
**Permissions**: 
- `view_all_data`
- `manage_users`
- `full_test_case_access`
- `create_edit_test_cases`
- `execute_all_tests`
- `record_test_results`
- `manage_configurations`
- `manage_test_configurations`
- `review_approve_test_cases`
- `export_reports`
- `manage_integrations`

### QA Lead Role
**Purpose**: Lead QA team and test strategy
**Permissions**:
- `view_all_data`
- `manage_qa_team`
- `full_test_case_access`
- `create_edit_test_cases`
- `execute_all_tests`
- `record_test_results`
- `manage_test_configurations`
- `review_approve_test_cases`
- `export_reports`

### QA Engineer Role
**Purpose**: Test case creation and execution
**Permissions**:
- `view_all_data`
- `create_edit_test_cases`
- `execute_all_tests`
- `record_test_results`

### Developer Role
**Purpose**: Automated test execution
**Permissions**:
- `view_all_data`
- `execute_automated_tests`

### Product Manager Role
**Purpose**: View metrics and reports
**Permissions**:
- `view_all_data`
- `export_reports`

### UI/UX Designer Role
**Purpose**: View test cases and generate reports
**Permissions**:
- `view_all_data`
- `full_test_case_access`
- `export_reports`

### Viewer Role
**Purpose**: Read-only access
**Permissions**:
- `view_all_data`

## Permission Reference

### Complete Permission List

| Permission Key | Display Text | Grants Access To |
|----------------|-------------|-----------------|
| `view_all_data` | View all data | Dashboard, Test Cases (view), Test Suites, Shared Steps (view), Runs History |
| `manage_users` | Manage users and roles | User Management |
| `manage_qa_team` | Manage QA team members | QA team management features |
| `full_test_case_access` | Full access to all test cases | Complete test case viewing access |
| `create_edit_test_cases` | Create and edit test cases | Test Cases (create/edit/delete), Shared Steps (create/edit/delete) |
| `execute_all_tests` | Execute manual and automated tests | All test execution capabilities |
| `execute_automated_tests` | Execute automated tests | Automated test execution only |
| `record_test_results` | Record test results | Manual test result recording |
| `manage_configurations` | Manage configurations | System Configuration page |
| `manage_test_configurations` | Manage test configurations | Test-specific configuration settings |
| `review_approve_test_cases` | Review and approve test cases | Review Queue and review actions |
| `export_reports` | Export reports | Report generation and export |
| `manage_integrations` | Manage integrations (Git, Jira, etc) | External integration management |

## Access Control Flow

### 1. User Authentication
```
User logs in → Receives User object with:
├── role: "qa_engineer"
├── basePermissions: ["view_all_data", "create_edit_test_cases", ...]
└── specialPermissions: ["review_approve_test_cases"] (if any)
```

### 2. Permission Resolution
```
Effective Permissions = basePermissions + specialPermissions
Example QA Engineer with special permission:
["view_all_data", "create_edit_test_cases", "execute_all_tests", "record_test_results"] + ["review_approve_test_cases"]
= ["view_all_data", "create_edit_test_cases", "execute_all_tests", "record_test_results", "review_approve_test_cases"]
```

### 3. Access Check
```
ProtectedRoute checks:
requiredPermissions = ["create_edit_test_cases"]
userPermissions = ["view_all_data", "create_edit_test_cases", ...]
Result: ✅ ACCESS GRANTED
```

## Special Permissions

Users can receive **special permissions** in addition to their role-based permissions:

### Use Cases
- **Temporary Access**: Grant specific permissions without changing role
- **Cross-Functional Needs**: QA Engineer who also needs to review test cases
- **Graduated Permissions**: Start with basic role, add permissions as needed

### Example
```typescript
// User with QA Engineer role + special permission
const user = {
  role: "qa_engineer",
  basePermissions: ["view_all_data", "create_edit_test_cases", "execute_all_tests", "record_test_results"],
  specialPermissions: ["review_approve_test_cases"] // Additional access
};
```

## Implementation Examples

### Route Protection
```tsx
<ProtectedRoute 
  user={currentUser} 
  requiredPermissions={['manage_users']} // Check specific permission
>
  <UserManagement />
</ProtectedRoute>
```

### Element Protection
```tsx
<ProtectedElement 
  user={currentUser} 
  requiredPermissions={['create_edit_test_cases']}
>
  <Button>Create Test Case</Button>
</ProtectedElement>
```

### Multiple Permissions (OR logic)
```tsx
<ProtectedElement 
  user={currentUser} 
  requiredPermissions={['execute_automated_tests', 'execute_all_tests']}
  requireAll={false} // OR logic - any permission grants access
>
  <Button>Run Test</Button>
</ProtectedElement>
```

### Multiple Permissions (AND logic)
```tsx
<ProtectedElement 
  user={currentUser} 
  requiredPermissions={['manage_users', 'manage_qa_team']}
  requireAll={true} // AND logic - all permissions required
>
  <Button>Manage Team</Button>
</ProtectedElement>
```

## Benefits of Permission-First Design

1. **No Duplication**: Permissions defined once, reused across roles
2. **Granular Control**: Fine-grained access control at the action level
3. **Flexibility**: Easy to create new permission combinations
4. **Maintainability**: Add new permissions without updating all roles
5. **Special Permissions**: Grant additional access without role changes
6. **Clear Mapping**: Direct relationship between permission and capability

## Security Considerations

1. **Client-Side Protection**: Provides better UX and prevents unauthorized UI actions
2. **Server-Side Validation**: All API endpoints must independently validate permissions
3. **Permission Caching**: Client-side permission checking is fast and reduces server load
4. **Audit Trail**: Log permission checks and access attempts for security monitoring

## Migration from Role-Based to Permission-Based

When moving from traditional role-based access control:

1. **Identify Actions**: List all user actions in the application
2. **Create Permissions**: Define permissions for each action type
3. **Map Roles**: Bundle permissions into logical role definitions
4. **Update Protection**: Replace role checks with permission checks
5. **Add Special Permissions**: Enable cross-role capability grants

This approach provides the simplicity of roles with the flexibility of granular permissions.
