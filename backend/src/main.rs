mod auth;
mod config;
mod error;
mod handlers;
mod models;
mod maintenance;

use axum::Router;
use sqlx::postgres::PgPoolOptions;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use auth::JwtService;
use config::Config;
use handlers::{user::UserState, test_case::TestCaseState, test_suite::TestSuiteState, ActionDefinitionState};
use axum::routing::get;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load .env file
    dotenvy::dotenv().ok();

    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load config
    let config = Config::from_env();

    // Create database pool
    let db = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await?;

    tracing::info!("Connected to database");

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&db)
        .await?;

    tracing::info!("Migrations completed");

    // Seed admin user if not exists
    seed_admin_user(&db, &config).await?;

    // Create JWT service
    let jwt = JwtService::new(config.jwt_secret.clone());

    // Create states
    let user_state = UserState { db: db.clone(), jwt: jwt.clone() };
    let test_case_state = TestCaseState { db: db.clone(), jwt: jwt.clone() };
    let test_suite_state = TestSuiteState { db: db.clone(), jwt: jwt.clone() };
    let action_def_state = ActionDefinitionState { pool: db.clone() };

    // CORS layer
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router with definitions routes
    let definitions_routes = Router::new()
        .route("/definitions", get(handlers::get_definitions))
        .route("/definitions/actions", get(handlers::get_action_definitions))
        .route("/definitions/assertions", get(handlers::get_assertion_definitions))
        .with_state(action_def_state);

    // Start background maintenance job for execution_order rebalancing
    maintenance::start_execution_order_maintenance(db.clone());

    let app = Router::new()
        .nest("/api", handlers::user_routes(user_state))
        .nest("/api", handlers::test_case_routes(test_case_state))
        .nest("/api", handlers::test_suite_routes(test_suite_state))
        .nest("/api", definitions_routes)
        .layer(cors);

    // Start server
    let listener = tokio::net::TcpListener::bind(&config.server_addr).await?;
    tracing::info!("Server running on http://{}", config.server_addr);

    axum::serve(listener, app).await?;

    Ok(())
}

async fn seed_admin_user(db: &sqlx::PgPool, config: &Config) -> Result<(), Box<dyn std::error::Error>> {
    // Check if admin exists
    let exists: Option<(i32,)> = sqlx::query_as("SELECT 1 FROM users WHERE email = $1")
        .bind(&config.admin_email)
        .fetch_optional(db)
        .await?;

    if exists.is_none() {
        let password_hash = bcrypt::hash(&config.admin_password, 12)?;
        let id = uuid::Uuid::new_v4();

        sqlx::query(
            r#"INSERT INTO users (id, email, password_hash, name, role, status)
               VALUES ($1, $2, $3, $4, 'admin', 'active')"#
        )
        .bind(id)
        .bind(&config.admin_email)
        .bind(&password_hash)
        .bind(&config.admin_name)
        .execute(db)
        .await?;

        tracing::info!("Admin user seeded: {}", config.admin_email);
    }

    Ok(())
}
