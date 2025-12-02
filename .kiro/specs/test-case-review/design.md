# Design Document: Test Case Review System

## Overview

Sistem review test case adalah fitur yang memungkinkan QA Lead untuk melakukan review terhadap test case yang dibuat oleh QA Engineer. Sistem ini mengimplementasikan workflow approval sederhana dengan dua aksi utama: approve dan request edit. Setiap review disimpan sebagai history dan user mendapatkan notifikasi real-time melalui WebSocket connection.

Fitur ini terintegrasi dengan sistem test case management yang sudah ada, menambahkan layer review workflow tanpa mengubah core functionality yang ada.

## Architecture

### High-Level Architecture

```
┌─────────────────┐         WebSocket          ┌──────────────────┐
│                 │◄──────────────────────────►│                  │
│  Frontend       │                             │   Backend        │
│  (React/TS)     │         HTTP/REST           │   (Rust/Axum)    │
│                 │◄──────────────────────────►│                  │
└─────────────────┘                             └──────────────────┘
                                                         │
                                                         │
                                                         ▼
                                                ┌──────────────────┐
                                                │   PostgreSQL     │
                                                │   Database       │
                                                └──────────────────┘
```

### Component Architecture

**Backend Components:**
- **Review Handler**: Mengelola HTTP endpoints untuk review operations (create review, get review history)
- **Notification Handler**: Mengelola HTTP endpoints untuk notification operations (list, mark as read)
- **WebSocket Manager**: Mengelola WebSocket connections dan message broadcasting
- **Review Service**: Business logic untuk review workflow
- **Notification Service**: Business logic untuk notification management

**Frontend Components:**
- **ReviewSection**: UI component untuk melakukan review (approve/request edit)
- **ReviewHistory**: UI component untuk menampilkan history review
- **NotificationPanel**: UI component untuk menampilkan daftar notifikasi
- **NotificationBadge**: UI component untuk menampilkan unread notification count
- **WebSocketProvider**: Context provider untuk WebSocket connection management
- **TestCaseList Enhancement**: Menambahkan review status badge dan filter

## Components and Interfaces

### Database Schema

#### test_case_reviews table
```sql
CREATE TABLE test_case_reviews (
    id UUID PRIMARY KEY,
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- 'approved' or 'needs_revision'
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_test_case_id ON test_case_reviews(test_case_id);
CREATE INDEX idx_reviews_reviewer_id ON test_case_reviews(reviewer_id);
CREATE INDEX idx_reviews_created_at ON test_case_reviews(created_at DESC);
```

#### notifications table
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'review_approved', 'review_needs_revision'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(50), -- 'test_case'
    related_entity_id VARCHAR(50), -- case_id (TC-0001)
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
```

#### test_cases table modification
```sql
ALTER TABLE test_cases ADD COLUMN review_status VARCHAR(50) NOT NULL DEFAULT 'pending';
CREATE INDEX idx_test_cases_review_status ON test_cases(review_status);
```

### Backend API Endpoints

#### Review Endpoints

**POST /api/test-cases/:id/reviews**
- Create a new review for a test case
- Request body:
```json
{
  "action": "approved" | "needs_revision",
  "comment": "optional comment"
}
```
- Response:
```json
{
  "id": "uuid",
  "testCaseId": "TC-0001",
  "reviewerId": "uuid",
  "reviewerName": "John Doe",
  "action": "approved",
  "comment": "Looks good",
  "createdAt": "2024-12-02T10:00:00Z"
}
```

**GET /api/test-cases/:id/reviews**
- Get review history for a test case
- Response:
```json
{
  "reviews": [
    {
      "id": "uuid",
      "reviewerId": "uuid",
      "reviewerName": "John Doe",
      "action": "needs_revision",
      "comment": "Please add more assertions",
      "createdAt": "2024-12-01T10:00:00Z"
    }
  ]
}
```

#### Notification Endpoints

**GET /api/notifications**
- Get notifications for current user
- Query params: `?page=1&pageSize=20&unreadOnly=false`
- Response:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "review_approved",
      "title": "Test Case Approved",
      "message": "Your test case TC-0001 has been approved by John Doe",
      "relatedEntityType": "test_case",
      "relatedEntityId": "TC-0001",
      "isRead": false,
      "createdAt": "2024-12-02T10:00:00Z"
    }
  ],
  "total": 50,
  "unreadCount": 5
}
```

