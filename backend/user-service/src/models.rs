use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: String,
    pub status: String,
    pub git_username: Option<String>,
    pub git_email: Option<String>,
    pub joined_date: DateTime<Utc>,
    pub last_active: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UserSpecialPermission {
    pub id: Uuid,
    pub user_id: Uuid,
    pub permission: String,
    pub granted_at: DateTime<Utc>,
    pub granted_by: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserWithPermissions {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub role: String,
    pub status: String,
    pub git_username: Option<String>,
    pub git_email: Option<String>,
    pub joined_date: DateTime<Utc>,
    pub last_active: DateTime<Utc>,
    pub base_permissions: Vec<String>,
    pub special_permissions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub role: String,
    pub exp: usize,
    pub iat: usize,
}
