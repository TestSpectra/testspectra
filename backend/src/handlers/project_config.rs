use axum::{
    extract::{Path, State},
    Json,
    routing::get,
    Router,
};
use crate::error::AppError;
use crate::models::project_config::{ProjectConfig, UpdateProjectConfig};
use sqlx::PgPool;

#[derive(Clone)]
pub struct ProjectConfigState {
    pub db: PgPool,
}


// TODO: remove endpoint /config use the correct project_id if already implemented
pub fn project_config_routes(state: ProjectConfigState) -> Router {
    Router::new()
        .route("/config", get(get_default_config))
        .route("/config/:project_id", get(get_config).put(update_config))
        .with_state(state)
}

async fn get_config(
    State(state): State<ProjectConfigState>,
    Path(project_id): Path<String>,
) -> Result<Json<ProjectConfig>, AppError> {
    let config: Option<ProjectConfig> = sqlx::query_as(
        "SELECT project_id, config_data, updated_at FROM project_configurations WHERE project_id = $1"
    )
    .bind(&project_id)
    .fetch_optional(&state.db)
    .await?;

    match config {
        Some(c) => Ok(Json(c)),
        None => {
            // Fallback to default
            let default_config: ProjectConfig = sqlx::query_as(
                "SELECT project_id, config_data, updated_at FROM project_configurations WHERE project_id = 'default'"
            )
            .fetch_one(&state.db)
            .await?;
            Ok(Json(default_config))
        }
    }
}

async fn get_default_config(
    State(state): State<ProjectConfigState>,
) -> Result<Json<ProjectConfig>, AppError> {
    let default_config: ProjectConfig = sqlx::query_as(
        "SELECT project_id, config_data, updated_at FROM project_configurations WHERE project_id = 'default'"
    )
    .fetch_one(&state.db)
    .await?;
    Ok(Json(default_config))
}

async fn update_config(
    State(state): State<ProjectConfigState>,
    Path(project_id): Path<String>,
    Json(payload): Json<UpdateProjectConfig>,
) -> Result<Json<ProjectConfig>, AppError> {
    let config: ProjectConfig = sqlx::query_as(
        r#"
        INSERT INTO project_configurations (project_id, config_data, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (project_id) 
        DO UPDATE SET config_data = EXCLUDED.config_data, updated_at = EXCLUDED.updated_at
        RETURNING project_id, config_data, updated_at
        "#
    )
    .bind(&project_id)
    .bind(&payload.config_data)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(config))
}
