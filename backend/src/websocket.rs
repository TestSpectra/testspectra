use dashmap::DashMap;
use std::sync::Arc;
use tokio::sync::mpsc;
use uuid::Uuid;
use serde::{Deserialize, Serialize};

/// WebSocket message structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WsMessage {
    #[serde(rename = "type")]
    pub msg_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payload: Option<serde_json::Value>,
}

/// WebSocket manager for handling connections and broadcasting messages
#[derive(Clone)]
pub struct WsManager {
    /// Map of user_id to their WebSocket sender
    connections: Arc<DashMap<Uuid, mpsc::UnboundedSender<WsMessage>>>,
}

impl WsManager {
    /// Create a new WebSocket manager
    pub fn new() -> Self {
        Self {
            connections: Arc::new(DashMap::new()),
        }
    }

    /// Add a new WebSocket connection for a user
    pub fn add_connection(&self, user_id: Uuid, sender: mpsc::UnboundedSender<WsMessage>) {
        tracing::info!("Adding WebSocket connection for user: {}", user_id);
        self.connections.insert(user_id, sender);
    }

    /// Remove a WebSocket connection for a user
    pub fn remove_connection(&self, user_id: &Uuid) {
        tracing::info!("Removing WebSocket connection for user: {}", user_id);
        self.connections.remove(user_id);
    }

    /// Send a message to a specific user
    pub async fn send_to_user(&self, user_id: &Uuid, message: WsMessage) {
        if let Some(sender) = self.connections.get(user_id) {
            if let Err(e) = sender.send(message) {
                tracing::error!("Failed to send message to user {}: {:?}", user_id, e);
                // Remove the connection if sending fails
                self.connections.remove(user_id);
            } else {
                tracing::debug!("Message sent to user: {}", user_id);
            }
        } else {
            tracing::debug!("User {} is not connected via WebSocket", user_id);
        }
    }

    /// Get the number of active connections
    pub fn connection_count(&self) -> usize {
        self.connections.len()
    }
}

impl Default for WsManager {
    fn default() -> Self {
        Self::new()
    }
}
