use axum::{
    extract::{Path, Query, State},
    http::HeaderMap,
    routing::{get, post, put, delete},
    Json, Router,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::{extract_bearer_token, JwtService};
use crate::error::AppError;
use crate::models::user::*;

#[derive(Clone)]
pub struct UserState {
    pub db: PgPool,
    pub jwt: JwtService,
}

pub fn user_routes(state: UserState) -> Router {
    Router::new()
        .route("/auth/login", post(login))
        .route("/auth/refresh", post(refresh_token))
        .route("/users/me", get(get_current_user))
        .route("/users/me", put(update_my_profile))
        .route("/users", get(list_users))
        .route("/users", post(create_user))
        .route("/users/:id", get(get_user))
        .route("/users/:id", put(update_user))
        .route("/users/:id", delete(delete_user))
        .route("/users/:id/status", put(update_user_status))
        .route("/users/:id/permissions", post(grant_permissions))
        .route("/users/:id/permissions", delete(revoke_permissions))
        .with_state(state)
}

async fn login(
    State(state): State<UserState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, AppError> {
    let user: User = sqlx::query_as(
        "SELECT * FROM users WHERE email = $1"
    )
    .bind(&payload.email)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::Unauthorized("Invalid email or password".to_string()))?;

    if user.status != "active" {
        return Err(AppError::Forbidden("Account is not active".to_string()));
    }

    let valid = bcrypt::verify(&payload.password, &user.password_hash)
        .map_err(|_| AppError::Internal("Password verification failed".to_string()))?;

    if !valid {
        return Err(AppError::Unauthorized("Invalid email or password".to_string()));
    }

    // Update last_active on login
    let user: User = sqlx::query_as(
        "UPDATE users SET last_active = NOW() WHERE id = $1 RETURNING *"
    )
    .bind(user.id)
    .fetch_one(&state.db)
    .await?;

    let access_token = state.jwt.create_access_token(
        &user.id.to_string(),
        &user.email,
        &user.role,
    )?;

    let refresh_token = state.jwt.create_refresh_token(
        &user.id.to_string(),
        &user.email,
        &user.role,
    )?;

    let special_permissions = get_user_permissions(&state.db, user.id).await?;
    let base_permissions = get_base_permissions_for_role(&user.role);

    Ok(Json(LoginResponse {
        access_token,
        refresh_token,
        user: UserResponse::from_user_with_permissions(UserWithPermissions {
            user,
            special_permissions,
            base_permissions,
        }),
    }))
}

async fn refresh_token(
    State(state): State<UserState>,
    Json(payload): Json<RefreshTokenRequest>,
) -> Result<Json<RefreshTokenResponse>, AppError> {
    let claims = state.jwt.verify_token(&payload.refresh_token)?;

    if claims.token_type != "refresh" {
        return Err(AppError::Unauthorized("Invalid token type".to_string()));
    }

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))?;

    let user: User = sqlx::query_as("SELECT * FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::Unauthorized("User not found".to_string()))?;

    let access_token = state.jwt.create_access_token(
        &user.id.to_string(),
        &user.email,
        &user.role,
    )?;

    let refresh_token = state.jwt.create_refresh_token(
        &user.id.to_string(),
        &user.email,
        &user.role,
    )?;

    Ok(Json(RefreshTokenResponse {
        access_token,
        refresh_token,
    }))
}

async fn get_current_user(
    State(state): State<UserState>,
    headers: HeaderMap,
) -> Result<Json<UserResponse>, AppError> {
    let token = extract_bearer_token(headers.get("authorization").and_then(|v| v.to_str().ok()))
        .ok_or_else(|| AppError::Unauthorized("Missing token".to_string()))?;

    let claims = state.jwt.verify_token(&token)?;
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))?;

    let user: User = sqlx::query_as("SELECT * FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    let special_permissions = get_user_permissions(&state.db, user.id).await?;
    let base_permissions = get_base_permissions_for_role(&user.role);

    Ok(Json(UserResponse::from_user_with_permissions(UserWithPermissions {
        user,
        special_permissions,
        base_permissions,
    })))
}

