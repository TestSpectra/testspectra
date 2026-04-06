# Fixture Management Plan

Fixtures are external files (images, datasets, JSON files) used by automated test scripts. This plan outlines the implementation of a centralized Fixture Management system that synchronizes files directly to the project's PseudoGit repository and provides a global access pattern similar to Android's `R` resources.

## 1. Core Objectives
- **Centralized Management**: Dedicated UI to upload, view, and delete test fixtures.
- **Git Persistence**: All fixture files are committed to the PseudoGit repository under a `fixtures/` directory.
- **Global Access Pattern**: Fixtures are accessible in scripts via a global `Fixture` object (e.g., `Fixture.profileImage`).
- **Resource Typing**: Automatic mapping of file paths to property names for easier script development.

## 2. Technical Architecture

### A. Data Modeling (PostgreSQL)
A new `fixtures` table will be created to track fixture metadata:

```sql
CREATE TABLE fixtures (
    id UUID PRIMARY KEY,
    project_slug VARCHAR NOT NULL,
    name VARCHAR NOT NULL,             -- JavaScript property name (e.g., 'profileImage')
    file_path VARCHAR NOT NULL,        -- Relative path in Git (e.g., 'fixtures/user_profile.png')
    original_filename VARCHAR NOT NULL,
    mime_type VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_slug, name)         -- Ensure unique object keys per project
);
```

### B. Git Structure
Fixtures will be stored in the PseudoGit repository:
```text
/
├── scripts/
│   └── login.test.ts
├── page_objects/
│   └── LoginPage.ts
└── fixtures/                          <-- New Directory
    ├── profile_img.png
    └── test_data.json
```

### C. Backend API Design
New handlers in `backend/src/handlers/fixture.rs`:
- `POST /projects/:slug/fixtures`:
    - Handles multi-part file upload.
    - Commits the file to PseudoGit using `commit_bulk`.
    - Inserts metadata into the `fixtures` table.
- `GET /projects/:slug/fixtures`: Returns a list of all fixtures for a project.
- `DELETE /projects/:slug/fixtures/:id`: 
    - Removes the file from PseudoGit.
    - Deletes metadata from the database.

### D. Global Registry Generation
To support `Fixture.xxx` syntax, the system will provide the mapping to the test runner:
1. **Option A (Dynamic Injection)**: The Test Runner fetches all fixtures for the project and prepends a global definition to the script bundle:
   ```javascript
   global.Fixture = {
       profileImage: 'fixtures/profile_img.png',
       sampleData: 'fixtures/test_data.json'
   };
   ```
2. **Option B (Static File)**: Automatically generate a `fixtures.ts` file in the repo that scripts can import.

*Recommendation*: Use **Dynamic Injection** during test bundling to ensure scripts always have the latest mapping without manual imports.

## 3. UI/UX Workflow

### Fixtures Dashboard
- A new "Fixtures" section in the Project settings or sidebar.
- Grid/List view displaying:
    - Fixture Name (Object Key).
    - Preview (for images).
    - File size and type.
    - Actions (Rename, Delete, Download).

### Add Fixture Dialog
- **File Picker**: To select the local file.
- **Object Key Input**: Validated for valid JS identifier format (e.g., no spaces, doesn't start with number).
- **Auto-suggest**: Automatically generate a key from the filename (e.g., `Logo.png` -> `logo`).

## 4. Implementation Steps

1. **Phase 1: Foundation**
    - [ ] Create `fixtures` table migration.
    - [ ] Implement `Fixture` model in Rust.
    - [ ] Add `fixtures/` directory support in `PseudoGit`.

2. **Phase 2: Backend Handlers**
    - [ ] Implement File Upload logic with Git sync.
    - [ ] Implement List and Delete handlers.
    - [ ] Refactor `test_runner` to inject the `Fixture` global object.

3. **Phase 3: Frontend UI**
    - [ ] Create `FixtureManagement` component.
    - [ ] Implement Upload Dialog with validation.
    - [ ] Integrate with the project navigation.

4. **Phase 4: Enhancements**
    - [ ] Add image preview in UI.
    - [ ] Add "Usages" check (Warn before deleting if used in scripts).
    - [ ] Helper in Script Editor: Autocomplete for `Fixture.` properties.
