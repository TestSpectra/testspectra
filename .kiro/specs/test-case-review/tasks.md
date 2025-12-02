# Implementation Plan: Test Case Review System

- [x] 1. Database schema setup
  - Create migration file for test_case_reviews table
  - Create migration file for notifications table
  - Add review_status column to test_cases table with default 'pending'
  - Add indexes for performance optimization
  - _Requirements: 1.1, 2.3, 2.5, 4.1, 4.2, 7.1_

- [x] 2. Backend: Review models and handlers
  - [x] 2.1 Create review data models in models/review.rs
    - Define TestCaseReview struct with FromRow and Serialize
    - Define ReviewResponse, CreateReviewRequest structs
    - Define ReviewWithReviewer struct for joined queries
    - _Requirements: 2.3, 2.5, 3.2_

  - [x] 2.2 Implement review handler endpoints
    - POST /api/test-cases/:id/reviews - create review
    - GET /api/test-cases/:id/reviews - get review history
    - Add authorization check for QA Lead role
    - Add validation for self-review prevention
    - Add validation for required comment on request edit
    - _Requirements: 2.3, 2.4, 2.5, 3.2, 3.4_

  - [ ]* 2.3 Write property test for new test case status
    - **Property 1: New test cases have pending status**
    - **Validates: Requirements 1.1**

  - [ ]* 2.4 Write property test for status reset on update
    - **Property 2: Updating reviewed test cases resets status**
    - **Validates: Requirements 1.3, 1.4**

  - [ ]* 2.5 Write property test for approval workflow
    - **Property 3: Approval updates status and creates record**
    - **Validates: Requirements 2.3**

  - [ ]* 2.6 Write property test for request edit validation
    - **Property 4: Request edit requires comment**
    - **Validates: Requirements 2.4**

  - [ ]* 2.7 Write property test for request edit workflow
    - **Property 5: Request edit updates status and creates record**
    - **Validates: Requirements 2.5**

  - [ ]* 2.8 Write property test for review history
    - **Property 7: Review appears in history immediately**
    - **Validates: Requirements 3.4**

- [x] 3. Backend: Notification models and handlers
  - [x] 3.1 Create notification data models in models/notification.rs
    - Define Notification struct with FromRow and Serialize
    - Define NotificationResponse, CreateNotificationRequest structs
    - Define NotificationListResponse with pagination
    - _Requirements: 4.1, 4.2, 7.1_

  - [x] 3.2 Implement notification handler endpoints
    - GET /api/notifications - list notifications with pagination
    - PUT /api/notifications/:id/read - mark as read
    - PUT /api/notifications/mark-all-read - mark all as read
    - Add authorization to ensure users only access their own notifications
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 3.3 Implement notification service
    - Create notification on review approval
    - Create notification on review request edit
    - Implement notification ordering logic (unread first, then by timestamp desc)
    - _Requirements: 4.1, 4.2, 7.4_

  - [ ]* 3.4 Write property test for notification creation on approval
    - **Property 8: Approval creates notification for creator**
    - **Validates: Requirements 4.1**

  - [ ]* 3.5 Write property test for notification creation on request edit
    - **Property 9: Request edit creates notification for creator**
    - **Validates: Requirements 4.2**

  - [ ]* 3.6 Write property test for notification persistence
    - **Property 13: Notifications are persisted**
    - **Validates: Requirements 7.1**

  - [ ]* 3.7 Write property test for notification isolation
    - **Property 14: User notifications are isolated**
    - **Validates: Requirements 7.2**

  - [ ]* 3.8 Write property test for mark as read
    - **Property 15: Mark as read updates status**
    - **Validates: Requirements 7.3**

  - [ ]* 3.9 Write property test for notification ordering
    - **Property 16: Notification ordering is correct**
    - **Validates: Requirements 7.4**

- [x] 4. Backend: WebSocket implementation
  - [x] 4.1 Create WebSocket manager
    - Implement WsManager with DashMap for connection storage
    - Add connection lifecycle management (add, remove)
    - Implement send_to_user method for targeted message delivery
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 4.2 Implement WebSocket handler endpoint
    - WS /api/ws - WebSocket connection endpoint
    - Implement JWT authentication on connection
    - Handle incoming messages (ping/pong)
    - Handle connection cleanup on disconnect
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 4.3 Integrate WebSocket with notification service
    - Broadcast notification via WebSocket when created
    - Handle offline users gracefully (notification already in DB)
    - _Requirements: 8.3, 8.5_

  - [ ]* 4.4 Write property test for WebSocket authentication
    - **Property 17: WebSocket authentication validates tokens**
    - **Validates: Requirements 8.2**

  - [ ]* 4.5 Write unit tests for WebSocket manager
    - Test connection add/remove
    - Test message broadcasting
    - Test connection cleanup

