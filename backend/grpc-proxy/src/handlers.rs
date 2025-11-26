use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tonic::Request;

pub mod proto {
    tonic::include_proto!("user_service");
}

use proto::{
    user_service_client::UserServiceClient, CreateUserRequest, DeleteUserRequest,
    GetCurrentUserRequest, GetUserRequest, GrantSpecialPermissionsRequest, ListUsersRequest,
    LoginRequest, RefreshTokenRequest, RevokeSpecialPermissionsRequest, UpdateUserRequest,
    UpdateUserStatusRequest, UpdateMyProfileRequest,
};

#[derive(Debug, Deserialize)]
pub struct LoginPayload {
    email: String,
    password: String,
}

#[derive(Debug, Deserialize)]
pub struct RefreshTokenPayload {
    #[serde(rename = "refreshToken")]
    refresh_token: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserPayload {
    name: String,
    email: String,
    password: String,
    role: String,
    #[serde(rename = "specialPermissions")]
    special_permissions: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserPayload {
    name: Option<String>,
    email: Option<String>,
    password: Option<String>,
    role: Option<String>,
    #[serde(rename = "specialPermissions")]
    special_permissions: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateStatusPayload {
    status: String,
}

#[derive(Debug, Deserialize)]
pub struct PermissionsPayload {
    permissions: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct ListUsersQuery {
    #[serde(rename = "roleFilter")]
    role_filter: Option<String>,
    #[serde(rename = "statusFilter")]
    status_filter: Option<String>,
    page: Option<i32>,
    #[serde(rename = "pageSize")]
    page_size: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    error: String,
}

fn extract_token(headers: &axum::http::HeaderMap) -> Result<String, StatusCode> {
    headers
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .map(|s| s.to_string())
        .ok_or(StatusCode::UNAUTHORIZED)
}

fn role_to_proto(role: &str) -> i32 {
    match role {
        "admin" => 1,
        "qa_lead" => 2,
        "qa_engineer" => 3,
        "developer" => 4,
        "product_manager" => 5,
        "ui_ux_designer" => 6,
        "viewer" => 7,
        _ => 0,
    }
}

fn proto_to_role(proto: i32) -> String {
    match proto {
        1 => "admin".to_string(),
        2 => "qa_lead".to_string(),
        3 => "qa_engineer".to_string(),
        4 => "developer".to_string(),
        5 => "product_manager".to_string(),
        6 => "ui_ux_designer".to_string(),
        7 => "viewer".to_string(),
        _ => "viewer".to_string(),
    }
}

fn permission_to_proto(permission: &str) -> i32 {
    match permission {
        "manage_users" => 1,
        "manage_qa_team" => 2,
        "full_test_case_access" => 3,
        "create_edit_test_cases" => 4,
        "execute_all_tests" => 5,
        "execute_automated_tests" => 6,
        "record_test_results" => 7,
        "manage_configurations" => 8,
        "manage_test_configurations" => 9,
        "review_approve_test_cases" => 10,
        "export_reports" => 11,
        "manage_integrations" => 12,
        _ => 0,
    }
}

fn proto_to_permission(proto: i32) -> String {
    match proto {
        1 => "manage_users".to_string(),
        2 => "manage_qa_team".to_string(),
        3 => "full_test_case_access".to_string(),
        4 => "create_edit_test_cases".to_string(),
        5 => "execute_all_tests".to_string(),
        6 => "execute_automated_tests".to_string(),
        7 => "record_test_results".to_string(),
        8 => "manage_configurations".to_string(),
        9 => "manage_test_configurations".to_string(),
        10 => "review_approve_test_cases".to_string(),
        11 => "export_reports".to_string(),
        12 => "manage_integrations".to_string(),
        _ => "unknown".to_string(),
    }
}

fn user_to_json(user: &proto::User) -> Value {
    json!({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": proto_to_role(user.role),
        "status": if user.status == 1 { "active" } else { "inactive" },
        "basePermissions": user.base_permissions.iter().map(|p| proto_to_permission(*p)).collect::<Vec<_>>(),
        "specialPermissions": user.special_permissions.iter().map(|p| proto_to_permission(*p)).collect::<Vec<_>>(),
        "joinedDate": user.joined_date,
        "lastActive": user.last_active,
        "gitUsername": user.git_username,
        "gitEmail": user.git_email,
    })
}

pub async fn health_check() -> Json<Value> {
    Json(json!({ "status": "ok" }))
}

pub async fn login(
    State(grpc_url): State<String>,
    Json(payload): Json<LoginPayload>,
) -> Result<Json<Value>, (StatusCode, Json<ErrorResponse>)> {
    let mut client = UserServiceClient::connect(grpc_url)
        .await
        .map_err(|e| {
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(ErrorResponse {
                    error: format!("Failed to connect to service: {}", e),
                }),
            )
        })?;

    let request = Request::new(LoginRequest {
        email: payload.email,
        password: payload.password,
    });

    let response = client.login(request).await.map_err(|e| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: format!("Login failed: {}", e.message()),
            }),
        )
    })?;

    let login_response = response.into_inner();
    let user = login_response.user.unwrap();

    Ok(Json(json!({
        "accessToken": login_response.access_token,
        "refreshToken": login_response.refresh_token,
        "user": user_to_json(&user),
    })))
}