**PUT /api/notifications/:id/read**
- Mark a notification as read
- Response:
```json
{
  "success": true
}
```

**PUT /api/notifications/mark-all-read**
- Mark all notifications as read for current user
- Response:
```json
{
  "success": true,
  "updatedCount": 5
}
```

#### WebSocket Endpoint

**WS /api/ws**
- WebSocket connection for real-time notifications
- Authentication: JWT token sent in initial message or query param
- Message format (server → client):
```json
{
  "type": "notification",
  "payload": {
    "id": "uuid",
    "type": "review_approved",
    "title": "Test Case Approved",
    "message": "Your test case TC-0001 has been approved",
    "relatedEntityType": "test_case",
    "relatedEntityId": "TC-0001",
    "createdAt": "2024-12-02T10:00:00Z"
  }
}
```

### Frontend Services

#### WebSocket Service
```typescript
interface WebSocketMessage {
  type: 'notification' | 'ping' | 'pong';
  payload?: any;
}

class WebSocketService {
  connect(token: string): void;
  disconnect(): void;
  onMessage(callback: (message: WebSocketMessage) => void): void;
  send(message: WebSocketMessage): void;
}
```

#### Review Service
```typescript
interface ReviewRequest {
  action: 'approved' | 'needs_revision';
  comment?: string;
}

interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  action: string;
  comment?: string;
  createdAt: string;
}

class ReviewService {
  createReview(testCaseId: string, request: ReviewRequest): Promise<Review>;
  getReviewHistory(testCaseId: string): Promise<Review[]>;
}
```

#### Notification Service
```typescript
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: string;
}

class NotificationService {
  getNotifications(page: number, pageSize: number, unreadOnly: boolean): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(): Promise<void>;
}
```

## Data Models

### Backend Models (Rust)

```rust
// Review models
#[derive(Debug, Clone, FromRow, Serialize)]
pub struct TestCaseReview {
    pub id: Uuid,
    pub test_case_id: Uuid,
    pub reviewer_id: Uuid,
    pub action: String,
    pub comment: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct ReviewResponse {
    pub id: String,
    pub test_case_id: String,
    pub reviewer_id: String,
    pub reviewer_name: String,
    pub action: String,
    pub comment: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateReviewRequest {
    pub action: String,
    pub comment: Option<String>,
}

// Notification models
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
    pub type_: String,
    pub title: String,
    pub message: String,
    pub related_entity_type: Option<String>,
    pub related_entity_id: Option<String>,
    pub is_read: bool,
    pub created_at: String,
}

// WebSocket message
#[derive(Debug, Serialize, Deserialize)]
pub struct WsMessage {
    #[serde(rename = "type")]
    pub msg_type: String,
    pub payload: Option<serde_json::Value>,
}
```

### Frontend Models (TypeScript)

```typescript
export type ReviewAction = 'approved' | 'needs_revision';
export type ReviewStatus = 'pending' | 'approved' | 'needs_revision';

export interface Review {
  id: string;
  testCaseId: string;
  reviewerId: string;
  reviewerName: string;
  action: ReviewAction;
  comment?: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  action: ReviewAction;
  comment?: string;
}

export type NotificationType = 'review_approved' | 'review_needs_revision';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}
```

## Correctne
ss Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: New test cases have pending status
*For any* newly created test case, the review_status field should be set to "pending"
**Validates: Requirements 1.1**

