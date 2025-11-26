use crate::models::{User, UserSpecialPermission, UserWithPermissions};
use crate::permissions::get_base_permissions;
use anyhow::{anyhow, Result};
use sqlx::{PgPool, Row};
use uuid::Uuid;

pub struct UserRepository {
    pool: PgPool,
}

impl UserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create_user(
        &self,
        name: &str,
        email: &str,
        password_hash: &str,
        role: &str,
    ) -> Result<User> {
        let user = sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (name, email, password_hash, role, status)
            VALUES ($1, $2, $3, $4, 'active')
            RETURNING *
            "#,
        )
        .bind(name)
        .bind(email)
        .bind(password_hash)
        .bind(role)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to create user: {}", e))?;

        Ok(user)
    }

    pub async fn get_user_by_id(&self, user_id: &Uuid) -> Result<Option<User>> {
        let user = sqlx::query_as::<_, User>(
            r#"
            SELECT * FROM users WHERE id = $1
            "#,
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to get user: {}", e))?;

        Ok(user)
    }

    pub async fn get_user_by_email(&self, email: &str) -> Result<Option<User>> {
        let user = sqlx::query_as::<_, User>(
            r#"
            SELECT * FROM users WHERE email = $1
            "#,
        )
        .bind(email)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to get user by email: {}", e))?;

        Ok(user)
    }

    pub async fn get_user_with_permissions(
        &self,
        user_id: &Uuid,
    ) -> Result<Option<UserWithPermissions>> {
        let user = self.get_user_by_id(user_id).await?;

        match user {
            Some(u) => {
                let special_perms = self.get_user_special_permissions(user_id).await?;
                let base_perms = get_base_permissions(&u.role);

                Ok(Some(UserWithPermissions {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    status: u.status,
                    git_username: u.git_username,
                    git_email: u.git_email,
                    joined_date: u.joined_date,
                    last_active: u.last_active,
                    base_permissions: base_perms,
                    special_permissions: special_perms,
                }))
            }
            None => Ok(None),
        }
    }

    pub async fn list_users(
        &self,
        role_filter: Option<&str>,
        status_filter: Option<&str>,
        page: i32,
        page_size: i32,
    ) -> Result<(Vec<UserWithPermissions>, i64)> {
        let offset = (page - 1) * page_size;

        let mut query = String::from("SELECT * FROM users WHERE 1=1");
        let mut count_query = String::from("SELECT COUNT(*) FROM users WHERE 1=1");

        if let Some(role) = role_filter {
            query.push_str(&format!(" AND role = '{}'", role));
            count_query.push_str(&format!(" AND role = '{}'", role));
        }

        if let Some(status) = status_filter {
            query.push_str(&format!(" AND status = '{}'", status));
            count_query.push_str(&format!(" AND status = '{}'", status));
        }

        query.push_str(&format!(
            " ORDER BY created_at DESC LIMIT {} OFFSET {}",
            page_size, offset
        ));

        let users = sqlx::query_as::<_, User>(&query)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| anyhow!("Failed to list users: {}", e))?;

        let total: i64 = sqlx::query(&count_query)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| anyhow!("Failed to count users: {}", e))?
            .get(0);

        let mut users_with_perms = Vec::new();
        for user in users {
            let special_perms = self.get_user_special_permissions(&user.id).await?;
            let base_perms = get_base_permissions(&user.role);

            users_with_perms.push(UserWithPermissions {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                git_username: user.git_username,
                git_email: user.git_email,
                joined_date: user.joined_date,
                last_active: user.last_active,
                base_permissions: base_perms,
                special_permissions: special_perms,
            });
        }

        Ok((users_with_perms, total))
    }

    pub async fn update_user(
        &self,
        user_id: &Uuid,
        name: Option<&str>,
        email: Option<&str>,
        password_hash: Option<&str>,
        role: Option<&str>,
    ) -> Result<User> {
        let mut query = String::from("UPDATE users SET updated_at = NOW()");
        let mut params: Vec<String> = Vec::new();
        let mut param_count = 1;

        if let Some(n) = name {
            query.push_str(&format!(", name = ${}", param_count));
            params.push(n.to_string());
            param_count += 1;
        }

        if let Some(e) = email {
            query.push_str(&format!(", email = ${}", param_count));
            params.push(e.to_string());
            param_count += 1;
        }

        if let Some(p) = password_hash {
            query.push_str(&format!(", password_hash = ${}", param_count));
            params.push(p.to_string());
            param_count += 1;
        }

        if let Some(r) = role {
            query.push_str(&format!(", role = ${}", param_count));
            params.push(r.to_string());
            param_count += 1;
        }

        query.push_str(&format!(" WHERE id = ${} RETURNING *", param_count));

        let mut q = sqlx::query_as::<_, User>(&query);
        for param in &params {
            q = q.bind(param);
        }
        q = q.bind(user_id);

        let user = q
            .fetch_one(&self.pool)
            .await
            .map_err(|e| anyhow!("Failed to update user: {}", e))?;

        Ok(user)
    }

    pub async fn update_user_status(&self, user_id: &Uuid, status: &str) -> Result<User> {
        let user = sqlx::query_as::<_, User>(
            r#"
            UPDATE users SET status = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
            "#,
        )
        .bind(status)
        .bind(user_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to update user status: {}", e))?;

        Ok(user)
    }

    pub async fn update_last_active(&self, user_id: &Uuid) -> Result<()> {
        sqlx::query(
            r#"
            UPDATE users SET last_active = NOW()
            WHERE id = $1
            "#,
        )
        .bind(user_id)
        .execute(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to update last active: {}", e))?;

        Ok(())
    }

    pub async fn delete_user(&self, user_id: &Uuid) -> Result<()> {
        sqlx::query(
            r#"
            DELETE FROM users WHERE id = $1
            "#,
        )
        .bind(user_id)
        .execute(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to delete user: {}", e))?;

        Ok(())
    }

    pub async fn get_user_special_permissions(&self, user_id: &Uuid) -> Result<Vec<String>> {
        let permissions = sqlx::query_as::<_, UserSpecialPermission>(
            r#"
            SELECT * FROM user_special_permissions WHERE user_id = $1
            "#,
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| anyhow!("Failed to get special permissions: {}", e))?;

        Ok(permissions.into_iter().map(|p| p.permission).collect())
    }

    pub async fn grant_special_permissions(
        &self,
        user_id: &Uuid,
        permissions: Vec<String>,
        granted_by: &Uuid,
    ) -> Result<()> {
        for permission in permissions {
            sqlx::query(
                r#"
                INSERT INTO user_special_permissions (user_id, permission, granted_by)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id, permission) DO NOTHING
                "#,
            )
            .bind(user_id)
            .bind(&permission)
            .bind(granted_by)
            .execute(&self.pool)
            .await
            .map_err(|e| anyhow!("Failed to grant special permission: {}", e))?;
        }

        Ok(())
    }

    pub async fn revoke_special_permissions(
        &self,
        user_id: &Uuid,
        permissions: Vec<String>,
    ) -> Result<()> {
        for permission in permissions {
            sqlx::query(
                r#"
                DELETE FROM user_special_permissions
                WHERE user_id = $1 AND permission = $2
                "#,
            )
            .bind(user_id)
            .bind(&permission)
            .execute(&self.pool)
            .await
            .map_err(|e| anyhow!("Failed to revoke special permission: {}", e))?;
        }

        Ok(())
    }
}
