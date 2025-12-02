#!/bin/bash

# Integration Test Verification Script
# This script verifies that all components of the test case review system are properly implemented

echo "========================================="
echo "Test Case Review System - Implementation Verification"
echo "========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $2 - File not found: $1"
        ((FAIL++))
    fi
}

check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $3"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $3 - Pattern not found in $1"
        ((FAIL++))
    fi
}

echo "1. Database Migrations"
echo "----------------------"
check_file "backend/migrations/20241202001_create_test_case_reviews.sql" "test_case_reviews table migration"
check_file "backend/migrations/20241202002_create_notifications.sql" "notifications table migration"
check_file "backend/migrations/20241202003_add_review_status_to_test_cases.sql" "review_status column migration"
echo ""

echo "2. Backend Models"
echo "-----------------"
check_file "backend/src/models/review.rs" "Review model"
check_file "backend/src/models/notification.rs" "Notification model"
check_content "backend/src/models/review.rs" "TestCaseReview" "TestCaseReview struct"
check_content "backend/src/models/notification.rs" "Notification" "Notification struct"
echo ""

echo "3. Backend Handlers"
echo "-------------------"
check_file "backend/src/handlers/review.rs" "Review handler"
check_file "backend/src/handlers/notification.rs" "Notification handler"
check_file "backend/src/handlers/websocket.rs" "WebSocket handler"
check_content "backend/src/handlers/review.rs" "create_review" "create_review endpoint"
check_content "backend/src/handlers/review.rs" "get_review_history" "get_review_history endpoint"
check_content "backend/src/handlers/notification.rs" "list_notifications" "list_notifications endpoint"
check_content "backend/src/handlers/notification.rs" "mark_as_read" "mark_as_read endpoint"
check_content "backend/src/handlers/websocket.rs" "ws_handler" "WebSocket handler"
echo ""

echo "4. Backend WebSocket Manager"
echo "-----------------------------"
check_file "backend/src/websocket.rs" "WebSocket manager"
check_content "backend/src/websocket.rs" "WsManager" "WsManager struct"
check_content "backend/src/websocket.rs" "send_to_user" "send_to_user method"
echo ""

echo "5. Backend Integration"
echo "----------------------"
check_content "backend/src/main.rs" "WsManager::new" "WsManager initialization"
check_content "backend/src/main.rs" "review_routes" "Review routes registration"
check_content "backend/src/main.rs" "notification_routes" "Notification routes registration"
check_content "backend/src/main.rs" "ws_handler" "WebSocket route registration"
check_content "backend/src/handlers/mod.rs" "pub mod review" "Review module export"
check_content "backend/src/handlers/mod.rs" "pub mod notification" "Notification module export"
check_content "backend/src/handlers/mod.rs" "pub mod websocket" "WebSocket module export"
echo ""

echo "6. Frontend Services"
echo "--------------------"
check_file "src/services/review-service.ts" "Review service"
check_file "src/services/notification-service.ts" "Notification service"
check_file "src/services/websocket-service.ts" "WebSocket service"
check_content "src/services/review-service.ts" "createReview" "createReview method"
check_content "src/services/review-service.ts" "getReviewHistory" "getReviewHistory method"
check_content "src/services/notification-service.ts" "getNotifications" "getNotifications method"
check_content "src/services/notification-service.ts" "markAsRead" "markAsRead method"
check_content "src/services/websocket-service.ts" "WebSocketService" "WebSocketService class"
echo ""

echo "7. Frontend Components"
echo "----------------------"
check_file "src/components/ReviewSection.tsx" "ReviewSection component"
check_file "src/components/ReviewHistory.tsx" "ReviewHistory component"
check_file "src/components/NotificationPanel.tsx" "NotificationPanel component"
check_file "src/components/NotificationBadge.tsx" "NotificationBadge component"
check_content "src/components/ReviewSection.tsx" "approve" "Approve functionality"
check_content "src/components/ReviewSection.tsx" "needs_revision" "Request edit functionality"
check_content "src/components/ReviewHistory.tsx" "reviews" "Review history display"
check_content "src/components/NotificationPanel.tsx" "notifications" "Notification list"
check_content "src/components/NotificationBadge.tsx" "unreadCount" "Unread count display"
echo ""

echo "8. Frontend Context"
echo "-------------------"
check_file "src/contexts/WebSocketContext.tsx" "WebSocket context"
check_content "src/contexts/WebSocketContext.tsx" "WebSocketProvider" "WebSocketProvider component"
check_content "src/contexts/WebSocketContext.tsx" "useWebSocket" "useWebSocket hook"
echo ""

echo "9. Frontend Integration"
echo "-----------------------"
check_content "src/App.tsx" "WebSocketProvider" "WebSocketProvider in App"
check_content "src/components/TestCaseDetail.tsx" "ReviewSection" "ReviewSection in TestCaseDetail"
check_content "src/components/TestCaseDetail.tsx" "ReviewHistory" "ReviewHistory in TestCaseDetail"
check_content "src/components/Layout.tsx" "NotificationBadge" "NotificationBadge in Layout"
check_content "src/components/TestCasesList.tsx" "reviewStatus\|review_status" "Review status filter"
echo ""

echo "10. Test Case Service Updates"
echo "------------------------------"
check_content "src/services/test-case-service.ts" "reviewStatus" "Review status in TestCase type"
check_content "backend/src/handlers/test_case.rs" "review_status" "Review status in create handler"
check_content "backend/src/handlers/test_case.rs" "review_status_filter" "Review status filter"
echo ""

echo "========================================="
echo "Verification Summary"
echo "========================================="
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ All implementation checks passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some implementation checks failed. Please review the output above.${NC}"
    exit 1
fi
