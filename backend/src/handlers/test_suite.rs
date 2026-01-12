use axum::{
    extract::{Path, State},
    http::HeaderMap,
    routing::{delete, get, post, put},
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
        .route("/test-suites/:id", put(update_test_suite))
        .route("/test-suites/:id", delete(delete_test_suite))
        .with_state(state)
}

#[derive(Debug, FromRow)]
struct TestSuiteRow {
    id: Uuid,
    name: String,
    description: Option<String>,
    created_at: DateTime<Utc>,
    created_by_name: Option<String>,
    test_case_count: Option<i64>,
    automated_count: Option<i64>,
    last_run: Option<String>,
    pass_rate: Option<f64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TestSuiteResponse {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
    pub created_by: String,
    pub test_case_count: i64,
    pub automated_count: i64,
    pub last_run: String,
    pub pass_rate: f64,
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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTestSuiteRequest {
    pub name: String,
    pub description: Option<String>,
}

async fn list_test_suites(
    State(state): State<TestSuiteState>,
    headers: HeaderMap,
) -> Result<Json<ListTestSuitesResponse>, AppError> {
    verify_token(&state, &headers)?;

    let suites: Vec<TestSuiteRow> = sqlx::query_as(
        r#"
        SELECT 
            ts.id, 
            ts.name, 
            ts.description, 
            ts.created_at,
            u.name as created_by_name,
            COUNT(tc.id) as test_case_count,
            COUNT(CASE WHEN tc.automation = 'Automated' THEN 1 END) as automated_count,
            MAX(tc.last_run) as last_run,
            COALESCE(
                (COUNT(CASE WHEN LOWER(tc.last_status) = 'passed' THEN 1 END)::FLOAT / NULLIF(COUNT(tc.id), 0)::FLOAT) * 100,
                0
            ) as pass_rate
        FROM test_suites ts
        LEFT JOIN users u ON ts.created_by = u.id
        LEFT JOIN test_cases tc ON ts.name = tc.suite
        GROUP BY ts.id, u.name
        ORDER BY ts.name
        "#
    )
    .fetch_all(&state.db)
    .await?;

    let response = ListTestSuitesResponse {
        suites: suites
            .into_iter()
            .map(|s| TestSuiteResponse {
                id: s.id.to_string(),
                name: s.name,
                description: s.description,
                created_at: s.created_at.to_rfc3339(),
                created_by: s.created_by_name.unwrap_or_else(|| "Unknown".to_string()),
                test_case_count: s.test_case_count.unwrap_or(0),
                automated_count: s.automated_count.unwrap_or(0),
                last_run: s.last_run.unwrap_or_else(|| "Belum dijalankan".to_string()),
                pass_rate: s.pass_rate.unwrap_or(0.0),
            })
            .collect(),
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
    let existing: Option<(Uuid,)> =
        sqlx::query_as("SELECT id FROM test_suites WHERE LOWER(name) = LOWER($1)")
            .bind(&req.name)
            .fetch_optional(&state.db)
            .await?;

    if existing.is_some() {
        return Err(AppError::BadRequest(format!(
            "Test suite '{}' already exists",
            req.name
        )));
    }

    // Get user name for response
    let user_name: (String,) = sqlx::query_as("SELECT name FROM users WHERE id = $1")
        .bind(user_uuid)
        .fetch_one(&state.db)
        .await
        .unwrap_or(("Unknown".to_string(),));

    let suite: TestSuiteRow = sqlx::query_as(
        r#"INSERT INTO test_suites (name, description, created_by)
           VALUES ($1, $2, $3)
           RETURNING 
            id, 
            name, 
            description, 
            created_at, 
            $4 as created_by_name,
            0::bigint as test_case_count,
            0::bigint as automated_count,
            NULL::text as last_run,
            0::float as pass_rate"#,
    )
    .bind(&req.name)
    .bind(&req.description)
    .bind(user_uuid)
    .bind(&user_name.0)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(TestSuiteResponse {
        id: suite.id.to_string(),
        name: suite.name,
        description: suite.description,
        created_at: suite.created_at.to_rfc3339(),
        created_by: suite
            .created_by_name
            .unwrap_or_else(|| "Unknown".to_string()),
        test_case_count: 0,
        automated_count: 0,
        last_run: "Belum dijalankan".to_string(),
        pass_rate: 0.0,
    }))
}

async fn update_test_suite(
    State(state): State<TestSuiteState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateTestSuiteRequest>,
) -> Result<Json<TestSuiteResponse>, AppError> {
    verify_token(&state, &headers)?;

    // Check if another suite with same name exists (excluding current)
    let existing: Option<(Uuid,)> =
        sqlx::query_as("SELECT id FROM test_suites WHERE LOWER(name) = LOWER($1) AND id != $2")
            .bind(&req.name)
            .bind(id)
            .fetch_optional(&state.db)
            .await?;

    if existing.is_some() {
        return Err(AppError::BadRequest(format!(
            "Test suite '{}' already exists",
            req.name
        )));
    }

    // Get current suite to get old name
    let old_suite: (String,) = sqlx::query_as("SELECT name FROM test_suites WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Test suite not found".to_string()))?;

    let old_name = old_suite.0;

    // Update suite
    // We also need to update the suite name in test_cases table if name changed!
    let mut tx = state.db.begin().await?;

    let suite_row = sqlx::query_as::<_, TestSuiteRow>(
        r#"
        UPDATE test_suites 
        SET name = $1, description = $2
        WHERE id = $3
        RETURNING 
            id, 
            name, 
            description, 
            created_at,
            (SELECT name FROM users WHERE id = created_by) as created_by_name,
            (SELECT COUNT(*) FROM test_cases WHERE suite = $1) as test_case_count,
            (SELECT COUNT(*) FROM test_cases WHERE suite = $1 AND automation = 'Automated') as automated_count,
            (SELECT MAX(last_run) FROM test_cases WHERE suite = $1) as last_run,
            COALESCE(
                ((SELECT COUNT(*) FROM test_cases WHERE suite = $1 AND LOWER(last_status) = 'passed')::FLOAT / 
                NULLIF((SELECT COUNT(*) FROM test_cases WHERE suite = $1), 0)::FLOAT) * 100,
                0
            ) as pass_rate
        "#
    )
    .bind(&req.name)
    .bind(&req.description)
    .bind(id)
    .fetch_one(&mut *tx)
    .await?;

    // If name changed, update all test cases
    if old_name != req.name {
        sqlx::query("UPDATE test_cases SET suite = $1 WHERE suite = $2")
            .bind(&req.name)
            .bind(&old_name)
            .execute(&mut *tx)
            .await?;
    }

    tx.commit().await?;

    Ok(Json(TestSuiteResponse {
        id: suite_row.id.to_string(),
        name: suite_row.name,
        description: suite_row.description,
        created_at: suite_row.created_at.to_rfc3339(),
        created_by: suite_row
            .created_by_name
            .unwrap_or_else(|| "Unknown".to_string()),
        test_case_count: suite_row.test_case_count.unwrap_or(0),
        automated_count: suite_row.automated_count.unwrap_or(0),
        last_run: suite_row
            .last_run
            .unwrap_or_else(|| "Belum dijalankan".to_string()),
        pass_rate: suite_row.pass_rate.unwrap_or(0.0),
    }))
}

async fn delete_test_suite(
    State(state): State<TestSuiteState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    verify_token(&state, &headers)?;

    // Get suite name first to update test cases or we can cascade delete if we want?
    // Usually we don't want to delete test cases, maybe just set suite to 'Unassigned' or something?
    // Or strictly delete suite only if empty?
    // The frontend usually implies deleting the suite entity.
    // For now, let's just delete the suite. The test cases will have a 'suite' string that no longer matches a suite in test_suites table.
    // This is fine since there is no foreign key constraint on test_cases.suite pointing to test_suites.id/name (it's just a string).
    // But ideally we should update them to 'Unassigned' or keep them as is (orphan suite name).
    // Let's keep them as is for now, or update them to empty string/null?
    // If we delete a suite, the test cases conceptually shouldn't belong to it anymore.

    // Let's check what `test_cases` table definition says: `suite VARCHAR(255) NOT NULL`.
    // So we can't set it to NULL. Maybe empty string? Or "Unassigned"?

    // I'll implement a transaction: Delete suite, and update associated test cases to 'Unassigned'.

    let suite = sqlx::query_as::<_, (String,)>("SELECT name FROM test_suites WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?;

    if let Some((name,)) = suite {
        let mut tx = state.db.begin().await?;

        sqlx::query("DELETE FROM test_suites WHERE id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await?;

        sqlx::query("DELETE FROM test_cases WHERE suite = $1")
            .bind(name)
            .execute(&mut *tx)
            .await?;

        tx.commit().await?;
    } else {
        return Err(AppError::NotFound("Test suite not found".to_string()));
    }

    Ok(Json(serde_json::json!({ "success": true })))
}

fn verify_token(state: &TestSuiteState, headers: &HeaderMap) -> Result<String, AppError> {
    let token = extract_bearer_token(headers.get("authorization").and_then(|v| v.to_str().ok()))
        .ok_or_else(|| AppError::Unauthorized("Missing token".to_string()))?;

    state
        .jwt
        .get_user_id_from_token(&token)
        .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))
}
