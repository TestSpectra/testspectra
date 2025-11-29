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
use crate::models::test_case::*;

#[derive(Clone)]
pub struct TestCaseState {
    pub db: PgPool,
    pub jwt: JwtService,
}

pub fn test_case_routes(state: TestCaseState) -> Router {
    Router::new()
        .route("/test-cases", get(list_test_cases))
        .route("/test-cases", post(create_test_case))
        .route("/test-cases/bulk-delete", post(bulk_delete_test_cases))
        .route("/test-cases/:id", get(get_test_case))
        .route("/test-cases/:id", put(update_test_case))
        .route("/test-cases/:id", delete(delete_test_case))
        .route("/test-cases/:id/steps", put(update_test_steps))
        .route("/test-cases/:id/duplicate", post(duplicate_test_case))
        .route("/test-cases/reorder", put(reorder_test_case))
        .route("/test-cases/rebalance-order", post(rebalance_execution_order))
        .with_state(state)
}

async fn list_test_cases(
    State(state): State<TestCaseState>,
    headers: HeaderMap,
    Query(query): Query<ListTestCasesQuery>,
) -> Result<Json<ListTestCasesResponse>, AppError> {
    verify_token(&state, &headers)?;

    let page = query.page.unwrap_or(1).max(1);
    let page_size = query.page_size.unwrap_or(10).min(100);
    let offset = (page - 1) * page_size;

    let mut conditions = vec!["1=1".to_string()];
    let mut params: Vec<String> = vec![];

    if let Some(ref search) = query.search_query {
        if !search.is_empty() {
            params.push(format!("%{}%", search));
            conditions.push(format!("(title ILIKE ${} OR case_id ILIKE ${})", params.len(), params.len()));
        }
    }

    if let Some(ref suite) = query.suite_filter {
        if !suite.is_empty() {
            params.push(suite.clone());
            conditions.push(format!("suite = ${}", params.len()));
        }
    }

    if let Some(ref priority) = query.priority_filter {
        if !priority.is_empty() {
            params.push(priority.to_lowercase());
            conditions.push(format!("LOWER(priority) = ${}", params.len()));
        }
    }

    if let Some(ref automation) = query.automation_filter {
        if !automation.is_empty() {
            params.push(automation.to_lowercase());
            conditions.push(format!("LOWER(automation) = ${}", params.len()));
        }
    }

    if let Some(ref status) = query.status_filter {
        if !status.is_empty() {
            params.push(status.to_lowercase());
            conditions.push(format!("LOWER(last_status) = ${}", params.len()));
        }
    }

    let where_clause = conditions.join(" AND ");

    let count_sql = format!("SELECT COUNT(*) FROM test_cases WHERE {}", where_clause);
    let sql = format!(
        r#"SELECT tc.*, u.name as created_by_name
           FROM test_cases tc
           LEFT JOIN users u ON tc.created_by = u.id
           WHERE {}
           ORDER BY tc.execution_order ASC
           LIMIT {} OFFSET {}"#,
        where_clause, page_size, offset
    );

    // Build dynamic query - this is a simplified approach
    let test_cases: Vec<TestCaseSummaryRow> = build_query(&state.db, &sql, &params).await?;
    let total: i64 = build_count_query(&state.db, &count_sql, &params).await?;

    // Get all unique suites
    let suites: Vec<(String,)> = sqlx::query_as("SELECT DISTINCT suite FROM test_cases ORDER BY suite")
        .fetch_all(&state.db)
        .await?;

    let response = ListTestCasesResponse {
        test_cases: test_cases.into_iter().map(|tc| TestCaseSummary {
            id: tc.case_id,
            title: tc.title,
            suite: tc.suite,
            priority: tc.priority,
            case_type: tc.case_type,
            automation: tc.automation,
            last_status: tc.last_status,
            page_load_avg: tc.page_load_avg,
            last_run: tc.last_run,
            execution_order: tc.execution_order,
            updated_at: tc.updated_at,
            created_by_name: tc.created_by_name,
        }).collect(),
        total,
        page,
        page_size,
        available_suites: suites.into_iter().map(|(s,)| s).collect(),
    };

    Ok(Json(response))
}

#[derive(sqlx::FromRow)]
struct TestCaseSummaryRow {
    case_id: String,
    title: String,
    suite: String,
    priority: String,
    case_type: String,
    automation: String,
    last_status: String,
    page_load_avg: Option<String>,
    last_run: Option<String>,
    execution_order: f64,
    updated_at: chrono::DateTime<chrono::Utc>,
    created_by_name: Option<String>,
}

