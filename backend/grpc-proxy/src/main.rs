mod handlers;

use axum::{
    routing::{delete, get, post, put},
    Router,
};
use dotenv::dotenv;
use std::env;
use tower_http::cors::{Any, CorsLayer};
use tracing::info;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .init();

    let grpc_url = env::var("GRPC_SERVICE_URL").unwrap_or_else(|_| "http://localhost:50051".to_string());
    let proxy_addr = env::var("PROXY_ADDR").unwrap_or_else(|_| "0.0.0.0:3000".to_string());

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(handlers::health_check))
        .route("/api/auth/login", post(handlers::login))
        .route("/api/auth/refresh", post(handlers::refresh_token))
        .route("/api/users", get(handlers::list_users))
        .route("/api/users", post(handlers::create_user))
        .route("/api/users/:id", get(handlers::get_user))
        .route("/api/users/:id", put(handlers::update_user))
        .route("/api/users/:id", delete(handlers::delete_user))
        .route("/api/users/:id/status", put(handlers::update_user_status))
        .route("/api/users/:id/permissions/grant", post(handlers::grant_permissions))
        .route("/api/users/:id/permissions/revoke", post(handlers::revoke_permissions))
        .route("/api/users/me", get(handlers::get_current_user))
        .layer(cors)
        .with_state(grpc_url);

    let addr: std::net::SocketAddr = proxy_addr.parse()?;
    info!("🌐 gRPC Proxy listening on {}", addr);
    info!("📡 Forwarding to gRPC service at {}", env::var("GRPC_SERVICE_URL").unwrap_or_else(|_| "http://localhost:50051".to_string()));

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