async fn list_users(
    State(state): State<UserState>,
    headers: HeaderMap,
    Query(query): Query<ListUsersQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    verify_token(&state, &headers)?;

    let page = query.page.unwrap_or(1).max(1);
    let page_size = query.page_size.unwrap_or(10).min(100);
    let offset = (page - 1) * page_size;

    let mut sql = String::from("SELECT * FROM users WHERE 1=1");
    let mut count_sql = String::from("SELECT COUNT(*) FROM users WHERE 1=1");

    if let Some(ref search) = query.search {
        let clause = " AND (name ILIKE $1 OR email ILIKE $1)";
        sql.push_str(clause);
        count_sql.push_str(clause);
    }
    if let Some(ref role) = query.role {
        let clause = if query.search.is_some() { " AND role = $2" } else { " AND role = $1" };
        sql.push_str(clause);
        count_sql.push_str(clause);
    }
    if let Some(ref status) = query.status {
        let idx = 1 + query.search.is_some() as i32 + query.role.is_some() as i32;
        let clause = format!(" AND status = ${}", idx);
        sql.push_str(&clause);
        count_sql.push_str(&clause);
    }

    sql.push_str(&format!(" ORDER BY created_at DESC LIMIT {} OFFSET {}", page_size, offset));

    // Build query dynamically
    let users: Vec<User> = if query.search.is_some() && query.role.is_some() && query.status.is_some() {
        sqlx::query_as(&sql)
            .bind(format!("%{}%", query.search.as_ref().unwrap()))
            .bind(query.role.as_ref().unwrap())
            .bind(query.status.as_ref().unwrap())
            .fetch_all(&state.db)
            .await?
    } else if query.search.is_some() && query.role.is_some() {
        sqlx::query_as(&sql)
            .bind(format!("%{}%", query.search.as_ref().unwrap()))
            .bind(query.role.as_ref().unwrap())
            .fetch_all(&state.db)
            .await?
    } else if query.search.is_some() && query.status.is_some() {
        sqlx::query_as(&sql)
            .bind(format!("%{}%", query.search.as_ref().unwrap()))
            .bind(query.status.as_ref().unwrap())
            .fetch_all(&state.db)
            .await?
    } else if query.role.is_some() && query.status.is_some() {
        sqlx::query_as(&sql)
            .bind(query.role.as_ref().unwrap())
            .bind(query.status.as_ref().unwrap())
            .fetch_all(&state.db)
            .await?
    } else if query.search.is_some() {
        sqlx::query_as(&sql)
            .bind(format!("%{}%", query.search.as_ref().unwrap()))
            .fetch_all(&state.db)
            .await?
    } else if query.role.is_some() {
        sqlx::query_as(&sql)
            .bind(query.role.as_ref().unwrap())
            .fetch_all(&state.db)
            .await?
    } else if query.status.is_some() {
        sqlx::query_as(&sql)
            .bind(query.status.as_ref().unwrap())
            .fetch_all(&state.db)
            .await?
    } else {
        sqlx::query_as(&sql)
            .fetch_all(&state.db)
            .await?
    };

    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(&state.db)
        .await?;

    let mut user_responses = Vec::new();
    for user in users {
        let special_permissions = get_user_permissions(&state.db, user.id).await?;
        let base_permissions = get_base_permissions_for_role(&user.role);
        user_responses.push(UserResponse::from_user_with_permissions(UserWithPermissions {
            user,
            special_permissions,
            base_permissions,
        }));
    }

    Ok(Json(serde_json::json!({
        "users": user_responses,
        "total": total.0,
        "page": page,
        "pageSize": page_size
    })))
}

