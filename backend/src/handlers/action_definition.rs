use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sqlx::PgPool;

use crate::models::{
    ActionDefinition, ActionDefinitionResponse,
    AssertionDefinition, AssertionDefinitionResponse,
    DefinitionsResponse,
};

#[derive(Clone)]
pub struct ActionDefinitionState {
    pub pool: PgPool,
}

/// GET /api/definitions
/// Returns all active action and assertion definitions
pub async fn get_definitions(
    State(state): State<ActionDefinitionState>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    // Fetch action definitions
    let actions: Vec<ActionDefinition> = sqlx::query_as(
        r#"
        SELECT id, action_key, label, category, platform, description, 
               param_schema, is_system, created_by, display_order, is_active,
               created_at, updated_at
        FROM action_definitions 
        WHERE is_active = true 
        ORDER BY category, display_order
        "#
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to fetch action definitions: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Failed to fetch action definitions"})),
        )
    })?;

    // Fetch assertion definitions
    let assertions: Vec<AssertionDefinition> = sqlx::query_as(
        r#"
        SELECT id, assertion_key, label, category, description, 
               param_schema, valid_for_actions, is_system, created_by, 
               display_order, is_active, created_at, updated_at
        FROM assertion_definitions 
        WHERE is_active = true 
        ORDER BY category, display_order
        "#
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to fetch assertion definitions: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Failed to fetch assertion definitions"})),
        )
    })?;

    let response = DefinitionsResponse {
        actions: actions.into_iter().map(ActionDefinitionResponse::from).collect(),
        assertions: assertions.into_iter().map(AssertionDefinitionResponse::from).collect(),
    };

    Ok(Json(response))
}

/// GET /api/definitions/actions
/// Returns only action definitions
pub async fn get_action_definitions(
    State(state): State<ActionDefinitionState>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let actions: Vec<ActionDefinition> = sqlx::query_as(
        r#"
        SELECT id, action_key, label, category, platform, description, 
               param_schema, is_system, created_by, display_order, is_active,
               created_at, updated_at
        FROM action_definitions 
        WHERE is_active = true 
        ORDER BY category, display_order
        "#
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to fetch action definitions: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Failed to fetch action definitions"})),
        )
    })?;

    let response: Vec<ActionDefinitionResponse> = actions
        .into_iter()
        .map(ActionDefinitionResponse::from)
        .collect();

    Ok(Json(serde_json::json!({ "actions": response })))
}

/// GET /api/definitions/assertions
/// Returns only assertion definitions
pub async fn get_assertion_definitions(
    State(state): State<ActionDefinitionState>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let assertions: Vec<AssertionDefinition> = sqlx::query_as(
        r#"
        SELECT id, assertion_key, label, category, description, 
               param_schema, valid_for_actions, is_system, created_by, 
               display_order, is_active, created_at, updated_at
        FROM assertion_definitions 
        WHERE is_active = true 
        ORDER BY category, display_order
        "#
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to fetch assertion definitions: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Failed to fetch assertion definitions"})),
        )
    })?;

    let response: Vec<AssertionDefinitionResponse> = assertions
        .into_iter()
        .map(AssertionDefinitionResponse::from)
        .collect();

    Ok(Json(serde_json::json!({ "assertions": response })))
}
