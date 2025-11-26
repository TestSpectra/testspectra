use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub name: String,
    pub role: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_active: DateTime<Utc>,
    pub joined_date: DateTime<Utc>,
    pub git_email: Option<String>,
    pub git_username: Option<String>,
}

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct UserSpecialPermission {
    pub id: Uuid,
    pub user_id: Uuid,
    pub permission: String,
    pub granted_at: DateTime<Utc>,
    pub granted_by: Option<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct UserWithPermissions {
    #[serde(flatten)]
    pub user: User,
    pub special_permissions: Vec<String>,
    pub base_permissions: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub user: UserResponse,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserResponse {
    pub id: String,
    pub email: String,
    pub name: String,
    pub role: String,
    pub status: String,
    pub base_permissions: Vec<String>,
    pub special_permissions: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
    pub last_active: String,
    pub joined_date: String,
    pub git_email: String,
    pub git_username: String,
}

impl UserResponse {
    pub fn from_user_with_permissions(uwp: UserWithPermissions) -> Self {
        // Compute git fields (fallback to email/name if NULL)
        let git_email = uwp.user.git_email.clone().unwrap_or_else(|| uwp.user.email.clone());
        let git_username = uwp.user.git_username.clone().unwrap_or_else(|| uwp.user.name.clone());
        
        Self {
            id: uwp.user.id.to_string(),
            email: uwp.user.email,
            name: uwp.user.name,
            role: uwp.user.role,
            status: uwp.user.status,
            git_email,
            git_username,
            base_permissions: uwp.base_permissions,
            special_permissions: uwp.special_permissions,
            created_at: uwp.user.created_at.to_rfc3339(),
            updated_at: uwp.user.updated_at.to_rfc3339(),
            last_active: uwp.user.last_active.to_rfc3339(),
            joined_date: uwp.user.joined_date.to_rfc3339(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub email: String,
    pub password: String,
    pub name: String,
    pub role: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    pub email: Option<String>,
    pub name: Option<String>,
    pub role: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserStatusRequest {
    pub status: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMyProfileRequest {
    pub name: Option<String>,
    pub current_password: Option<String>,
    pub new_password: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GrantPermissionsRequest {
    pub permissions: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RefreshTokenResponse {
    pub access_token: String,
    pub refresh_token: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListUsersQuery {
    pub search: Option<String>,
    pub role: Option<String>,
    pub status: Option<String>,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}
