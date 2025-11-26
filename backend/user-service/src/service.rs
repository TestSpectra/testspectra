use crate::auth::{hash_password, verify_password, JwtService};
use crate::db::UserRepository;
use crate::permissions::{
    permission_to_proto, proto_to_permission, proto_to_role, role_to_proto, PERMISSION_MANAGE_USERS,
};
use proto::UpdateMyProfileRequest;
use anyhow::Result;
use tonic::{Request, Response, Status};
use uuid::Uuid;

pub mod proto {
    tonic::include_proto!("user_service");
}

use proto::{
    user_service_server::UserService, CreateUserRequest, DeleteUserRequest, DeleteUserResponse,
    GetCurrentUserRequest, GetUserRequest, GrantSpecialPermissionsRequest, ListUsersRequest,
    ListUsersResponse, LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse,
    RevokeSpecialPermissionsRequest, UpdateUserRequest, UpdateUserStatusRequest, User,
    UserResponse,
};

pub struct UserServiceImpl {
    repo: UserRepository,
    jwt_service: JwtService,
}

impl UserServiceImpl {
    pub fn new(repo: UserRepository, jwt_service: JwtService) -> Self {
        Self { repo, jwt_service }
    }

    fn verify_token(&self, token: &str) -> Result<crate::models::Claims, Status> {
        self.jwt_service
            .verify_token(token)
            .map_err(|e| Status::unauthenticated(format!("Invalid token: {}", e)))
    }

    async fn check_permission(&self, token: &str, required_permission: &str) -> Result<Uuid, Status> {
        let _claims = self.verify_token(token)?;
        let user_id = Uuid::parse_str(&_claims.sub)
            .map_err(|_| Status::internal("Invalid user ID in token"))?;

        let user = self
            .repo
            .get_user_with_permissions(&user_id)
            .await
            .map_err(|e| Status::internal(format!("Failed to get user: {}", e)))?
            .ok_or_else(|| Status::not_found("User not found"))?;

        let has_permission = user.base_permissions.contains(&required_permission.to_string())
            || user.special_permissions.contains(&required_permission.to_string());

        if !has_permission {
            return Err(Status::permission_denied("Insufficient permissions"));
        }

        Ok(user_id)
    }

    fn user_to_proto(&self, user: &crate::models::UserWithPermissions) -> User {
        User {
            id: user.id.to_string(),
            name: user.name.clone(),
            email: user.email.clone(),
            role: role_to_proto(&user.role),
            status: if user.status == "active" { 1 } else { 2 },
            base_permissions: user
                .base_permissions
                .iter()
                .map(|p| permission_to_proto(p))
                .collect(),
            special_permissions: user
                .special_permissions
                .iter()
                .map(|p| permission_to_proto(p))
                .collect(),
            joined_date: user.joined_date.to_rfc3339(),
            last_active: user.last_active.to_rfc3339(),
            git_username: user.git_username.clone(),
            git_email: user.git_email.clone(),
        }
    }
}

#[tonic::async_trait]
impl UserService for UserServiceImpl {
    async fn update_my_profile(
        &self,
        request: Request<UpdateMyProfileRequest>,
    ) -> Result<Response<UserResponse>, Status> {
        let req = request.into_inner();
        let claims = self.verify_token(&req.token)?;
        
        // Extract user ID from token
        let user_id = Uuid::parse_str(&claims.sub)
            .map_err(|_| Status::internal("Invalid user ID in token"))?;
        
        // Get current user data
        let user = self
            .repo
            .get_user_with_permissions(&user_id)
            .await
            .map_err(|e| Status::internal(format!("Failed to get user: {}", e)))?;
            
        if user.is_none() {
            return Err(Status::not_found("User not found"));
        }
        
        let mut user = user.unwrap();
        
        // Update only the name field
        if let Some(name) = req.name {
            user.name = name;
        }
        
        // Save the updated user
        let _updated_user = self
            .repo
            .update_user(&user_id, Some(&user.name), None, None, None)
            .await
            .map_err(|e| Status::internal(format!("Failed to update user: {}", e)))?;
        
        // Get the updated user with permissions
        let user_with_perms = self
            .repo
            .get_user_with_permissions(&user_id)
            .await
            .map_err(|e| Status::internal(format!("Failed to get updated user: {}", e)))?;
            
        if user_with_perms.is_none() {
            return Err(Status::internal("User not found after update"));
        }
        
        Ok(Response::new(UserResponse {
            user: Some(self.user_to_proto(&user_with_perms.unwrap())),
        }))
    }
    
