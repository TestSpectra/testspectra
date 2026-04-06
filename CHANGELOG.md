# Changelog

All notable changes to TestSpectra will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of TestSpectra
- Test case management system
- Action-based test step builder
- Rich text editor for test documentation
- User authentication and authorization
- Backend API with Rust/Axum
- Desktop application with Tauri
- Cross-platform support (Windows, macOS)

### Backend
- PostgreSQL database with SQLx migrations
- JWT authentication
- RESTful API endpoints
- Docker support

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Rich text editor with formatting support
- Drag-and-drop test step reordering
- Test case detail view with execution history
- Suite management

## [0.1.0] - 2024-11-27

### Added
- Project initialization
- Core test case management features
- GitHub Actions workflows for CI/CD
- Docker image build and deployment
- Cross-platform desktop app builds

### Backend
- User service with authentication
- Test case CRUD operations
- Test suite management
- Database migrations

### Frontend
- Login page
- Test case list view
- Test case form with action builder
- Test case detail view
- Rich text editor integration

### DevOps
- Backend Docker image workflow (GHCR)
- Tauri cross-platform release workflow
- Automated builds for macOS (Apple Silicon & Intel)
- Automated builds for Windows (x64)

---

## Release Notes Template

When creating a new release, use this template:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security improvements
```

---

## Version History

- **v0.1.0** (2024-11-27): Initial release
