# Multi-Project Management

## Overview

TestSpectra supports schema-based multi-tenancy to ensure strict data isolation between different projects. Each project resides in its own PostgreSQL schema, while global data (users, project registry) lives in the `public` schema.

## Project Creation Flow

Creating a project is a multi-step process that ensures the environment is fully initialized before use.

### 1. Registry Entry
The project metadata is first inserted into `public.projects`:
- `id`: Unique UUID
- `slug`: URL-friendly identifier (used as schema name)
- `name`: Display name
- `description`: Optional project context

### 2. Schema Initialization (Backend)
The backend must execute the following SQL operations for each new project:
- **Create Schema**: `CREATE SCHEMA IF NOT EXISTS <slug>;`
- **Initialize Tables**: Execute the `project_schema_template.sql` script within the new schema.
- **Set Search Path**: Ensure the new schema is at the front of the `search_path`.

### 3. Default Configuration
Every project starts with a baseline configuration:
- **Default Suite**: A "General" or "Root" test suite to get started.
- **Draft Config**: Default browser (Chrome), mobile emulation (False), and execution timeouts in the `<slug>.configurations` table.

### 4. Admin Assignment
The user who creates the project is automatically added to `public.project_members` as a member. Since roles are global, an `Admin` or `QA Lead` creator will retain their administrative rights over the new project.

## User & Member Management

Member management is handled through the dedicated Project Settings view.

### Project Member Roles
Roles are **Global** (`public.users.role`). Membership in a project (`public.project_members`) simply grants access to that project's data.
- **Admin**: Can create projects and manage members in ANY project.
- **QA Lead**: Can create projects and manage members in projects they belong to. Can only assign `QA Engineer` roles.
- **QA Engineer**: Can only view projects they are assigned to.

### Assignment Flow
1. **Search**: Find a user in the global `public.users` table.
2. **Add**: Insert a record into `public.project_members`.
3. **Verify**: Ensure the project schema is accessible to the newly added member.

## Project Details & Metadata

### Viewing & Editing
Project settings allow authorized users to:
- **Update Name/Description**: Modify display information in `public.projects`.
- **View Usage Stats**: Count of total test cases, runs, and suites within the project schema.
- **Manage Members**: Add/remove project participants.

### Data Isolation Implementation
All project-scoped API calls include the `:slug` in the URL or the `X-Project-Slug` header. The backend uses this slug to set the `search_path` for the database connection:
```sql
SET LOCAL search_path TO {{slug}}, public;
```

## Readiness Checklist for Creation
Before enabling the "Create Project" UI, ensure:
1. [ ] Backend `create_project` handler implements dynamic schema creation.
2. [ ] `project_schema_template.sql` is finalized and embedded in the backend.
3. [ ] Slug validation (no special characters, reserved names like `public`, `pg_catalog`).
4. [ ] Proper error handling for failed schema creation (transactional fallback).