### Property 2: Updating reviewed test cases resets status
*For any* test case with review_status of "approved" or "needs_revision", when the test case is updated, the review_status should change to "pending"
**Validates: Requirements 1.3, 1.4**

### Property 3: Approval updates status and creates record
*For any* test case, when a QA Lead submits an approval, the test case review_status should be "approved" and a review record with action "approved" should exist in the database
**Validates: Requirements 2.3**

### Property 4: Request edit requires comment
*For any* request edit submission with an empty or whitespace-only comment, the system should reject the request
**Validates: Requirements 2.4**

### Property 5: Request edit updates status and creates record
*For any* test case, when a QA Lead submits a request edit with a valid comment, the test case review_status should be "needs_revision" and a review record with action "needs_revision" should exist in the database
**Validates: Requirements 2.5**

### Property 6: Review history contains all required fields
*For any* review in the history, the rendered output should contain reviewer name, review action, comment (if present), and timestamp
**Validates: Requirements 3.2**

### Property 7: Review appears in history immediately
*For any* test case, after submitting a review, querying the review history should include that review
**Validates: Requirements 3.4**

### Property 8: Approval creates notification for creator
*For any* test case approval, a notification with type "review_approved" should be created for the test case creator
**Validates: Requirements 4.1**

### Property 9: Request edit creates notification for creator
*For any* test case request edit, a notification with type "review_needs_revision" should be created for the test case creator
**Validates: Requirements 4.2**

### Property 10: Notification display contains required fields
*For any* notification, the displayed output should contain notification type, message, timestamp, and read status
**Validates: Requirements 4.5**

### Property 11: Review status filter returns correct results
*For any* review status filter value ("pending", "approved", "needs_revision"), the filtered results should contain only test cases with that review status
**Validates: Requirements 5.2, 5.3, 5.4**

### Property 12: All filter returns all test cases
*For any* set of test cases, applying the "all" filter should return all test cases regardless of their review status
**Validates: Requirements 5.5**

### Property 13: Notifications are persisted
*For any* notification sent, the notification should exist in the database with all required fields
**Validates: Requirements 7.1**

### Property 14: User notifications are isolated
*For any* user, querying their notifications should return only notifications where user_id matches that user
**Validates: Requirements 7.2**

### Property 15: Mark as read updates status
*For any* notification, after marking it as read, the is_read field should be true
**Validates: Requirements 7.3**

### Property 16: Notification ordering is correct
*For any* set of notifications for a user, unread notifications should appear before read notifications, and within each group, notifications should be ordered by timestamp descending
**Validates: Requirements 7.4**

### Property 17: WebSocket authentication validates tokens
*For any* WebSocket connection attempt with an invalid JWT token, the connection should be rejected
**Validates: Requirements 8.2**

## Error Handling

### Review Errors

1. **Invalid Review Action**: Return 400 Bad Request if action is not "approved" or "needs_revision"
2. **Missing Comment for Request Edit**: Return 400 Bad Request if action is "needs_revision" but comment is empty
3. **Test Case Not Found**: Return 404 Not Found if test case doesn't exist
4. **Unauthorized Review**: Return 403 Forbidden if user doesn't have QA Lead role
5. **Self Review**: Return 400 Bad Request if reviewer is the same as test case creator

### Notification Errors

1. **Notification Not Found**: Return 404 Not Found if notification doesn't exist
2. **Unauthorized Access**: Return 403 Forbidden if user tries to access another user's notification
3. **Invalid Notification Type**: Return 400 Bad Request if notification type is not recognized

### WebSocket Errors

1. **Authentication Failed**: Close connection with code 4001 if JWT token is invalid
2. **Connection Timeout**: Close connection with code 4002 if no activity for 5 minutes
3. **Invalid Message Format**: Send error message back to client if message format is invalid
4. **Broadcast Failure**: Log error and continue if notification broadcast fails for a specific user

### Database Errors

