use axum::{
    extract::State,
    http::HeaderMap,
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::auth::{extract_bearer_token, JwtService};
use crate::error::AppError;

#[derive(Clone)]
pub struct TestSuiteState {
    pub db: PgPool,
    pub jwt: JwtService,
}

pub fn test_suite_routes(state: TestSuiteState) -> Router {
    Router::new()
        .route("/test-suites", get(list_test_suites))
        .route("/test-suites", post(create_test_suite))
        .with_state(state)
}

#[derive(Debug, FromRow)]
struct TestSuiteRow {
    id: Uuid,
    name: String,
    description: Option<String>,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TestSuiteResponse {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ListTestSuitesResponse {
    pub suites: Vec<TestSuiteResponse>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTestSuiteRequest {
    pub name: String,
    pub description: Option<String>,
}

async fn list_test_suites(
    State(state): State<TestSuiteState>,
    headers: HeaderMap,
) -> Result<Json<ListTestSuitesResponse>, AppError> {
    verify_token(&state, &headers)?;

    let suites: Vec<TestSuiteRow> = sqlx::query_as(
        "SELECT id, name, description, created_at FROM test_suites ORDER BY name"
    )
    .fetch_all(&state.db)
    .await?;

    let response = ListTestSuitesResponse {
        suites: suites.into_iter().map(|s| TestSuiteResponse {
            id: s.id.to_string(),
            name: s.name,
            description: s.description,
            created_at: s.created_at.to_rfc3339(),
        }).collect(),
    };

    Ok(Json(response))
}

async fn create_test_suite(
    State(state): State<TestSuiteState>,
    headers: HeaderMap,
    Json(req): Json<CreateTestSuiteRequest>,
) -> Result<Json<TestSuiteResponse>, AppError> {
    let user_id = verify_token(&state, &headers)?;
    let user_uuid = Uuid::parse_str(&user_id)
        .map_err(|_| AppError::BadRequest("Invalid user ID".to_string()))?;

    // Check if suite already exists
    let existing: Option<(Uuid,)> = sqlx::query_as(
        "SELECT id FROM test_suites WHERE LOWER(name) = LOWER($1)"
    )
    .bind(&req.name)
    .fetch_optional(&state.db)
    .await?;

    if existing.is_some() {
        return Err(AppError::BadRequest(format!("Test suite '{}' already exists", req.name)));
    }

    let suite: TestSuiteRow = sqlx::query_as(
        r#"INSERT INTO test_suites (name, description, created_by)
           VALUES ($1, $2, $3)
           RETURNING id, name, description, created_at"#
    )
    .bind(&req.name)
    .bind(&req.description)
    .bind(user_uuid)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(TestSuiteResponse {
        id: suite.id.to_string(),
        name: suite.name,
        description: suite.description,
        created_at: suite.created_at.to_rfc3339(),
    }))
}

fn verify_token(state: &TestSuiteState, headers: &HeaderMap) -> Result<String, AppError> {
    let token = extract_bearer_token(headers.get("authorization").and_then(|v| v.to_str().ok()))
        .ok_or_else(|| AppError::Unauthorized("Missing token".to_string()))?;

    state.jwt.get_user_id_from_token(&token)
        .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))
}
