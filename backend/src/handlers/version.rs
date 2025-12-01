use axum::{Json, response::IntoResponse};
use serde::{Deserialize, Serialize};

const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Get minimum client version from major.minor of server version
/// Patch versions are always compatible
fn get_min_client_version() -> String {
    let parts: Vec<&str> = VERSION.split('.').collect();
    if parts.len() >= 2 {
        format!("{}.{}.0", parts[0], parts[1])
    } else {
        VERSION.to_string()
    }
}

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
        min_client_version: get_min_client_version(),
    })
}