1. **Transaction Failure**: Rollback transaction and return 500 Internal Server Error
2. **Constraint Violation**: Return 400 Bad Request with appropriate error message
3. **Connection Pool Exhausted**: Return 503 Service Unavailable

## Testing Strategy

### Unit Testing

Unit tests akan mencakup:

1. **Review Service Tests**
   - Test create review with valid data
   - Test create review with invalid action
   - Test create review without comment for request edit
   - Test get review history for test case
   - Test review status update on test case

2. **Notification Service Tests**
   - Test create notification
   - Test get notifications for user
   - Test mark notification as read
   - Test mark all notifications as read
   - Test notification ordering logic

3. **WebSocket Manager Tests**
   - Test connection authentication
   - Test message broadcasting to specific user
   - Test connection cleanup on disconnect
   - Test handling invalid messages

4. **Filter Logic Tests**
   - Test review status filter with each status value
   - Test "all" filter returns all test cases
   - Test filter with empty result set

### Property-Based Testing

Property-based testing akan menggunakan **quickcheck** library untuk Rust dan **fast-check** library untuk TypeScript. Setiap property test harus dijalankan minimal 100 iterasi.

Property tests akan mencakup:

1. **Property 1: New test cases have pending status**
   - Generate random test case data
   - Create test case
   - Verify review_status is "pending"

2. **Property 2: Updating reviewed test cases resets status**
   - Generate random test case with "approved" or "needs_revision" status
   - Update test case
   - Verify review_status changes to "pending"

3. **Property 3: Approval updates status and creates record**
   - Generate random test case and approval data
   - Submit approval
   - Verify status is "approved" and review record exists

4. **Property 4: Request edit requires comment**
   - Generate random whitespace-only strings
   - Attempt to submit request edit with empty comment
   - Verify request is rejected

5. **Property 5: Request edit updates status and creates record**
   - Generate random test case and request edit data with valid comment
   - Submit request edit
   - Verify status is "needs_revision" and review record exists

6. **Property 6: Review history contains all required fields**
   - Generate random review data
   - Render review
   - Verify output contains all required fields

7. **Property 7: Review appears in history immediately**
   - Generate random test case and review
   - Submit review
   - Query history
   - Verify review is present

8. **Property 8: Approval creates notification for creator**
   - Generate random test case and approval
   - Submit approval
   - Verify notification exists for creator

9. **Property 9: Request edit creates notification for creator**
   - Generate random test case and request edit
   - Submit request edit
   - Verify notification exists for creator

10. **Property 10: Notification display contains required fields**
    - Generate random notification
    - Render notification
    - Verify output contains all required fields

11. **Property 11: Review status filter returns correct results**
    - Generate random set of test cases with various statuses
    - Apply filter for each status
    - Verify results contain only matching status

12. **Property 12: All filter returns all test cases**
    - Generate random set of test cases
    - Apply "all" filter
    - Verify all test cases are returned

13. **Property 13: Notifications are persisted**
    - Generate random notification
    - Send notification
    - Verify notification exists in database

14. **Property 14: User notifications are isolated**
    - Generate random notifications for different users
    - Query notifications for specific user
    - Verify only that user's notifications are returned

15. **Property 15: Mark as read updates status**
    - Generate random notification
    - Mark as read
    - Verify is_read is true

16. **Property 16: Notification ordering is correct**
    - Generate random set of read and unread notifications
    - Query notifications
    - Verify unread come first and timestamps are descending

17. **Property 17: WebSocket authentication validates tokens**
    - Generate random invalid JWT tokens
    - Attempt connection
    - Verify connection is rejected

### Integration Testing

Integration tests akan mencakup:

1. **End-to-End Review Workflow**
   - Create test case (status: pending)
   - Submit approval (status: approved, notification sent)
   - Update test case (status: pending)
   - Submit request edit (status: needs_revision, notification sent)
   - Update test case (status: pending)
   - Submit approval (status: approved)

