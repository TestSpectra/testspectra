mod auth;
mod db;
mod models;
mod permissions;
mod service;

use crate::auth::{hash_password, JwtService};
use crate::db::UserRepository;
use crate::permissions::ROLE_ADMIN;
use crate::service::proto::user_service_server::UserServiceServer;
use crate::service::UserServiceImpl;
use anyhow::Result;
use dotenv::dotenv;
use sqlx::postgres::PgPoolOptions;
use std::env;
use tonic::transport::Server;
use tracing::{info, warn};

async fn seed_admin_user(repo: &UserRepository) -> Result<()> {
    let admin_email = env::var("ADMIN_EMAIL").unwrap_or_else(|_| "admin@testspectra.com".to_string());
    let admin_password = env::var("ADMIN_PASSWORD").expect("ADMIN_PASSWORD must be set in .env");
    let admin_name = env::var("ADMIN_NAME").unwrap_or_else(|_| "Admin User".to_string());

    match repo.get_user_by_email(&admin_email).await? {
        Some(user) => {
            info!("Admin user already exists: {}", user.email);
        }
        None => {
            let password_hash = hash_password(&admin_password)?;
            let admin = repo
                .create_user(&admin_name, &admin_email, &password_hash, ROLE_ADMIN)
                .await?;
            info!("Admin user created: {} ({})", admin.name, admin.email);
        }
    }

    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .init();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env");
    let jwt_secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set in .env");
    let server_addr = env::var("SERVER_ADDR").unwrap_or_else(|_| "0.0.0.0:50051".to_string());

    info!("Connecting to database...");
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await?;

    info!("Running database migrations...");
    sqlx::migrate!("./migrations").run(&pool).await?;

    let repo = UserRepository::new(pool);
    let jwt_service = JwtService::new(&jwt_secret);

    info!("Seeding admin user...");
    if let Err(e) = seed_admin_user(&repo).await {
        warn!("Failed to seed admin user: {}", e);
    }

    let service = UserServiceImpl::new(repo, jwt_service);

    let addr = server_addr.parse()?;
    info!("🚀 User Service listening on {}", addr);

    Server::builder()
        .add_service(UserServiceServer::new(service))
        .serve(addr)
        .await?;

    Ok(())
}
