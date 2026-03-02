use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ProjectConfig {
    pub project_id: String,
    pub config_data: serde_json::Value,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProjectConfig {
    pub config_data: serde_json::Value,
}
