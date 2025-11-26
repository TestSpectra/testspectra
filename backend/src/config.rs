use std::env;

#[derive(Clone)]
pub struct Config {
    pub database_url: String,
    pub server_addr: String,
    pub jwt_secret: String,
    pub admin_email: String,
    pub admin_password: String,
    pub admin_name: String,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            database_url: env::var("DATABASE_URL")
                .expect("DATABASE_URL must be set"),
            server_addr: env::var("SERVER_ADDR")
                .unwrap_or_else(|_| "0.0.0.0:3000".to_string()),
            jwt_secret: env::var("JWT_SECRET")
                .expect("JWT_SECRET must be set"),
            admin_email: env::var("ADMIN_EMAIL")
                .unwrap_or_else(|_| "admin@testspectra.com".to_string()),
            admin_password: env::var("ADMIN_PASSWORD")
                .unwrap_or_else(|_| "Admin123!".to_string()),
            admin_name: env::var("ADMIN_NAME")
                .unwrap_or_else(|_| "Admin User".to_string()),
        }
    }
}