    async fn login(
        &self,
        request: Request<LoginRequest>,
    ) -> Result<Response<LoginResponse>, Status> {
        let req = request.into_inner();

        let user = self
            .repo
            .get_user_by_email(&req.email)
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?
            .ok_or_else(|| Status::unauthenticated("Invalid credentials"))?;

        if user.status != "active" {
            return Err(Status::permission_denied("User account is inactive"));
        }

        let valid = verify_password(&req.password, &user.password_hash)
            .map_err(|e| Status::internal(format!("Password verification error: {}", e)))?;

        if !valid {
            return Err(Status::unauthenticated("Invalid credentials"));
        }

        let access_token = self
            .jwt_service
            .generate_access_token(&user.id.to_string(), &user.email, &user.role)
            .map_err(|e| Status::internal(format!("Token generation error: {}", e)))?;

        let refresh_token = self
            .jwt_service
            .generate_refresh_token(&user.id.to_string(), &user.email, &user.role)
            .map_err(|e| Status::internal(format!("Token generation error: {}", e)))?;

        self.repo
            .update_last_active(&user.id)
            .await
            .map_err(|e| Status::internal(format!("Failed to update last active: {}", e)))?;

        let user_with_perms = self
            .repo
            .get_user_with_permissions(&user.id)
            .await
            .map_err(|e| Status::internal(format!("Failed to get user permissions: {}", e)))?
            .ok_or_else(|| Status::internal("User not found after login"))?;

        Ok(Response::new(LoginResponse {
            access_token,
            refresh_token,
            user: Some(self.user_to_proto(&user_with_perms)),
        }))
    }

    async fn refresh_token(
        &self,
        request: Request<RefreshTokenRequest>,
    ) -> Result<Response<RefreshTokenResponse>, Status> {
        let req = request.into_inner();
        let _claims = self.verify_token(&req.refresh_token)?;

        let access_token = self
            .jwt_service
            .generate_access_token(&_claims.sub, &_claims.email, &_claims.role)
            .map_err(|e| Status::internal(format!("Token generation error: {}", e)))?;

        let refresh_token = self
            .jwt_service
            .generate_refresh_token(&_claims.sub, &_claims.email, &_claims.role)
            .map_err(|e| Status::internal(format!("Token generation error: {}", e)))?;

        Ok(Response::new(RefreshTokenResponse {
            access_token,
            refresh_token,
        }))
    }

    async fn get_current_user(
        &self,
        request: Request<GetCurrentUserRequest>,
    ) -> Result<Response<UserResponse>, Status> {
        let req = request.into_inner();
        let _claims = self.verify_token(&req.token)?;

        let user_id = Uuid::parse_str(&_claims.sub)
            .map_err(|_| Status::internal("Invalid user ID in token"))?;

        let user = self
            .repo
            .get_user_with_permissions(&user_id)
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?
            .ok_or_else(|| Status::not_found("User not found"))?;

        Ok(Response::new(UserResponse {
            user: Some(self.user_to_proto(&user)),
        }))
    }