async fn build_query(db: &PgPool, sql: &str, params: &[String]) -> Result<Vec<TestCaseSummaryRow>, AppError> {
    // Dynamic query building based on param count
    let result = match params.len() {
        0 => sqlx::query_as(sql).fetch_all(db).await?,
        1 => sqlx::query_as(sql).bind(&params[0]).fetch_all(db).await?,
        2 => sqlx::query_as(sql).bind(&params[0]).bind(&params[1]).fetch_all(db).await?,
        3 => sqlx::query_as(sql).bind(&params[0]).bind(&params[1]).bind(&params[2]).fetch_all(db).await?,
        4 => sqlx::query_as(sql).bind(&params[0]).bind(&params[1]).bind(&params[2]).bind(&params[3]).fetch_all(db).await?,
        5 => sqlx::query_as(sql).bind(&params[0]).bind(&params[1]).bind(&params[2]).bind(&params[3]).bind(&params[4]).fetch_all(db).await?,
        _ => return Err(AppError::Internal("Too many parameters".to_string())),
    };
    Ok(result)
}

async fn build_count_query(db: &PgPool, sql: &str, params: &[String]) -> Result<i64, AppError> {
    let result: (i64,) = match params.len() {
        0 => sqlx::query_as(sql).fetch_one(db).await?,
        1 => sqlx::query_as(sql).bind(&params[0]).fetch_one(db).await?,
        2 => sqlx::query_as(sql).bind(&params[0]).bind(&params[1]).fetch_one(db).await?,
        3 => sqlx::query_as(sql).bind(&params[0]).bind(&params[1]).bind(&params[2]).fetch_one(db).await?,
        4 => sqlx::query_as(sql).bind(&params[0]).bind(&params[1]).bind(&params[2]).bind(&params[3]).fetch_one(db).await?,
        5 => sqlx::query_as(sql).bind(&params[0]).bind(&params[1]).bind(&params[2]).bind(&params[3]).bind(&params[4]).fetch_one(db).await?,
        _ => return Err(AppError::Internal("Too many parameters".to_string())),
    };
    Ok(result.0)
}