pub async fn refresh_token(
    State(grpc_url): State<String>,
    Json(payload): Json<RefreshTokenPayload>,
) -> Result<Json<Value>, (StatusCode, Json<ErrorResponse>)> {
    let mut client = UserServiceClient::connect(grpc_url)
        .await
        .map_err(|e| {
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(ErrorResponse {
                    error: format!("Failed to connect to service: {}", e),
                }),
            )
        })?;

    let request = Request::new(RefreshTokenRequest {
        refresh_token: payload.refresh_token,
    });

    let response = client.refresh_token(request).await.map_err(|e| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: format!("Token refresh failed: {}", e.message()),
            }),
        )
    })?;

    let refresh_response = response.into_inner();

    Ok(Json(json!({
        "accessToken": refresh_response.access_token,
        "refreshToken": refresh_response.refresh_token,
    })))
}

pub async fn get_current_user(
    State(grpc_url): State<String>,
    headers: axum::http::HeaderMap,
) -> Result<Json<Value>, (StatusCode, Json<ErrorResponse>)> {
    let token = extract_token(&headers).map_err(|_| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Missing or invalid authorization header".to_string(),
            }),
        )
    })?;

    let mut client = UserServiceClient::connect(grpc_url)
        .await
        .map_err(|e| {
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(ErrorResponse {
                    error: format!("Failed to connect to service: {}", e),
                }),
            )
        })?;

    let request = Request::new(GetCurrentUserRequest { token });

    let response = client.get_current_user(request).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Failed to get user: {}", e.message()),
            }),
        )
    })?;

    let user = response.into_inner().user.unwrap();

    Ok(Json(user_to_json(&user)))
}

pub async fn list_users(
    State(grpc_url): State<String>,
    headers: axum::http::HeaderMap,
    Query(query): Query<ListUsersQuery>,
) -> Result<Json<Value>, (StatusCode, Json<ErrorResponse>)> {
    let token = extract_token(&headers).map_err(|_| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Missing or invalid authorization header".to_string(),
            }),
        )
    })?;

    let mut client = UserServiceClient::connect(grpc_url)
        .await
        .map_err(|e| {
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(ErrorResponse {
                    error: format!("Failed to connect to service: {}", e),
                }),
            )
        })?;

    let request = Request::new(ListUsersRequest {
        token,
        role_filter: query.role_filter,
        status_filter: query.status_filter,
        page: query.page.unwrap_or(1),
        page_size: query.page_size.unwrap_or(10),
    });

    let response = client.list_users(request).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Failed to list users: {}", e.message()),
            }),
        )
    })?;

    let list_response = response.into_inner();
    let users: Vec<Value> = list_response
        .users
        .iter()
        .map(|u| user_to_json(u))
        .collect();

    Ok(Json(json!({
        "users": users,
        "total": list_response.total,
        "page": list_response.page,
        "pageSize": list_response.page_size,
    })))
}