- [x] 5. Backend: Update test case handler for review status
  - [x] 5.1 Modify create_test_case to set review_status to pending
    - Update INSERT query to include review_status field
    - _Requirements: 1.1_

  - [x] 5.2 Modify update_test_case to reset review_status to pending
    - Add logic to check current review_status
    - Reset to pending if status is approved or needs_revision
    - _Requirements: 1.3, 1.4_

  - [x] 5.3 Add review_status filter to list_test_cases
    - Add review_status_filter to ListTestCasesQuery
    - Update WHERE clause to include review_status filter
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [ ]* 5.4 Write property test for review status filter
    - **Property 11: Review status filter returns correct results**
    - **Validates: Requirements 5.2, 5.3, 5.4**

  - [ ]* 5.5 Write property test for all filter
    - **Property 12: All filter returns all test cases**
    - **Validates: Requirements 5.5**

- [x] 6. Backend: Wire up all handlers to main router
  - Add review routes to main router
  - Add notification routes to main router
  - Add WebSocket route to main router
  - Update main.rs to initialize WsManager
  - _Requirements: All backend requirements_

- [ ] 7. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Frontend: Review service and types
  - [x] 8.1 Create review types in types or models
    - Define ReviewAction, ReviewStatus types
    - Define Review, CreateReviewRequest interfaces
    - _Requirements: 2.3, 2.5_

  - [x] 8.2 Create review service in services/review-service.ts
    - Implement createReview method
    - Implement getReviewHistory method
    - Add error handling
    - _Requirements: 2.3, 2.5, 3.2_

- [x] 9. Frontend: Notification service and types
  - [x] 9.1 Create notification types
    - Define NotificationType, Notification interfaces
    - Define NotificationListResponse interface
    - _Requirements: 4.1, 4.2, 7.1_

  - [x] 9.2 Create notification service in services/notification-service.ts
    - Implement getNotifications method with pagination
    - Implement markAsRead method
    - Implement markAllAsRead method
    - Add error handling
    - _Requirements: 7.2, 7.3_

- [x] 10. Frontend: WebSocket implementation
  - [x] 10.1 Create WebSocket service
    - Implement WebSocketService class with connect/disconnect
    - Implement message handling (onMessage callback)
    - Implement reconnection logic
    - Add JWT token authentication
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 10.2 Create WebSocket context provider
    - Create WebSocketContext with connection state
    - Implement useWebSocket hook
    - Handle connection lifecycle in provider
    - _Requirements: 8.1, 8.4_

  - [ ]* 10.3 Write unit tests for WebSocket service
    - Test connection establishment
    - Test message handling
    - Test reconnection logic

- [x] 11. Frontend: Review UI components
  - [x] 11.1 Create ReviewSection component
    - Add approve and request edit buttons
    - Add comment textarea for review
    - Add validation for required comment on request edit
    - Integrate with review service
    - Show loading and error states
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x] 11.2 Create ReviewHistory component
    - Display list of reviews with reviewer name, action, comment, timestamp
    - Handle empty state with appropriate message
    - Add styling for different review actions
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 11.3 Integrate review components into TestCaseDetail
    - Add ReviewSection at top of detail page (for QA Lead only)
    - Add ReviewHistory section below test case details
    - Handle permission checks for review actions
    - _Requirements: 2.1, 3.1_

  - [ ]* 11.4 Write property test for review history rendering
    - **Property 6: Review history contains all required fields**
    - **Validates: Requirements 3.2**

- [x] 12. Frontend: Notification UI components
  - [x] 12.1 Create NotificationPanel component
    - Display list of notifications with pagination
    - Show notification type, title, message, timestamp, read status
    - Handle click to navigate to related test case
    - Add mark as read functionality
    - Add mark all as read button
    - _Requirements: 4.3, 4.4, 4.5, 7.2, 7.3_

  - [x] 12.2 Create NotificationBadge component
    - Display unread notification count
    - Add visual indicator for unread notifications
    - Toggle NotificationPanel on click
    - _Requirements: 4.5_

  - [x] 12.3 Integrate notification components into Layout
    - Add NotificationBadge to header/navbar
    - Connect to WebSocket context for real-time updates
    - Update unread count when new notification arrives
    - _Requirements: 4.3, 4.5_

  - [ ]* 12.4 Write property test for notification rendering
    - **Property 10: Notification display contains required fields**
    - **Validates: Requirements 4.5**

- [x] 13. Frontend: Test case list enhancements
  - [x] 13.1 Add review status badge to TestCasesList
    - Display badge with appropriate color and text for each status
    - Add badge to each test case row
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 13.2 Add review status filter to TestCasesList
    - Add filter dropdown or tabs for review status
    - Include options: All, Pending, Approved, Needs Revision
    - Update API call to include review_status_filter
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 14. Frontend: Connect WebSocket to notification updates
  - Listen for notification messages from WebSocket
  - Update notification state when message received
  - Show toast/snackbar for new notifications
  - Update unread count in real-time
  - _Requirements: 4.1, 4.2, 8.3_

- [x] 15. Frontend: Update test case service
  - Ensure review_status is included in TestCase type
  - Update API responses to include review_status
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Integration testing and polish
  - Test complete review workflow end-to-end
  - Test WebSocket connection and notification delivery
  - Test filter functionality with various statuses
  - Verify UI responsiveness and error handling
  - Check permission enforcement
  - _Requirements: All requirements_