async fn get_test_case(
    State(state): State<TestCaseState>,
    headers: HeaderMap,
    Path(case_id): Path<String>,
) -> Result<Json<TestCaseResponse>, AppError> {
    verify_token(&state, &headers)?;

    let test_case: TestCase = sqlx::query_as(
        "SELECT * FROM test_cases WHERE case_id = $1"
    )
    .bind(&case_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Test case not found".to_string()))?;

    let steps: Vec<TestStep> = sqlx::query_as(
        "SELECT * FROM test_steps WHERE test_case_id = $1 ORDER BY step_order"
    )
    .bind(test_case.id)
    .fetch_all(&state.db)
    .await?;

    let creator_name: Option<(String,)> = sqlx::query_as(
        "SELECT name FROM users WHERE id = $1"
    )
    .bind(test_case.created_by)
    .fetch_optional(&state.db)
    .await?;

    Ok(Json(TestCaseResponse::from_with_steps(TestCaseWithSteps {
        test_case,
        steps,
        created_by_name: creator_name.map(|(n,)| n),
    })))
}

async fn create_test_case(
    State(state): State<TestCaseState>,
    headers: HeaderMap,
    Json(payload): Json<CreateTestCaseRequest>,
) -> Result<Json<TestCaseResponse>, AppError> {
    let user_id = verify_token(&state, &headers)?;
    let user_uuid = Uuid::parse_str(&user_id)
        .map_err(|_| AppError::Internal("Invalid user ID".to_string()))?;

    let id = Uuid::new_v4();

    // Generate next case_id
    let next_seq: (i64,) = sqlx::query_as("SELECT nextval('test_case_id_seq')")
        .fetch_one(&state.db)
        .await?;
    let case_id = format!("TC-{:04}", next_seq.0);

    // Get next execution_order (max + 1)
    let max_order: (Option<f64>,) = sqlx::query_as("SELECT MAX(execution_order) FROM test_cases")
        .fetch_one(&state.db)
        .await?;
    let next_order = max_order.0.unwrap_or(0.0) + 1.0;

    let test_case: TestCase = sqlx::query_as(
        r#"INSERT INTO test_cases 
           (id, case_id, title, description, suite, priority, case_type, automation, 
            last_status, expected_outcome, pre_condition, post_condition, tags, created_by, execution_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, $12, $13, $14)
           RETURNING *"#
    )
    .bind(id)
    .bind(&case_id)
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(&payload.suite)
    .bind(&payload.priority)
    .bind(&payload.case_type)
    .bind(&payload.automation)
    .bind(&payload.expected_outcome)
    .bind(&payload.pre_condition)
    .bind(&payload.post_condition)
    .bind(&payload.tags.unwrap_or_default())
    .bind(user_uuid)
    .bind(next_order)
    .fetch_one(&state.db)
    .await?;

    // Insert steps if provided
    let mut steps = Vec::new();
    if let Some(step_data) = payload.steps {
        for (order, step) in step_data.iter().enumerate() {
            let step_id = Uuid::new_v4();
            let action_params = step.action_params.clone().unwrap_or(serde_json::json!({}));
            let assertions = step.assertions.clone().unwrap_or(serde_json::json!([]));
            
            let inserted: TestStep = sqlx::query_as(
                r#"INSERT INTO test_steps 
                   (id, test_case_id, step_order, action_type, action_params, assertions, custom_expected_result)
                   VALUES ($1, $2, $3, $4, $5, $6, $7)
                   RETURNING *"#
            )
            .bind(step_id)
            .bind(id)
            .bind((order + 1) as i32)  // Ensure ordering starts from 1
            .bind(&step.action_type)
            .bind(&action_params)
            .bind(&assertions)
            .bind(&step.custom_expected_result)
            .fetch_one(&state.db)
            .await?;
            steps.push(inserted);
        }
    }

    let creator_name: Option<(String,)> = sqlx::query_as(
        "SELECT name FROM users WHERE id = $1"
    )
    .bind(user_uuid)
    .fetch_optional(&state.db)
    .await?;

    Ok(Json(TestCaseResponse::from_with_steps(TestCaseWithSteps {
        test_case,
        steps,
        created_by_name: creator_name.map(|(n,)| n),
    })))
}

async fn update_test_case(
    State(state): State<TestCaseState>,
    headers: HeaderMap,
    Path(case_id): Path<String>,
    Json(payload): Json<UpdateTestCaseRequest>,
) -> Result<Json<TestCaseResponse>, AppError> {
    verify_token(&state, &headers)?;

    let test_case: TestCase = sqlx::query_as(
        r#"UPDATE test_cases SET
           title = COALESCE($1, title),
           description = COALESCE($2, description),
           suite = COALESCE($3, suite),
           priority = COALESCE($4, priority),
           case_type = COALESCE($5, case_type),
           automation = COALESCE($6, automation),
           expected_outcome = COALESCE($7, expected_outcome),
           pre_condition = COALESCE($8, pre_condition),
           post_condition = COALESCE($9, post_condition),
           tags = COALESCE($10, tags),
           updated_at = NOW()
           WHERE case_id = $11
           RETURNING *"#
    )
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(&payload.suite)
    .bind(&payload.priority)
    .bind(&payload.case_type)
    .bind(&payload.automation)
    .bind(&payload.expected_outcome)
    .bind(&payload.pre_condition)
    .bind(&payload.post_condition)
    .bind(&payload.tags)
    .bind(&case_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Test case not found".to_string()))?;

    // Update steps if provided - this replaces all existing steps
    let steps = if let Some(step_data) = payload.steps {
        // Delete existing steps
        sqlx::query("DELETE FROM test_steps WHERE test_case_id = $1")
            .bind(test_case.id)
            .execute(&state.db)
            .await?;

        // Insert new steps with proper ordering
        let mut new_steps = Vec::new();
        for (order, step) in step_data.iter().enumerate() {
            let step_id = Uuid::new_v4();
            let action_params = step.action_params.clone().unwrap_or(serde_json::json!({}));
            let assertions = step.assertions.clone().unwrap_or(serde_json::json!([]));
            
            let inserted: TestStep = sqlx::query_as(
                r#"INSERT INTO test_steps 
                   (id, test_case_id, step_order, action_type, action_params, assertions, custom_expected_result)
                   VALUES ($1, $2, $3, $4, $5, $6, $7)
                   RETURNING *"#
            )
            .bind(step_id)
            .bind(test_case.id)
            .bind((order + 1) as i32)
            .bind(&step.action_type)
            .bind(&action_params)
            .bind(&assertions)
            .bind(&step.custom_expected_result)
            .fetch_one(&state.db)
            .await?;
            new_steps.push(inserted);
        }
        new_steps
    } else {
        // Fetch existing steps
        sqlx::query_as(
            "SELECT * FROM test_steps WHERE test_case_id = $1 ORDER BY step_order"
        )
        .bind(test_case.id)
        .fetch_all(&state.db)
        .await?
    };

    let creator_name: Option<(String,)> = sqlx::query_as(
        "SELECT name FROM users WHERE id = $1"
    )
    .bind(test_case.created_by)
    .fetch_optional(&state.db)
    .await?;

    Ok(Json(TestCaseResponse::from_with_steps(TestCaseWithSteps {
        test_case,
        steps,
        created_by_name: creator_name.map(|(n,)| n),
    })))
}

async fn update_test_steps(
    State(state): State<TestCaseState>,
    headers: HeaderMap,
    Path(case_id): Path<String>,
    Json(payload): Json<UpdateTestStepsRequest>,
) -> Result<Json<TestCaseResponse>, AppError> {
    verify_token(&state, &headers)?;

    let test_case: TestCase = sqlx::query_as(
        "SELECT * FROM test_cases WHERE case_id = $1"
    )
    .bind(&case_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Test case not found".to_string()))?;

    // Delete existing steps
    sqlx::query("DELETE FROM test_steps WHERE test_case_id = $1")
        .bind(test_case.id)
        .execute(&state.db)
        .await?;

    // Insert new steps with proper ordering (use array index for step_order)
    let mut steps = Vec::new();
    for (order, step) in payload.steps.iter().enumerate() {
        let step_id = Uuid::new_v4();
        let action_params = step.action_params.clone().unwrap_or(serde_json::json!({}));
        let assertions = step.assertions.clone().unwrap_or(serde_json::json!([]));
        
        let inserted: TestStep = sqlx::query_as(
            r#"INSERT INTO test_steps 
               (id, test_case_id, step_order, action_type, action_params, assertions, custom_expected_result)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               RETURNING *"#
        )
        .bind(step_id)
        .bind(test_case.id)
        .bind((order + 1) as i32)  // Always use array index + 1 for ordering
        .bind(&step.action_type)
        .bind(&action_params)
        .bind(&assertions)
        .bind(&step.custom_expected_result)
        .fetch_one(&state.db)
        .await?;
        steps.push(inserted);
    }

    // Update test case timestamp
    sqlx::query("UPDATE test_cases SET updated_at = NOW() WHERE id = $1")
        .bind(test_case.id)
        .execute(&state.db)
        .await?;

    let creator_name: Option<(String,)> = sqlx::query_as(
        "SELECT name FROM users WHERE id = $1"
    )
    .bind(test_case.created_by)
    .fetch_optional(&state.db)
    .await?;

    Ok(Json(TestCaseResponse::from_with_steps(TestCaseWithSteps {
        test_case,
        steps,
        created_by_name: creator_name.map(|(n,)| n),
    })))
}

async fn delete_test_case(
    State(state): State<TestCaseState>,
    headers: HeaderMap,
    Path(case_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    verify_token(&state, &headers)?;

    // Get test case first
    let test_case: Option<TestCase> = sqlx::query_as(
        "SELECT * FROM test_cases WHERE case_id = $1"
    )
    .bind(&case_id)
    .fetch_optional(&state.db)
    .await?;

    if let Some(tc) = test_case {
        // Delete steps first
        sqlx::query("DELETE FROM test_steps WHERE test_case_id = $1")
            .bind(tc.id)
            .execute(&state.db)
            .await?;

        // Delete test case
        sqlx::query("DELETE FROM test_cases WHERE id = $1")
            .bind(tc.id)
            .execute(&state.db)
            .await?;

        Ok(Json(serde_json::json!({
            "success": true,
            "message": "Test case deleted successfully"
        })))
    } else {
        Err(AppError::NotFound("Test case not found".to_string()))
    }
}

async fn bulk_delete_test_cases(
    State(state): State<TestCaseState>,
    headers: HeaderMap,
    Json(payload): Json<BulkDeleteRequest>,
) -> Result<Json<BulkDeleteResponse>, AppError> {
    verify_token(&state, &headers)?;

    let mut deleted_count = 0;

    for case_id in &payload.test_case_ids {
        let test_case: Option<TestCase> = sqlx::query_as(
            "SELECT * FROM test_cases WHERE case_id = $1"
        )
        .bind(case_id)
        .fetch_optional(&state.db)
        .await?;

        if let Some(tc) = test_case {
            sqlx::query("DELETE FROM test_steps WHERE test_case_id = $1")
                .bind(tc.id)
                .execute(&state.db)
                .await?;

            sqlx::query("DELETE FROM test_cases WHERE id = $1")
                .bind(tc.id)
                .execute(&state.db)
                .await?;

            deleted_count += 1;
        }
    }

    Ok(Json(BulkDeleteResponse {
        success: true,
        deleted_count,
        message: format!("{} test case(s) deleted successfully", deleted_count),
    }))
}

async fn duplicate_test_case(
    State(state): State<TestCaseState>,
    headers: HeaderMap,
    Path(case_id): Path<String>,
) -> Result<Json<TestCaseResponse>, AppError> {
    let user_id = verify_token(&state, &headers)?;
    let user_uuid = Uuid::parse_str(&user_id)
        .map_err(|_| AppError::Internal("Invalid user ID".to_string()))?;

    // Get the original test case
    let original: TestCase = sqlx::query_as(
        "SELECT * FROM test_cases WHERE case_id = $1"
    )
    .bind(&case_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Test case not found".to_string()))?;

    // Get original steps
    let original_steps: Vec<TestStep> = sqlx::query_as(
        "SELECT * FROM test_steps WHERE test_case_id = $1 ORDER BY step_order"
    )
    .bind(original.id)
    .fetch_all(&state.db)
    .await?;

    // Generate new IDs
    let new_id = Uuid::new_v4();
    let next_seq: (i64,) = sqlx::query_as("SELECT nextval('test_case_id_seq')")
        .fetch_one(&state.db)
        .await?;
    let new_case_id = format!("TC-{:04}", next_seq.0);

    // Get next execution_order - place duplicate right below original
    // Find the next item after the original by execution_order
    let next_item: Option<(f64,)> = sqlx::query_as(
        "SELECT execution_order FROM test_cases WHERE execution_order > $1 ORDER BY execution_order ASC LIMIT 1"
    )
    .bind(original.execution_order)
    .fetch_optional(&state.db)
    .await?;

    let next_order = match next_item {
        // Place between original and next item
        Some((next_exec_order,)) => (original.execution_order + next_exec_order) / 2.0,
        // No next item, place after original
        None => original.execution_order + 1.0,
    };

    // Create duplicated test case
    let new_test_case: TestCase = sqlx::query_as(
        r#"INSERT INTO test_cases 
           (id, case_id, title, description, suite, priority, case_type, automation, 
            last_status, expected_outcome, pre_condition, post_condition, tags, created_by, execution_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, $12, $13, $14)
           RETURNING *"#
    )
    .bind(new_id)
    .bind(&new_case_id)
    .bind(format!("{} (Copy)", original.title))
    .bind(&original.description)
    .bind(&original.suite)
    .bind(&original.priority)
    .bind(&original.case_type)
    .bind(&original.automation)
    .bind(&original.expected_outcome)
    .bind(&original.pre_condition)
    .bind(&original.post_condition)
    .bind(&original.tags)
    .bind(user_uuid)
    .bind(next_order)
    .fetch_one(&state.db)
    .await?;

    // Duplicate steps
    let mut new_steps = Vec::new();
    for step in original_steps {
        let step_id = Uuid::new_v4();
        let inserted: TestStep = sqlx::query_as(
            r#"INSERT INTO test_steps 
               (id, test_case_id, step_order, action_type, action_params, assertions, custom_expected_result)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               RETURNING *"#
        )
        .bind(step_id)
        .bind(new_id)
        .bind(step.step_order)
        .bind(&step.action_type)
        .bind(&step.action_params)
        .bind(&step.assertions)
        .bind(&step.custom_expected_result)
        .fetch_one(&state.db)
        .await?;
        new_steps.push(inserted);
    }

    let creator_name: Option<(String,)> = sqlx::query_as(
        "SELECT name FROM users WHERE id = $1"
    )
    .bind(user_uuid)
    .fetch_optional(&state.db)
    .await?;

    Ok(Json(TestCaseResponse::from_with_steps(TestCaseWithSteps {
        test_case: new_test_case,
        steps: new_steps,
        created_by_name: creator_name.map(|(n,)| n),
    })))
}

async fn reorder_test_case(
    State(state): State<TestCaseState>,
    headers: HeaderMap,
    Json(payload): Json<ReorderRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    verify_token(&state, &headers)?;

    // Nothing to reorder
    if payload.moved_ids.is_empty() {
        return Ok(Json(serde_json::json!({
            "success": true,
            "message": "No items to reorder",
        })));
    }

    // Fetch prev and next execution_order if provided (global ordering)
    let prev_order: Option<f64> = if let Some(ref prev_id) = payload.prev_id {
        let row: Option<(f64,)> = sqlx::query_as(
            "SELECT execution_order FROM test_cases WHERE case_id = $1"
        )
        .bind(prev_id)
        .fetch_optional(&state.db)
        .await?;
        row.map(|(v,)| v)
    } else {
        None
    };

    let next_order: Option<f64> = if let Some(ref next_id) = payload.next_id {
        let row: Option<(f64,)> = sqlx::query_as(
            "SELECT execution_order FROM test_cases WHERE case_id = $1"
        )
        .bind(next_id)
        .fetch_optional(&state.db)
        .await?;
        row.map(|(v,)| v)
    } else {
        None
    };

    // Fetch current execution_order for all moved items and keep their relative order
    let mut moved_rows: Vec<(String, f64)> = sqlx::query_as(
        "SELECT case_id, execution_order FROM test_cases WHERE case_id = ANY($1)"
    )
    .bind(&payload.moved_ids)
    .fetch_all(&state.db)
    .await?;

    // Sort by current execution_order to preserve internal ordering
    moved_rows.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal));

    let len = moved_rows.len() as f64;
    let mut new_orders: Vec<(String, f64)> = Vec::with_capacity(moved_rows.len());

    match (prev_order, next_order) {
        (Some(a), Some(b)) if b > a => {
            // Place block strictly between prev and next, evenly spaced
            let step = (b - a) / (len + 1.0);
            for (i, (case_id, _)) in moved_rows.into_iter().enumerate() {
                let idx = (i as f64) + 1.0;
                let new_order = a + step * idx;
                new_orders.push((case_id, new_order));
            }
        }
        (Some(a), _) => {
            // Only prev known: place block after prev, growing downwards
            for (i, (case_id, _)) in moved_rows.into_iter().enumerate() {
                let new_order = a + (i as f64) + 1.0;
                new_orders.push((case_id, new_order));
            }
        }
        (None, Some(b)) => {
            // Only next known: place block before next, growing upwards
            let n = moved_rows.len();
            for (i, (case_id, _)) in moved_rows.into_iter().enumerate() {
                let offset = (n - i) as f64;
                let new_order = b - offset;
                new_orders.push((case_id, new_order));
            }
        }
        (None, None) => {
            // No context (shouldn't normally happen) - normalize around 0
            for (i, (case_id, _)) in moved_rows.into_iter().enumerate() {
                let new_order = (i as f64) + 1.0;
                new_orders.push((case_id, new_order));
            }
        }
    }

    // Apply updates
    for (case_id, new_order) in new_orders {
        sqlx::query(
            "UPDATE test_cases SET execution_order = $1, updated_at = NOW() WHERE case_id = $2",
        )
        .bind(new_order)
        .bind(&case_id)
        .execute(&state.db)
        .await?;
    }

    Ok(Json(serde_json::json!({
        "success": true,
    })))
}

async fn rebalance_execution_order(
    State(state): State<TestCaseState>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, AppError> {
    // Only authenticated users can trigger rebalancing (no extra role check for now)
    verify_token(&state, &headers)?;

    // Re-normalize execution_order so that it is a dense sequence 1.0, 2.0, 3.0, ...
    // based on the current ordering. This keeps fractional indexing stable over time.
    let result = sqlx::query(
        r#"
        WITH ordered AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY execution_order ASC, created_at ASC, case_id ASC) AS rn
            FROM test_cases
        )
        UPDATE test_cases t
        SET execution_order = ordered.rn::double precision,
            updated_at = NOW()
        FROM ordered
        WHERE t.id = ordered.id
        "#,
    )
    .execute(&state.db)
    .await?;

    let updated_count = result.rows_affected() as i64;

    Ok(Json(serde_json::json!({
        "success": true,
        "updatedCount": updated_count,
    })))
}

fn verify_token(state: &TestCaseState, headers: &HeaderMap) -> Result<String, AppError> {
    let token = extract_bearer_token(headers.get("authorization").and_then(|v| v.to_str().ok()))
        .ok_or_else(|| AppError::Unauthorized("Missing token".to_string()))?;

    state.jwt.get_user_id_from_token(&token)
        .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))
}
