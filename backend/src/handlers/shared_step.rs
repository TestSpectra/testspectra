use axum::{
    extract::{Path, Query, State},
    http::HeaderMap,
    routing::get,
    Json, Router,
};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::{extract_bearer_token, JwtService};
use crate::error::AppError;
use crate::handlers::test_step::validate_and_prepare_step;
use crate::models::shared_step::{
    CreateSharedStepRequest, SharedStepDetailResponse, SharedStepStepResponse, SharedStepStepRow,
    SharedStepSummary, SharedStepWithCountRow, UpdateSharedStepRequest,
};
use crate::models::test_case::TestStepResponse;

#[derive(Clone)]
pub struct SharedStepState {
    pub db: PgPool,
    pub jwt: JwtService,
}

#[derive(Debug, Deserialize)]
pub struct ListSharedStepsQuery {
    pub search: Option<String>,
    pub page: Option<i32>,
    pub limit: Option<i32>,
}

impl Default for ListSharedStepsQuery {
    fn default() -> Self {
        Self {
            search: None,
            page: Some(1),
            limit: Some(20),
        }
    }
}

pub fn shared_step_routes(state: SharedStepState) -> Router {
    Router::new()
        .route(
            "/shared-steps",
            get(list_shared_steps).post(create_shared_step),
        )
        .route(
            "/shared-steps/:id",
            get(get_shared_step)
                .put(update_shared_step)
                .delete(delete_shared_step),
        )
        .with_state(state)
}

async fn list_shared_steps(
    State(state): State<SharedStepState>,
    headers: HeaderMap,
    Query(query): Query<ListSharedStepsQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    verify_token(&state, &headers)?;

    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(20).max(1).min(100); // cap at 100
    let offset = (page - 1) * limit;

    // Optional search pattern
    let (where_clause, pattern) = if let Some(ref search) = query.search {
        let pat = format!("%{}%", search);
        (
            " WHERE s.name ILIKE $1 OR s.description ILIKE $1",
            Some(pat),
        )
    } else {
        ("", None)
    };

    // Total number of shared steps matching the filter
    let count_sql = format!("SELECT COUNT(*) FROM shared_steps s{}", where_clause);

    let total: i64 = if let Some(ref pat) = pattern {
        sqlx::query_scalar::<_, i64>(&count_sql)
            .bind(pat)
            .fetch_one(&state.db)
            .await?
    } else {
        sqlx::query_scalar::<_, i64>(&count_sql)
            .fetch_one(&state.db)
            .await?
    };

    // Data query with aggregated step_count and pagination
    let data_sql = format!(
        r#"
        SELECT s.id,
               s.name,
               s.description,
               u.name AS created_by_name,
               s.created_at,
               s.updated_at,
               COALESCE(COUNT(t.id), 0) AS step_count
        FROM shared_steps s
        LEFT JOIN users u ON s.created_by = u.id
        LEFT JOIN test_steps t
               ON t.shared_step_id = s.id
              AND t.test_case_id IS NULL
              AND t.step_type = 'shared_definition'
        {where_clause}
        GROUP BY s.id, s.name, s.description, u.name, s.created_at, s.updated_at
        ORDER BY s.created_at DESC
        LIMIT {limit} OFFSET {offset}
        "#,
        where_clause = if pattern.is_some() {
            " WHERE s.name ILIKE $1 OR s.description ILIKE $1"
        } else {
            ""
        },
        limit = limit,
        offset = offset,
    );

    let rows: Vec<SharedStepWithCountRow> = if let Some(ref pat) = pattern {
        sqlx::query_as::<_, SharedStepWithCountRow>(&data_sql)
            .bind(pat)
            .fetch_all(&state.db)
            .await?
    } else {
        sqlx::query_as::<_, SharedStepWithCountRow>(&data_sql)
            .fetch_all(&state.db)
            .await?
    };

    let shared_steps: Vec<SharedStepSummary> =
        rows.into_iter().map(SharedStepSummary::from).collect();

    Ok(Json(serde_json::json!({
        "sharedSteps": shared_steps,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": if limit > 0 { (total + limit as i64 - 1) / limit as i64 } else { 0 }
        }
    })))
}

