# TestSpectra Backend Services

Backend services untuk TestSpectra QA Automation Platform, dibangun dengan Rust dan gRPC.

## 📋 Table of Contents

- [Architecture](#architecture)
- [Services](#services)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the Services](#running-the-services)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication & Authorization](#authentication--authorization)
- [Development](#development)

---

## Architecture

Backend menggunakan **microservices architecture** dengan gRPC sebagai communication protocol:

```
┌─────────────────┐
│  Tauri Desktop  │
│   (Frontend)    │
└────────┬────────┘
         │ gRPC
         ▼
┌─────────────────┐
│  User Service   │ ◄── JWT Auth
│   (Port 50051)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Port 5432)   │
└─────────────────┘
```

**Design Principles:**
- **Separation of Concerns**: Setiap service memiliki responsibility yang jelas
- **Type Safety**: Protocol Buffers untuk contract definition
- **Security First**: JWT authentication, bcrypt password hashing
- **Scalability**: Microservices dapat di-scale independently
- **Best Practices**: Rust idioms, error handling, logging

---

## Services

### 1. User Service

**Port:** `50051` (gRPC)

**Responsibilities:**
- User authentication (login, token refresh)
- User management (CRUD operations)
- Role-Based Access Control (RBAC)
- Special permissions management

**Key Features:**
- ✅ JWT-based authentication
- ✅ 7 predefined roles (Admin, QA Lead, QA Engineer, Developer, Product Manager, UI/UX Designer, Viewer)
- ✅ Base permissions per role
- ✅ Special permissions override system
- ✅ Admin user auto-seeding from ENV
- ✅ Password hashing dengan bcrypt
- ✅ Token expiration & refresh

---

## Tech Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Rust** | 1.70+ | Programming language |
| **Tonic** | 0.12 | gRPC framework |
| **SQLx** | 0.8 | Database toolkit |
| **PostgreSQL** | 14+ | Primary database |
| **Protocol Buffers** | 3 | API contract definition |

### Key Dependencies

```toml
tokio = "1.40"              # Async runtime
tonic = "0.12"              # gRPC server/client
prost = "0.13"              # Protobuf implementation
sqlx = "0.8"                # SQL toolkit
jsonwebtoken = "9.3"        # JWT handling
bcrypt = "0.15"             # Password hashing
uuid = "1.10"               # UUID generation
chrono = "0.4"              # Date/time handling
```

---

## Prerequisites

### Required Software

1. **Rust** (1.70 or later)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **PostgreSQL** (14 or later)
   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14
   
   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

3. **Protocol Buffers Compiler**
   ```bash
   # macOS
   brew install protobuf
   
   # Ubuntu/Debian
   sudo apt install protobuf-compiler
   ```

### Database Setup

```bash
# Create database and user
psql postgres
```

```sql
CREATE DATABASE testspectra;
CREATE USER testspectra WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE testspectra TO testspectra;
\q
```

---

## Setup

### 1. Clone & Navigate

```bash
cd backend/user-service
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` dengan konfigurasi Anda:

```env
DATABASE_URL=postgresql://testspectra:password@localhost:5432/testspectra
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SERVER_ADDR=0.0.0.0:50051
ADMIN_EMAIL=admin@testspectra.com
ADMIN_PASSWORD=Admin123!
ADMIN_NAME=Admin User
RUST_LOG=info
```

⚠️ **IMPORTANT**: Ganti `JWT_SECRET` dan `ADMIN_PASSWORD` di production!

### 3. Build

```bash
cargo build --release
```

---

## Running the Services

### Development Mode

```bash
cd backend/user-service
cargo run
```

Output:
```
INFO  user_service > Connecting to database...
INFO  user_service > Running database migrations...
INFO  user_service > Seeding admin user...
INFO  user_service > Admin user created: Admin User (admin@testspectra.com)
INFO  user_service > 🚀 User Service listening on 0.0.0.0:50051
```

### Production Mode

```bash
cargo build --release
./target/release/user-service
```

### Docker (Optional)

```bash
docker build -t testspectra-user-service .
docker run -p 50051:50051 --env-file .env testspectra-user-service
```

---

## API Documentation

### gRPC Service Definition

**Proto File:** `user-service/proto/user_service.proto`

### Authentication Endpoints

#### 1. Login

```protobuf
rpc Login(LoginRequest) returns (LoginResponse);
```

**Request:**
```json
{
  "email": "admin@testspectra.com",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Admin User",
    "email": "admin@testspectra.com",
    "role": "ROLE_ADMIN",
    "status": "USER_STATUS_ACTIVE",
    "base_permissions": [1, 2, 3, 5, 8, 11, 12],
    "special_permissions": []
  }
}
```

#### 2. Refresh Token

```protobuf
rpc RefreshToken(RefreshTokenRequest) returns (RefreshTokenResponse);
```

#### 3. Get Current User

```protobuf
rpc GetCurrentUser(GetCurrentUserRequest) returns (UserResponse);
```

### User Management Endpoints

#### 4. List Users

```protobuf
rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
```

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role_filter": "qa_engineer",
  "status_filter": "active",
  "page": 1,
  "page_size": 10
}
```

#### 5. Create User

```protobuf
rpc CreateUser(CreateUserRequest) returns (UserResponse);
```

**Required Permission:** `PERMISSION_MANAGE_USERS`

#### 6. Update User

```protobuf
rpc UpdateUser(UpdateUserRequest) returns (UserResponse);
```

#### 7. Delete User

```protobuf
rpc DeleteUser(DeleteUserRequest) returns (DeleteUserResponse);
```

#### 8. Update User Status

```protobuf
rpc UpdateUserStatus(UpdateUserStatusRequest) returns (UserResponse);
```

#### 9. Grant Special Permissions

```protobuf
rpc GrantSpecialPermissions(GrantSpecialPermissionsRequest) returns (UserResponse);
```

#### 10. Revoke Special Permissions

```protobuf
rpc RevokeSpecialPermissions(RevokeSpecialPermissionsRequest) returns (UserResponse);
```

---

## Database Schema

### Tables

#### `users`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(255) | User's full name |
| `email` | VARCHAR(255) | Unique email address |
| `password_hash` | VARCHAR(255) | Bcrypt hashed password |
| `role` | VARCHAR(50) | User role (programmatic name) |
| `status` | VARCHAR(20) | `active` or `inactive` |
| `git_username` | VARCHAR(255) | Git username (optional) |
| `git_email` | VARCHAR(255) | Git email (optional) |
| `joined_date` | TIMESTAMPTZ | Account creation date |
| `last_active` | TIMESTAMPTZ | Last activity timestamp |
| `created_at` | TIMESTAMPTZ | Record creation |
| `updated_at` | TIMESTAMPTZ | Record update (auto-updated) |

**Indexes:**
- `idx_users_email` on `email`
- `idx_users_role` on `role`
- `idx_users_status` on `status`

#### `user_special_permissions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to `users.id` |
| `permission` | VARCHAR(100) | Permission name (programmatic) |
| `granted_at` | TIMESTAMPTZ | When permission was granted |
| `granted_by` | UUID | Who granted the permission |

**Indexes:**
- `idx_user_special_permissions_user_id` on `user_id`

**Constraints:**
- `UNIQUE(user_id, permission)` - Prevent duplicate permissions
- `ON DELETE CASCADE` - Auto-delete permissions when user deleted

---

## Authentication & Authorization

### JWT Tokens

**Access Token:**
- **Expiration:** 1 hour (3600 seconds)
- **Purpose:** API authentication
- **Claims:** `sub` (user_id), `email`, `role`, `exp`, `iat`

**Refresh Token:**
- **Expiration:** 7 days (604800 seconds)
- **Purpose:** Generate new access tokens
- **Claims:** Same as access token

### Password Security

- **Algorithm:** bcrypt
- **Cost Factor:** 12 (default)
- **Salt:** Automatically generated per password

### Role-Based Access Control (RBAC)

#### 7 Roles

| Role | Programmatic Name | Enum Value |
|------|-------------------|------------|
| Admin | `admin` | `ROLE_ADMIN` (1) |
| QA Lead | `qa_lead` | `ROLE_QA_LEAD` (2) |
| QA Engineer | `qa_engineer` | `ROLE_QA_ENGINEER` (3) |
| Developer | `developer` | `ROLE_DEVELOPER` (4) |
| Product Manager | `product_manager` | `ROLE_PRODUCT_MANAGER` (5) |
| UI/UX Designer | `ui_ux_designer` | `ROLE_UI_UX_DESIGNER` (6) |
| Viewer | `viewer` | `ROLE_VIEWER` (7) |

#### 12 Permissions

| Permission | Programmatic Name | Enum Value |
|------------|-------------------|------------|
| Manage users and roles | `manage_users` | 1 |
| Manage QA team members | `manage_qa_team` | 2 |
| Full access to all test cases | `full_test_case_access` | 3 |
| Create and edit test cases | `create_edit_test_cases` | 4 |
| Execute all tests | `execute_all_tests` | 5 |
| Execute automated tests | `execute_automated_tests` | 6 |
| Record test results | `record_test_results` | 7 |
| Manage configurations | `manage_configurations` | 8 |
| Manage test configurations | `manage_test_configurations` | 9 |
| Review and approve test cases | `review_approve_test_cases` | 10 |
| Export reports | `export_reports` | 11 |
| Manage integrations | `manage_integrations` | 12 |

#### Base Permissions per Role

**Admin:**
- `manage_users`
- `manage_qa_team`
- `full_test_case_access`
- `execute_all_tests`
- `manage_configurations`
- `export_reports`
- `manage_integrations`

**QA Lead:**
- `manage_qa_team`
- `full_test_case_access`
- `execute_all_tests`
- `manage_test_configurations`
- `review_approve_test_cases`
- `export_reports`

**QA Engineer:**
- `create_edit_test_cases`
- `execute_all_tests`
- `record_test_results`

**Developer:**
- `execute_automated_tests`

**Product Manager:**
- `export_reports`

**UI/UX Designer:**
- `full_test_case_access`
- `export_reports`

**Viewer:**
- (No permissions - read-only access)

#### Special Permissions

Special permissions dapat di-grant ke user untuk override base permissions mereka. Contoh:

```rust
// Developer dengan special permission untuk manage QA team
grant_special_permissions(
    developer_user_id,
    vec!["manage_qa_team", "review_approve_test_cases"]
);
```

---

## Development

### Project Structure

```
backend/
├── Cargo.toml                    # Workspace configuration
└── user-service/
    ├── Cargo.toml                # Service dependencies
    ├── build.rs                  # Protobuf compilation
    ├── .env.example              # Environment template
    ├── proto/
    │   └── user_service.proto    # gRPC service definition
    ├── migrations/
    │   └── 20241126_001_create_users_table.sql
    └── src/
        ├── main.rs               # Entry point & server setup
        ├── service.rs            # gRPC service implementation
        ├── auth.rs               # JWT & password handling
        ├── db.rs                 # Database repository
        ├── models.rs             # Data models
        └── permissions.rs        # RBAC logic & mappings
```

### Code Organization

**Modules:**
- `main.rs` - Server initialization, admin seeding
- `service.rs` - gRPC handlers, request/response mapping
- `auth.rs` - JWT generation/verification, password hashing
- `db.rs` - Database queries, repository pattern
- `models.rs` - Rust structs for database entities
- `permissions.rs` - Role/permission constants & mappings

### Best Practices

1. **Error Handling**
   - Use `anyhow::Result` for internal errors
   - Convert to `tonic::Status` for gRPC responses
   - Provide meaningful error messages

2. **Database Queries**
   - Use parameterized queries (SQLx)
   - Implement proper indexing
   - Handle optional fields gracefully

3. **Security**
   - Never log passwords or tokens
   - Validate all user inputs
   - Check permissions before operations
   - Use prepared statements

4. **Logging**
   - Use `tracing` crate
   - Log important operations (login, user creation, etc.)
   - Include context in error logs

### Testing

```bash
# Run unit tests
cargo test

# Run with logging
RUST_LOG=debug cargo test -- --nocapture

# Run specific test
cargo test test_name
```

### Database Migrations

```bash
# Create new migration
sqlx migrate add migration_name

# Run migrations
sqlx migrate run

# Revert last migration
sqlx migrate revert
```

### Protobuf Changes

After modifying `.proto` files:

```bash
cargo clean
cargo build
```

The `build.rs` script akan automatically regenerate Rust code dari proto files.

---

## Troubleshooting

### Common Issues

**1. Database Connection Failed**
```
Error: Failed to connect to database
```
**Solution:** Check PostgreSQL is running dan credentials di `.env` benar.

**2. Port Already in Use**
```
Error: Address already in use (os error 48)
```
**Solution:** Ganti `SERVER_ADDR` di `.env` atau kill process yang menggunakan port 50051.

**3. Migration Failed**
```
Error: Failed to run migrations
```
**Solution:** Drop database dan recreate, atau revert migrations manually.

**4. Admin User Not Created**
```
WARN: Failed to seed admin user
```
**Solution:** Check `ADMIN_PASSWORD` di `.env` sudah di-set.

### Logs

Enable detailed logging:

```bash
RUST_LOG=debug cargo run
```

Log levels: `error`, `warn`, `info`, `debug`, `trace`

---

## Production Deployment

### Checklist

- [ ] Change `JWT_SECRET` to strong random value
- [ ] Use strong `ADMIN_PASSWORD`
- [ ] Enable SSL/TLS for database connection
- [ ] Set up proper firewall rules
- [ ] Configure log rotation
- [ ] Set up monitoring & alerting
- [ ] Use environment-specific `.env` files
- [ ] Enable connection pooling
- [ ] Set up database backups
- [ ] Use reverse proxy (nginx) if needed

### Environment Variables (Production)

```env
DATABASE_URL=postgresql://user:pass@prod-db:5432/testspectra?sslmode=require
JWT_SECRET=<generate-with-openssl-rand-base64-32>
SERVER_ADDR=0.0.0.0:50051
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=<strong-password>
RUST_LOG=info
```

---

## License

Copyright © 2024 TestSpectra Team. All rights reserved.
