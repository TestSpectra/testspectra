use chrono::Utc;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,      // user_id
    pub email: String,
    pub role: String,
    pub iat: i64,
}

#[derive(Clone)]
pub struct JwtService {
    secret: String,
}

impl JwtService {
    pub fn new(secret: String) -> Self {
        Self { secret }
    }

    pub fn create_token(&self, user_id: &str, email: &str, role: &str) -> Result<String, jsonwebtoken::errors::Error> {
        let now = Utc::now();
        let claims = Claims {
            sub: user_id.to_string(),
            email: email.to_string(),
            role: role.to_string(),
            iat: now.timestamp(),
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.secret.as_bytes()),
        )
    }

    pub fn verify_token(&self, token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
        // Disable expiration validation since we don't have exp field
        let mut validation = Validation::default();
        validation.required_spec_claims.remove("exp");
        validation.validate_exp = false;
        
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.secret.as_bytes()),
            &validation,
        )?;
        Ok(token_data.claims)
    }

    pub fn get_user_id_from_token(&self, token: &str) -> Result<String, jsonwebtoken::errors::Error> {
        let claims = self.verify_token(token)?;
        Ok(claims.sub)
    }
}

// Extractor for authenticated requests (optional - can be used with middleware layer)
// #[derive(Debug, Clone)]
// pub struct AuthUser(pub Claims);

// Note: For now, we use manual token extraction in handlers
// To use AuthUser extractor, would need to set up middleware layer

// Helper to extract token from header
pub fn extract_bearer_token(auth_header: Option<&str>) -> Option<String> {
    auth_header
        .and_then(|h| h.strip_prefix("Bearer "))
        .map(|s| s.to_string())
}