async fn get_user(
    State(state): State<UserState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<UserResponse>, AppError> {
    verify_token(&state, &headers)?;

    let user: User = sqlx::query_as("SELECT * FROM users WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    let special_permissions = get_user_permissions(&state.db, user.id).await?;
    let base_permissions = get_base_permissions_for_role(&user.role);

    Ok(Json(UserResponse::from_user_with_permissions(UserWithPermissions {
        user,
        special_permissions,
        base_permissions,
    })))
}

async fn create_user(
    State(state): State<UserState>,
    headers: HeaderMap,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<UserResponse>, AppError> {
    verify_token(&state, &headers)?;

    // Check if email exists
    let exists: Option<(i32,)> = sqlx::query_as("SELECT 1 FROM users WHERE email = $1")
        .bind(&payload.email)
        .fetch_optional(&state.db)
        .await?;

    if exists.is_some() {
        return Err(AppError::Conflict("Email already exists".to_string()));
    }

    let password_hash = bcrypt::hash(&payload.password, 12)?;
    let id = Uuid::new_v4();

    let user: User = sqlx::query_as(
        r#"INSERT INTO users (id, email, password_hash, name, role, status)
           VALUES ($1, $2, $3, $4, $5, 'active')
           RETURNING *"#
    )
    .bind(id)
    .bind(&payload.email)
    .bind(&password_hash)
    .bind(&payload.name)
    .bind(&payload.role)
    .fetch_one(&state.db)
    .await?;

    let special_permissions = get_user_permissions(&state.db, user.id).await?;
    let base_permissions = get_base_permissions_for_role(&user.role);

    Ok(Json(UserResponse::from_user_with_permissions(UserWithPermissions {
        user,
        special_permissions,
        base_permissions,
    })))
}

async fn update_user(
    State(state): State<UserState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateUserRequest>,
) -> Result<Json<UserResponse>, AppError> {
    verify_token(&state, &headers)?;

    // Check if email exists for other user
    if let Some(ref email) = payload.email {
        let exists: Option<(Uuid,)> = sqlx::query_as("SELECT id FROM users WHERE email = $1 AND id != $2")
            .bind(email)
            .bind(id)
            .fetch_optional(&state.db)
            .await?;

        if exists.is_some() {
            return Err(AppError::Conflict("Email already exists".to_string()));
        }
    }

    let user: User = sqlx::query_as(
        r#"UPDATE users SET
           email = COALESCE($1, email),
           name = COALESCE($2, name),
           role = COALESCE($3, role),
           updated_at = NOW()
           WHERE id = $4
           RETURNING *"#
    )
    .bind(&payload.email)
    .bind(&payload.name)
    .bind(&payload.role)
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    let special_permissions = get_user_permissions(&state.db, user.id).await?;
    let base_permissions = get_base_permissions_for_role(&user.role);

    Ok(Json(UserResponse::from_user_with_permissions(UserWithPermissions {
        user,
        special_permissions,
        base_permissions,
    })))
}

async fn delete_user(
    State(state): State<UserState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    verify_token(&state, &headers)?;

    let result = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("User not found".to_string()));
    }

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "User deleted successfully"
    })))
}

async fn update_user_status(
    State(state): State<UserState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateUserStatusRequest>,
) -> Result<Json<UserResponse>, AppError> {
    verify_token(&state, &headers)?;

    let user: User = sqlx::query_as(
        "UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *"
    )
    .bind(&payload.status)
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    let special_permissions = get_user_permissions(&state.db, user.id).await?;
    let base_permissions = get_base_permissions_for_role(&user.role);

    Ok(Json(UserResponse::from_user_with_permissions(UserWithPermissions {
        user,
        special_permissions,
        base_permissions,
    })))
}

async fn update_my_profile(
    State(state): State<UserState>,
    headers: HeaderMap,
    Json(payload): Json<UpdateMyProfileRequest>,
) -> Result<Json<UserResponse>, AppError> {
    let token = extract_bearer_token(headers.get("authorization").and_then(|v| v.to_str().ok()))
        .ok_or_else(|| AppError::Unauthorized("Missing token".to_string()))?;

    let claims = state.jwt.verify_token(&token)?;
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))?;

    // If changing password, verify current password
    if let (Some(current_pwd), Some(new_pwd)) = (&payload.current_password, &payload.new_password) {
        let user: User = sqlx::query_as("SELECT * FROM users WHERE id = $1")
            .bind(user_id)
            .fetch_one(&state.db)
            .await?;

        let valid = bcrypt::verify(current_pwd, &user.password_hash)?;
        if !valid {
            return Err(AppError::BadRequest("Current password is incorrect".to_string()));
        }

        let new_hash = bcrypt::hash(new_pwd, 12)?;
        sqlx::query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2")
            .bind(&new_hash)
            .bind(user_id)
            .execute(&state.db)
            .await?;
    }

    let user: User = sqlx::query_as(
        "UPDATE users SET name = COALESCE($1, name), updated_at = NOW() WHERE id = $2 RETURNING *"
    )
    .bind(&payload.name)
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    let special_permissions = get_user_permissions(&state.db, user.id).await?;
    let base_permissions = get_base_permissions_for_role(&user.role);

    Ok(Json(UserResponse::from_user_with_permissions(UserWithPermissions {
        user,
        special_permissions,
        base_permissions,
    })))
}

