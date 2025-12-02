use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Notification {
    pub id: Uuid,
    pub user_id: Uuid,
    pub notification_type: String,
    pub title: String,
    pub message: String,
    pub related_entity_type: Option<String>,
    pub related_entity_id: Option<String>,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationResponse {
    pub id: String,
    #[serde(rename = "type")]
    pub type_: String,
    pub title: String,
    pub message: String,
    pub related_entity_type: Option<String>,
    pub related_entity_id: Option<String>,
    pub is_read: bool,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateNotificationRequest {
    pub user_id: Uuid,
    pub notification_type: String,
    pub title: String,
    pub message: String,
    pub related_entity_type: Option<String>,
    pub related_entity_id: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationListResponse {
    pub notifications: Vec<NotificationResponse>,
    pub total: i64,
    pub unread_count: i64,
}

impl NotificationResponse {
    pub fn from_notification(notification: Notification) -> Self {
        Self {
            id: notification.id.to_string(),
            type_: notification.notification_type,
            title: notification.title,
            message: notification.message,
            related_entity_type: notification.related_entity_type,
            related_entity_id: notification.related_entity_id,
            is_read: notification.is_read,
            created_at: notification.created_at.to_rfc3339(),
        }
    }
}