2. **WebSocket Notification Flow**
   - Establish WebSocket connection
   - Submit review
   - Verify notification received via WebSocket
   - Verify notification persisted in database

3. **Filter and List Integration**
   - Create multiple test cases with different statuses
   - Apply various filters
   - Verify correct test cases are returned

## Implementation Notes

### WebSocket Implementation

Untuk WebSocket di Rust dengan Axum, kita akan menggunakan:
- **axum::extract::ws**: WebSocket support dari Axum
- **tokio::sync::broadcast**: Channel untuk broadcasting messages ke multiple connections
- **dashmap::DashMap**: Thread-safe HashMap untuk menyimpan active connections

Struktur WebSocket manager:
```rust
pub struct WsManager {
    connections: Arc<DashMap<Uuid, mpsc::UnboundedSender<WsMessage>>>,
}

impl WsManager {
    pub fn add_connection(&self, user_id: Uuid, sender: mpsc::UnboundedSender<WsMessage>);
    pub fn remove_connection(&self, user_id: &Uuid);
    pub async fn send_to_user(&self, user_id: &Uuid, message: WsMessage);
}
```

### Review Status Transition

Review status hanya bisa berubah melalui jalur berikut:
1. **Create** → pending
2. **Approve** → approved
3. **Request Edit** → needs_revision
4. **Update (from approved/needs_revision)** → pending

Tidak ada transisi langsung dari approved ke needs_revision atau sebaliknya tanpa melalui update.

### Notification Delivery Strategy

1. **Real-time**: Jika user online (WebSocket connected), kirim via WebSocket
2. **Persistent**: Selalu simpan ke database, bahkan jika user online
3. **Catch-up**: Saat user reconnect, tidak perlu kirim ulang karena sudah ada di database
4. **Polling fallback**: Frontend bisa polling /api/notifications jika WebSocket gagal

### Performance Considerations

1. **Database Indexes**: Pastikan ada index pada:
   - test_case_reviews(test_case_id, created_at DESC)
   - notifications(user_id, is_read, created_at DESC)
   - test_cases(review_status)

2. **WebSocket Connection Limit**: Monitor jumlah active connections, consider connection pooling jika > 1000 users

3. **Notification Pagination**: Limit notification query ke 50 per page untuk performa

4. **Review History**: Tidak perlu pagination untuk review history karena biasanya < 10 reviews per test case

### Security Considerations

1. **Authorization**: Hanya QA Lead yang bisa submit review
2. **Self-Review Prevention**: User tidak bisa review test case yang mereka buat sendiri
3. **WebSocket Authentication**: Validate JWT token pada setiap connection
4. **Notification Access**: User hanya bisa akses notifikasi mereka sendiri
5. **SQL Injection**: Gunakan parameterized queries untuk semua database operations

### Frontend State Management

1. **WebSocket Context**: Global context untuk WebSocket connection
2. **Notification State**: Global state untuk unread count dan notification list
3. **Review Status**: Local state di TestCaseDetail component
4. **Optimistic Updates**: Update UI immediately, rollback jika API call gagal

### Migration Strategy

1. **Database Migration**: Add review_status column dengan default 'pending'
2. **Existing Test Cases**: Semua test case existing akan otomatis dapat status 'pending'
3. **Backward Compatibility**: API tetap berfungsi tanpa breaking changes
4. **Feature Flag**: Consider feature flag untuk gradual rollout

## Future Enhancements

1. **Review Assignment**: Assign specific reviewer untuk test case
2. **Review Deadline**: Set deadline untuk review
3. **Review Metrics**: Dashboard untuk review statistics
4. **Bulk Review**: Review multiple test cases sekaligus
5. **Review Templates**: Template comment untuk common feedback
6. **Email Notifications**: Kirim email selain push notification
7. **Review Approval Workflow**: Multi-level approval (reviewer → approver)
8. **Review Checklist**: Checklist items yang harus diverifikasi saat review