pub async fn create_user(
    State(grpc_url): State<String>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<CreateUserPayload>,
) -> Result<Json<Value>, (StatusCode, Json<ErrorResponse>)> {
    let token = extract_token(&headers).map_err(|_| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Missing or invalid authorization header".to_string(),
            }),
        )
    })?;

    let mut client = UserServiceClient::connect(grpc_url)
        .await
        .map_err(|e| {
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(ErrorResponse {
                    error: format!("Failed to connect to service: {}", e),
                }),
            )
        })?;

    let request = Request::new(CreateUserRequest {
        token,
        name: payload.name,
        email: payload.email,
        password: payload.password,
        role: role_to_proto(&payload.role),
        special_permissions: payload
            .special_permissions
            .unwrap_or_default()
            .iter()
            .map(|p| permission_to_proto(p))
            .collect(),
    });

    let response = client.create_user(request).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Failed to create user: {}", e.message()),
            }),
        )
    })?;

    let user = response.into_inner().user.unwrap();

    Ok(Json(user_to_json(&user)))
}

pub async fn get_user(
    State(grpc_url): State<String>,
    headers: axum::http::HeaderMap,
    Path(user_id): Path<String>,
) -> Result<Json<Value>, (StatusCode, Json<ErrorResponse>)> {
    let token = extract_token(&headers).map_err(|_| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Missing or invalid authorization header".to_string(),
            }),
        )
    })?;

    let mut client = UserServiceClient::connect(grpc_url)
        .await
        .map_err(|e| {
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(ErrorResponse {
                    error: format!("Failed to connect to service: {}", e),
                }),
            )
        })?;

    let request = Request::new(GetUserRequest { token, user_id });

    let response = client.get_user(request).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Failed to get user: {}", e.message()),
            }),
        )
    })?;

    let user = response.into_inner().user.unwrap();

    Ok(Json(user_to_json(&user)))
}

pub async fn update_user(
    State(grpc_url): State<String>,
    headers: axum::http::HeaderMap,
    Path(user_id): Path<String>,
    Json(payload): Json<UpdateUserPayload>,
) -> Result<Json<Value>, (StatusCode, Json<ErrorResponse>)> {
    let token = extract_token(&headers).map_err(|_| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Missing or invalid authorization header".to_string(),
            }),
        )
    })?;

    let mut client = UserServiceClient::connect(grpc_url)
        .await
        .map_err(|e| {
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(ErrorResponse {
                    error: format!("Failed to connect to service: {}", e),
                }),
            )
        })?;

    let request = Request::new(UpdateUserRequest {
        token,
        user_id,
        name: payload.name,
        email: payload.email,
        password: payload.password,
        role: payload.role.map(|r| role_to_proto(&r)),
        special_permissions: payload
            .special_permissions
            .map(|p| p.iter().map(|s| permission_to_proto(s)).collect())
            .unwrap_or_default(),
    });

    let response = client.update_user(request).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Failed to update user: {}", e.message()),
            }),
        )
    })?;

    let user = response.into_inner().user.unwrap();

    Ok(Json(user_to_json(&user)))
}

pub async fn delete_user(
    State(grpc_url): State<String>,
    headers: axum::http::HeaderMap,
    Path(user_id): Path<String>,
) -> Result<Json<Value>, (StatusCode, Json<ErrorResponse>)> {
    let token = extract_token(&headers).map_err(|_| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Missing or invalid authorization header".to_string(),
            }),
        )
    })?;

    let mut client = UserServiceClient::connect(grpc_url)
        .await
        .map_err(|e| {
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(ErrorResponse {
                    error: format!("Failed to connect to service: {}", e),
                }),
            )
        })?;

    let request = Request::new(DeleteUserRequest { token, user_id });

    let response = client.delete_user(request).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Failed to delete user: {}", e.message()),
            }),
        )
    })?;

    let delete_response = response.into_inner();

    Ok(Json(json!({
        "success": delete_response.success,
        "message": delete_response.message,
    })))
}

