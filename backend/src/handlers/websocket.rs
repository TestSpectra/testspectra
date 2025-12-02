use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query, State,
    },
    response::Response,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::Deserialize;
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::auth::JwtService;
use crate::websocket::{WsManager, WsMessage};

#[derive(Clone)]
pub struct WebSocketState {
    pub ws_manager: WsManager,
    pub jwt: JwtService,
}

#[derive(Debug, Deserialize)]
pub struct WsQuery {
    pub token: Option<String>,
}

/// WebSocket connection handler
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Query(query): Query<WsQuery>,
    State(state): State<WebSocketState>,
) -> Response {
    // Authenticate user from query parameter token
    let user_id = match query.token {
        Some(token) => match state.jwt.get_user_id_from_token(&token) {
            Ok(id) => match Uuid::parse_str(&id) {
                Ok(uuid) => uuid,
                Err(_) => {
                    tracing::error!("Invalid user ID format");
                    return axum::response::Response::builder()
                        .status(401)
                        .body("Invalid user ID".into())
                        .unwrap();
                }
            },
            Err(_) => {
                tracing::error!("Invalid JWT token");
                return axum::response::Response::builder()
                    .status(401)
                    .body("Invalid token".into())
                    .unwrap();
            }
        },
        None => {
            tracing::error!("Missing token in WebSocket connection");
            return axum::response::Response::builder()
                .status(401)
                .body("Missing token".into())
                .unwrap();
        }
    };

    tracing::info!("WebSocket connection authenticated for user: {}", user_id);

    // Upgrade the connection
    ws.on_upgrade(move |socket| handle_socket(socket, user_id, state))
}

/// Handle individual WebSocket connection
async fn handle_socket(socket: WebSocket, user_id: Uuid, state: WebSocketState) {
    let (mut sender, mut receiver) = socket.split();

    // Create a channel for sending messages to this connection
    let (tx, mut rx) = mpsc::unbounded_channel::<WsMessage>();

    // Register the connection
    state.ws_manager.add_connection(user_id, tx);

    // Spawn a task to forward messages from the channel to the WebSocket
    let mut send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            // Serialize the message to JSON
            match serde_json::to_string(&msg) {
                Ok(json) => {
                    if sender.send(Message::Text(json)).await.is_err() {
                        tracing::error!("Failed to send message to WebSocket");
                        break;
                    }
                }
                Err(e) => {
                    tracing::error!("Failed to serialize message: {:?}", e);
                }
            }
        }
    });

    // Spawn a task to handle incoming messages from the WebSocket
    let ws_manager = state.ws_manager.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    // Parse incoming message
                    match serde_json::from_str::<WsMessage>(&text) {
                        Ok(ws_msg) => {
                            // Handle ping/pong
                            if ws_msg.msg_type == "ping" {
                                let pong = WsMessage {
                                    msg_type: "pong".to_string(),
                                    payload: None,
                                };
                                ws_manager.send_to_user(&user_id, pong).await;
                            }
                            // Other message types can be handled here
                        }
                        Err(e) => {
                            tracing::error!("Failed to parse WebSocket message: {:?}", e);
                        }
                    }
                }
                Message::Close(_) => {
                    tracing::info!("WebSocket connection closed by client: {}", user_id);
                    break;
                }
                Message::Ping(_) | Message::Pong(_) => {
                    // Axum handles ping/pong automatically
                }
                _ => {
                    // Ignore other message types
                }
            }
        }
        user_id
    });

    // Wait for either task to finish
    tokio::select! {
        _ = (&mut send_task) => {
            recv_task.abort();
        }
        user_id = (&mut recv_task) => {
            send_task.abort();
            // Clean up the connection
            if let Ok(uid) = user_id {
                state.ws_manager.remove_connection(&uid);
            }
        }
    }

    tracing::info!("WebSocket connection closed for user: {}", user_id);
}