async fn get_shared_step(
    State(state): State<SharedStepState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<SharedStepDetailResponse>, AppError> {
    verify_token(&state, &headers)?;

    let row: Option<SharedStepWithCountRow> = sqlx::query_as(
        r#"
        SELECT s.id,
               s.name,
               s.description,
               u.name AS created_by_name,
               s.created_at,
               s.updated_at,
               COALESCE(COUNT(t.id), 0) AS step_count
        FROM shared_steps s
        LEFT JOIN users u ON s.created_by = u.id
        LEFT JOIN test_steps t
               ON t.shared_step_id = s.id
              AND t.test_case_id IS NULL
              AND t.step_type = 'shared_definition'
        WHERE s.id = $1
        GROUP BY s.id, s.name, s.description, u.name, s.created_at, s.updated_at
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?;

    let row = row.ok_or_else(|| AppError::NotFound("Shared step not found".to_string()))?;

    let steps: Vec<SharedStepStepRow> = sqlx::query_as(
        r#"
        SELECT id, step_order, action_type, action_params, assertions, custom_expected_result
        FROM test_steps
        WHERE shared_step_id = $1 AND test_case_id IS NULL AND step_type = 'shared_definition'
        ORDER BY step_order
        "#,
    )
    .bind(id)
    .fetch_all(&state.db)
    .await?;

    let step_responses: Vec<SharedStepStepResponse> =
        steps.into_iter().map(TestStepResponse::from).collect();

    let detail = SharedStepDetailResponse {
        id: row.id.to_string(),
        name: row.name,
        description: row.description,
        step_count: row.step_count,
        created_by: row.created_by_name,
        created_at: row.created_at.to_rfc3339(),
        updated_at: row.updated_at.to_rfc3339(),
        steps: step_responses,
    };

    Ok(Json(detail))
}

async fn create_shared_step(
    State(state): State<SharedStepState>,
    headers: HeaderMap,
    Json(payload): Json<CreateSharedStepRequest>,
) -> Result<Json<SharedStepDetailResponse>, AppError> {
    let user_id = verify_token(&state, &headers)?;
    let user_uuid =
        Uuid::parse_str(&user_id).map_err(|_| AppError::Internal("Invalid user ID".to_string()))?;

    let mut tx = state.db.begin().await?;

    // Check for duplicate name
    let existing: Option<(String,)> =
        sqlx::query_as("SELECT name FROM shared_steps WHERE name = $1")
            .bind(&payload.name)
            .fetch_optional(&mut *tx)
            .await?;

    if existing.is_some() {
        return Err(AppError::BadRequest(format!(
            "Shared step with name '{}' already exists",
            payload.name
        )));
    }

    let shared_step_id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO shared_steps (id, name, description, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(user_uuid)
    .fetch_one(&mut *tx)
    .await?;

    for (index, step) in payload.steps.iter().enumerate() {
        let step_identifier = (index + 1).to_string(); // Use 1-based index for identifier
        let (action_params, assertions) = validate_and_prepare_step(step, &step_identifier)?;
        sqlx::query(
            r#"
            INSERT INTO test_steps (
                id, test_case_id, shared_step_id, step_order, step_type,
                action_type, action_params, assertions, custom_expected_result
            )
            VALUES ($1, NULL, $2, $3, 'shared_definition', $4, $5, $6, $7)
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(shared_step_id)
        .bind((index + 1) as i32)
        .bind(&step.action_type)
        .bind(&action_params)
        .bind(&assertions)
        .bind(&step.custom_expected_result)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    // Reuse get_shared_step to construct full response
    get_shared_step(State(state), headers, Path(shared_step_id)).await
}

async fn update_shared_step(
    State(state): State<SharedStepState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateSharedStepRequest>,
) -> Result<Json<SharedStepDetailResponse>, AppError> {
    let _user_id = verify_token(&state, &headers)?;

    let mut tx = state.db.begin().await?;

    let exists: Option<(Uuid,)> = sqlx::query_as("SELECT id FROM shared_steps WHERE id = $1")
        .bind(id)
        .fetch_optional(&mut *tx)
        .await?;

    if exists.is_none() {
        return Err(AppError::NotFound("Shared step not found".to_string()));
    }

    // If name is being updated, check for duplicates (excluding current record)
    if let Some(ref new_name) = payload.name {
        let duplicate: Option<(String,)> =
            sqlx::query_as("SELECT name FROM shared_steps WHERE name = $1 AND id != $2")
                .bind(new_name)
                .bind(id)
                .fetch_optional(&mut *tx)
                .await?;

        if duplicate.is_some() {
            return Err(AppError::BadRequest(format!(
                "Shared step with name '{}' already exists",
                new_name
            )));
        }
    }

    sqlx::query(
        r#"
        UPDATE shared_steps
        SET name = COALESCE($1, name),
            description = COALESCE($2, description),
            updated_at = NOW()
        WHERE id = $3
        "#,
    )
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(id)
    .execute(&mut *tx)
    .await?;

    if let Some(steps) = &payload.steps {
        // Replace existing definition steps
        sqlx::query("DELETE FROM test_steps WHERE shared_step_id = $1 AND test_case_id IS NULL")
            .bind(id)
            .execute(&mut *tx)
            .await?;

        for (index, step) in steps.iter().enumerate() {
            let step_identifier = (index + 1).to_string(); // Use 1-based index for identifier
            let (action_params, assertions) = validate_and_prepare_step(step, &step_identifier)?;
            sqlx::query(
                r#"
                INSERT INTO test_steps (
                    id, test_case_id, shared_step_id, step_order, step_type,
                    action_type, action_params, assertions, custom_expected_result
                )
                VALUES ($1, NULL, $2, $3, 'shared_definition', $4, $5, $6, $7)
                "#,
            )
            .bind(Uuid::new_v4())
            .bind(id)
            .bind((index + 1) as i32)
            .bind(&step.action_type)
            .bind(&action_params)
            .bind(&assertions)
            .bind(&step.custom_expected_result)
            .execute(&mut *tx)
            .await?;
        }
    }

    tx.commit().await?;

    get_shared_step(State(state), headers, Path(id)).await
}

async fn delete_shared_step(
    State(state): State<SharedStepState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let _user_id = verify_token(&state, &headers)?;

    // Block delete if shared step is referenced by any test case steps
    let ref_count: Option<(i64,)> = sqlx::query_as(
        "SELECT COUNT(*)::BIGINT FROM test_steps WHERE shared_step_id = $1 AND test_case_id IS NOT NULL",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?;

    if let Some((count,)) = ref_count {
        if count > 0 {
            return Err(AppError::BadRequest(format!(
                "Cannot delete shared step while it is referenced by {} test case step(s)",
                count
            )));
        }
    }

    // Cascade delete definition steps (step_type = 'shared_definition' and test_case_id IS NULL)
    sqlx::query("DELETE FROM test_steps WHERE shared_step_id = $1 AND test_case_id IS NULL AND step_type = 'shared_definition'")
        .bind(id)
        .execute(&state.db)
        .await?;

    let result = sqlx::query("DELETE FROM shared_steps WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Shared step not found".to_string()));
    }

    Ok(Json(serde_json::json!({
        "success": true,
    })))
}

fn verify_token(state: &SharedStepState, headers: &HeaderMap) -> Result<String, AppError> {
    let token = extract_bearer_token(headers.get("authorization").and_then(|v| v.to_str().ok()))
        .ok_or_else(|| AppError::Unauthorized("Missing token".to_string()))?;

    state
        .jwt
        .get_user_id_from_token(&token)
        .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))
}