    async fn list_users(
        &self,
        request: Request<ListUsersRequest>,
    ) -> Result<Response<ListUsersResponse>, Status> {
        let req = request.into_inner();
        // Verify token but don't check for specific permission
        // All authenticated users can view the user list
        let _claims = self.verify_token(&req.token)?;

        let role_filter = req.role_filter.as_deref();
        let status_filter = req.status_filter.as_deref();

        let (users, total) = self
            .repo
            .list_users(
                role_filter,
                status_filter,
                req.page,
                req.page_size,
            )
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?;

        let proto_users = users.iter().map(|u| self.user_to_proto(u)).collect();

        Ok(Response::new(ListUsersResponse {
            users: proto_users,
            total: total as i32,
            page: req.page,
            page_size: req.page_size,
        }))
    }

    async fn get_user(
        &self,
        request: Request<GetUserRequest>,
    ) -> Result<Response<UserResponse>, Status> {
        let req = request.into_inner();
        self.verify_token(&req.token)?;

        let user_id = Uuid::parse_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("Invalid user ID"))?;

        let user = self
            .repo
            .get_user_with_permissions(&user_id)
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?
            .ok_or_else(|| Status::not_found("User not found"))?;

        Ok(Response::new(UserResponse {
            user: Some(self.user_to_proto(&user)),
        }))
    }

    async fn create_user(
        &self,
        request: Request<CreateUserRequest>,
    ) -> Result<Response<UserResponse>, Status> {
        let req = request.into_inner();
        let granted_by = self.check_permission(&req.token, PERMISSION_MANAGE_USERS).await?;

        let role = proto_to_role(req.role)
            .ok_or_else(|| Status::invalid_argument("Invalid role"))?;

        let password_hash = hash_password(&req.password)
            .map_err(|e| Status::internal(format!("Password hashing error: {}", e)))?;

        let user = self
            .repo
            .create_user(&req.name, &req.email, &password_hash, &role)
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?;

        // Handle special permissions
        let mut permissions_to_grant = Vec::new();
        for perm_enum in req.special_permissions {
            if let Some(perm_str) = proto_to_permission(perm_enum) {
                permissions_to_grant.push(perm_str);
            }
        }

        if !permissions_to_grant.is_empty() {
            self.repo
                .grant_special_permissions(&user.id, permissions_to_grant, &granted_by)
                .await
                .map_err(|e| Status::internal(format!("Failed to grant permissions: {}", e)))?;
        }

        let user_with_perms = self
            .repo
            .get_user_with_permissions(&user.id)
            .await
            .map_err(|e| Status::internal(format!("Failed to get user permissions: {}", e)))?
            .ok_or_else(|| Status::internal("User not found after creation"))?;

        Ok(Response::new(UserResponse {
            user: Some(self.user_to_proto(&user_with_perms)),
        }))
    }

    async fn update_user(
        &self,
        request: Request<UpdateUserRequest>,
    ) -> Result<Response<UserResponse>, Status> {
        let req = request.into_inner();
        let granted_by = self.check_permission(&req.token, PERMISSION_MANAGE_USERS).await?;

        let user_id = Uuid::parse_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("Invalid user ID"))?;

        let role = req.role.and_then(proto_to_role);
        let password_hash = if let Some(pwd) = req.password {
            Some(
                hash_password(&pwd)
                    .map_err(|e| Status::internal(format!("Password hashing error: {}", e)))?,
            )
        } else {
            None
        };

        let user = self
            .repo
            .update_user(
                &user_id,
                req.name.as_deref(),
                req.email.as_deref(),
                password_hash.as_deref(),
                role.as_deref(),
            )
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?;

        // Update special permissions (replace logic)
        // 1. Revoke all existing
        let current_perms = self
            .repo
            .get_user_special_permissions(&user_id)
            .await
            .map_err(|e| Status::internal(format!("Failed to get perms: {}", e)))?;

        if !current_perms.is_empty() {
            self.repo
                .revoke_special_permissions(&user_id, current_perms)
                .await
                .map_err(|e| Status::internal(format!("Failed to revoke perms: {}", e)))?;
        }

        // 2. Grant new ones
        let mut permissions_to_grant = Vec::new();
        for perm_enum in req.special_permissions {
            if let Some(perm_str) = proto_to_permission(perm_enum) {
                permissions_to_grant.push(perm_str);
            }
        }

        if !permissions_to_grant.is_empty() {
            self.repo
                .grant_special_permissions(&user.id, permissions_to_grant, &granted_by)
                .await
                .map_err(|e| Status::internal(format!("Failed to grant permissions: {}", e)))?;
        }

        let user_with_perms = self
            .repo
            .get_user_with_permissions(&user.id)
            .await
            .map_err(|e| Status::internal(format!("Failed to get user permissions: {}", e)))?
            .ok_or_else(|| Status::internal("User not found after update"))?;

        Ok(Response::new(UserResponse {
            user: Some(self.user_to_proto(&user_with_perms)),
        }))
    }

    async fn delete_user(
        &self,
        request: Request<DeleteUserRequest>,
    ) -> Result<Response<DeleteUserResponse>, Status> {
        let req = request.into_inner();
        self.check_permission(&req.token, PERMISSION_MANAGE_USERS).await?;

        let user_id = Uuid::parse_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("Invalid user ID"))?;

        self.repo
            .delete_user(&user_id)
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?;

        Ok(Response::new(DeleteUserResponse {
            success: true,
            message: "User deleted successfully".to_string(),
        }))
    }

    async fn update_user_status(
        &self,
        request: Request<UpdateUserStatusRequest>,
    ) -> Result<Response<UserResponse>, Status> {
        let req = request.into_inner();
        self.check_permission(&req.token, PERMISSION_MANAGE_USERS).await?;

        let user_id = Uuid::parse_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("Invalid user ID"))?;

        let status = if req.status == 1 { "active" } else { "inactive" };

        let user = self
            .repo
            .update_user_status(&user_id, status)
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?;

        let user_with_perms = self
            .repo
            .get_user_with_permissions(&user.id)
            .await
            .map_err(|e| Status::internal(format!("Failed to get user permissions: {}", e)))?
            .ok_or_else(|| Status::internal("User not found after status update"))?;

        Ok(Response::new(UserResponse {
            user: Some(self.user_to_proto(&user_with_perms)),
        }))
    }

    async fn grant_special_permissions(
        &self,
        request: Request<GrantSpecialPermissionsRequest>,
    ) -> Result<Response<UserResponse>, Status> {
        let req = request.into_inner();
        let granter_id = self.check_permission(&req.token, PERMISSION_MANAGE_USERS).await?;

        let user_id = Uuid::parse_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("Invalid user ID"))?;

        let permissions: Vec<String> = req
            .permissions
            .iter()
            .filter_map(|p| proto_to_permission(*p))
            .collect();

        self.repo
            .grant_special_permissions(&user_id, permissions, &granter_id)
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?;

        let user = self
            .repo
            .get_user_with_permissions(&user_id)
            .await
            .map_err(|e| Status::internal(format!("Failed to get user permissions: {}", e)))?
            .ok_or_else(|| Status::not_found("User not found"))?;

        Ok(Response::new(UserResponse {
            user: Some(self.user_to_proto(&user)),
        }))
    }

    async fn revoke_special_permissions(
        &self,
        request: Request<RevokeSpecialPermissionsRequest>,
    ) -> Result<Response<UserResponse>, Status> {
        let req = request.into_inner();
        self.check_permission(&req.token, PERMISSION_MANAGE_USERS).await?;

        let user_id = Uuid::parse_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("Invalid user ID"))?;

        let permissions: Vec<String> = req
            .permissions
            .iter()
            .filter_map(|p| proto_to_permission(*p))
            .collect();

        self.repo
            .revoke_special_permissions(&user_id, permissions)
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?;

        let user = self
            .repo
            .get_user_with_permissions(&user_id)
            .await
            .map_err(|e| Status::internal(format!("Failed to get user permissions: {}", e)))?
            .ok_or_else(|| Status::not_found("User not found"))?;

        Ok(Response::new(UserResponse {
            user: Some(self.user_to_proto(&user)),
        }))
    }
}