pub async fn update_user_status(
    State(grpc_url): State<String>,
    headers: axum::http::HeaderMap,
    Path(user_id): Path<String>,
    Json(payload): Json<UpdateStatusPayload>,
) -> Result<Json<Value>, (StatusCode, Json<ErrorResponse>)> {
    let token = extract_token(&headers).map_err(|_| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Missing or invalid authorization header".to_string(),
            }),
        )
    })?;

    let mut client = UserServiceClient::connect(grpc_url)
        .await
        .map_err(|e| {
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(ErrorResponse {
                    error: format!("Failed to connect to service: {}", e),
                }),
            )
        })?;

    let status = if payload.status == "active" { 1 } else { 2 };

    let request = Request::new(UpdateUserStatusRequest {
        token,
        user_id,
        status,
    });

    let response = client.update_user_status(request).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Failed to update user status: {}", e.message()),
            }),
        )
    })?;

    let user = response.into_inner().user.unwrap();

    Ok(Json(user_to_json(&user)))
}

pub async fn grant_permissions(
    State(grpc_url): State<String>,
    headers: axum::http::HeaderMap,
    Path(user_id): Path<String>,
    Json(payload): Json<PermissionsPayload>,
) -> Result<Json<Value>, (StatusCode, Json<ErrorResponse>)> {
    let token = extract_token(&headers).map_err(|_| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Missing or invalid authorization header".to_string(),
            }),
        )
    })?;

    let mut client = UserServiceClient::connect(grpc_url)
        .await
        .map_err(|e| {
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(ErrorResponse {
                    error: format!("Failed to connect to service: {}", e),
                }),
            )
        })?;

    let permissions: Vec<i32> = payload
        .permissions
        .iter()
        .map(|p| permission_to_proto(p))
        .collect();

    let request = Request::new(GrantSpecialPermissionsRequest {
        token,
        user_id,
        permissions,
    });

    let response = client.grant_special_permissions(request).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Failed to grant permissions: {}", e.message()),
            }),
        )
    })?;

    let user = response.into_inner().user.unwrap();

    Ok(Json(user_to_json(&user)))
}

pub async fn revoke_permissions(
    State(grpc_url): State<String>,
    headers: axum::http::HeaderMap,
    Path(user_id): Path<String>,
    Json(payload): Json<PermissionsPayload>,
) -> Result<Json<Value>, (StatusCode, Json<ErrorResponse>)> {
    let token = extract_token(&headers).map_err(|_| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Missing or invalid authorization header".to_string(),
            }),
        )
    })?;

    let mut client = UserServiceClient::connect(grpc_url)
        .await
        .map_err(|e| {
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(ErrorResponse {
                    error: format!("Failed to connect to service: {}", e),
                }),
            )
        })?;

    let permissions: Vec<i32> = payload
        .permissions
        .iter()
        .map(|p| permission_to_proto(p))
        .collect();

    let request = Request::new(RevokeSpecialPermissionsRequest {
        token,
        user_id,
        permissions,
    });

    let response = client
        .revoke_special_permissions(request)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: format!("Failed to revoke permissions: {}", e.message()),
                }),
            )
        })?;

    let user = response.into_inner().user.unwrap();

    Ok(Json(user_to_json(&user)))
}

#[derive(Debug, Deserialize)]
pub struct UpdateMyProfilePayload {
    name: Option<String>,
}

pub async fn update_my_profile(
    State(grpc_url): State<String>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<UpdateMyProfilePayload>,
) -> Result<Json<Value>, (StatusCode, Json<ErrorResponse>)> {
    let token = extract_token(&headers).map_err(|_| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Missing or invalid authorization header".to_string(),
            }),
        )
    })?;

    let mut client = UserServiceClient::connect(grpc_url)
        .await
        .map_err(|e| {
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(ErrorResponse {
                    error: format!("Failed to connect to service: {}", e),
                }),
            )
        })?;

    // Directly call the new UpdateMyProfile RPC which validates the user on the server side
    let update_request = Request::new(UpdateMyProfileRequest {
        token,
        name: payload.name,
    });

    let response = client.update_my_profile(update_request).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Failed to update profile: {}", e.message()),
            }),
        )
    })?;

    let user = response.into_inner().user.unwrap();

    Ok(Json(user_to_json(&user)))
}
