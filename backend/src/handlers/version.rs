use axum::{Json, response::IntoResponse};
use serde::{Deserialize, Serialize};

const VERSION: &str = env!("CARGO_PKG_VERSION");
const MIN_CLIENT_VERSION: &str = "0.1.0"; // Update this when breaking changes occur

#[derive(Debug, Serialize, Deserialize)]
pub struct VersionResponse {
    pub version: String,
    #[serde(rename = "minClientVersion")]
    pub min_client_version: String,
}

/// GET /version - Get server version and minimum compatible client version
pub async fn get_version() -> impl IntoResponse {
    Json(VersionResponse {
        version: VERSION.to_string(),
        min_client_version: MIN_CLIENT_VERSION.to_string(),
    })
}