async fn grant_permissions(
    State(state): State<UserState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(payload): Json<GrantPermissionsRequest>,
) -> Result<Json<UserResponse>, AppError> {
    let token = extract_bearer_token(headers.get("authorization").and_then(|v| v.to_str().ok()))
        .ok_or_else(|| AppError::Unauthorized("Missing token".to_string()))?;

    let claims = state.jwt.verify_token(&token)?;
    let granter_id = Uuid::parse_str(&claims.sub).ok();

    for permission in &payload.permissions {
        sqlx::query(
            r#"INSERT INTO user_special_permissions (id, user_id, permission, granted_by)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (user_id, permission) DO NOTHING"#
        )
        .bind(Uuid::new_v4())
        .bind(id)
        .bind(permission)
        .bind(granter_id)
        .execute(&state.db)
        .await?;
    }

    let user: User = sqlx::query_as("SELECT * FROM users WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    let special_permissions = get_user_permissions(&state.db, user.id).await?;
    let base_permissions = get_base_permissions_for_role(&user.role);

    Ok(Json(UserResponse::from_user_with_permissions(UserWithPermissions {
        user,
        special_permissions,
        base_permissions,
    })))
}

async fn revoke_permissions(
    State(state): State<UserState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(payload): Json<GrantPermissionsRequest>,
) -> Result<Json<UserResponse>, AppError> {
    verify_token(&state, &headers)?;

    for permission in &payload.permissions {
        sqlx::query("DELETE FROM user_special_permissions WHERE user_id = $1 AND permission = $2")
            .bind(id)
            .bind(permission)
            .execute(&state.db)
            .await?;
    }

    let user: User = sqlx::query_as("SELECT * FROM users WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    let special_permissions = get_user_permissions(&state.db, user.id).await?;
    let base_permissions = get_base_permissions_for_role(&user.role);

    Ok(Json(UserResponse::from_user_with_permissions(UserWithPermissions {
        user,
        special_permissions,
        base_permissions,
    })))
}

// Helper functions
fn verify_token(state: &UserState, headers: &HeaderMap) -> Result<String, AppError> {
    let token = extract_bearer_token(headers.get("authorization").and_then(|v| v.to_str().ok()))
        .ok_or_else(|| AppError::Unauthorized("Missing token".to_string()))?;

    state.jwt.get_user_id_from_token(&token)
        .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))
}

fn get_base_permissions_for_role(role: &str) -> Vec<String> {
    match role {
        "admin" | "ROLE_ADMIN" => vec![
            "manage_users",
            "manage_qa_team",
            "full_test_case_access",
            "execute_all_tests",
            "manage_configurations",
            "export_reports",
            "manage_integrations",
        ],
        "qa_lead" | "ROLE_QA_LEAD" => vec![
            "manage_qa_team",
            "full_test_case_access",
            "execute_all_tests",
            "manage_test_configurations",
            "review_approve_test_cases",
            "export_reports",
        ],
        "qa_engineer" | "ROLE_QA_ENGINEER" => vec![
            "create_edit_test_cases",
            "execute_all_tests",
            "record_test_results",
        ],
        "developer" | "ROLE_DEVELOPER" => vec![
            "execute_automated_tests",
        ],
        "product_manager" | "ROLE_PRODUCT_MANAGER" => vec![
            "export_reports",
        ],
        "ui_ux_designer" | "ROLE_UI_UX_DESIGNER" => vec![
            "full_test_case_access",
            "export_reports",
        ],
        "viewer" | "ROLE_VIEWER" => vec![],
        _ => vec![],
    }
    .into_iter()
    .map(String::from)
    .collect()
}

async fn get_user_permissions(db: &PgPool, user_id: Uuid) -> Result<Vec<String>, AppError> {
    let permissions: Vec<(String,)> = sqlx::query_as(
        "SELECT permission FROM user_special_permissions WHERE user_id = $1"
    )
    .bind(user_id)
    .fetch_all(db)
    .await?;

    Ok(permissions.into_iter().map(|(p,)| p).collect())
}
