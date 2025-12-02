# Quick Test Checklist - Test Case Review System

Use this checklist for rapid verification of the test case review system.

## Setup ✓
- [ ] Backend running (`cd backend && ./start-services.sh`)
- [ ] Frontend running (`pnpm dev`)
- [ ] Database accessible
- [ ] QA Engineer user available
- [ ] QA Lead user available

---

## Core Workflow Tests

### 1. Create Test Case (QA Engineer)
- [ ] Login as QA Engineer
- [ ] Create new test case
- [ ] Verify status is "Pending Review" (yellow badge)
- [ ] Test case appears in "Pending" filter

### 2. Approve Test Case (QA Lead)
- [ ] Login as QA Lead
- [ ] Open pending test case
- [ ] See Review Section at top
- [ ] Click "Approve" button
- [ ] Add optional comment
- [ ] Submit approval
- [ ] Status changes to "Approved" (green badge)
- [ ] Review appears in history
- [ ] QA Engineer receives notification

### 3. Request Edit (QA Lead)
- [ ] Open another pending test case
- [ ] Click "Request Edit"
- [ ] Try submit without comment → Error shown
- [ ] Add comment
- [ ] Submit request
- [ ] Status changes to "Needs Revision" (red badge)
- [ ] Review appears in history
- [ ] QA Engineer receives notification

### 4. Update Test Case (QA Engineer)
- [ ] Login as QA Engineer
- [ ] Edit an approved test case
- [ ] Save changes
- [ ] Status resets to "Pending Review"
- [ ] Previous reviews still visible in history

---

## Notification Tests

### 5. Real-time Notifications
- [ ] Open two browsers (QA Engineer + QA Lead)
- [ ] QA Lead approves test case
- [ ] QA Engineer sees notification immediately
- [ ] Notification badge shows unread count
- [ ] Click notification → navigates to test case
- [ ] Notification marked as read
- [ ] Unread count decreases

### 6. Notification Panel
- [ ] Click notification badge
- [ ] Panel opens with notification list
- [ ] Each notification shows: type, title, message, timestamp
- [ ] Unread notifications visually distinct
- [ ] Click "Mark as Read" on individual notification
- [ ] Click "Mark All as Read"
- [ ] All notifications marked as read

### 7. Offline Notifications
- [ ] Close browser (QA Engineer offline)
- [ ] QA Lead approves test case
- [ ] QA Engineer logs back in
- [ ] Notification appears in panel
- [ ] No duplicate notifications

---

## Filter Tests

### 8. Review Status Filters
- [ ] Create test cases with different statuses
- [ ] Select "Pending" filter → only pending shown
- [ ] Select "Approved" filter → only approved shown
- [ ] Select "Needs Revision" filter → only needs revision shown
- [ ] Select "All" filter → all test cases shown

---

## Permission Tests

### 9. QA Lead Permissions
- [ ] Login as QA Lead
- [ ] Review Section visible on test case detail
- [ ] Can approve test cases
- [ ] Can request edits

### 10. QA Engineer Permissions
- [ ] Login as QA Engineer
- [ ] Review Section NOT visible
- [ ] Can view review history
- [ ] Can see review status badges

### 11. Self-Review Prevention
- [ ] QA Lead creates test case
- [ ] Try to review own test case
- [ ] Review section hidden or disabled
- [ ] Error if attempted via API

---

## Error Handling Tests

### 12. Validation Errors
- [ ] Request edit without comment → Error shown
- [ ] Invalid review action → Error shown
- [ ] Network error → Error message displayed

### 13. WebSocket Reconnection
- [ ] Establish WebSocket connection
- [ ] Stop backend server
- [ ] Observe reconnection attempts in console
- [ ] Restart backend
- [ ] Connection re-established
- [ ] No duplicate connections

---

## UI/UX Tests

### 14. Review Status Badges
- [ ] Pending: Yellow badge, "Pending Review"
- [ ] Approved: Green badge, "Approved"
- [ ] Needs Revision: Red badge, "Needs Revision"
- [ ] Badges clearly visible in list

### 15. Review History Display
- [ ] All reviews shown in chronological order
- [ ] Reviewer name displayed
- [ ] Action displayed (Approved/Needs Revision)
- [ ] Comment displayed (if provided)
- [ ] Timestamp displayed
- [ ] Empty state message when no reviews

### 16. Loading States
- [ ] Loading indicators during data fetch
- [ ] No broken UI during loading
- [ ] Smooth transitions

---

## Database Verification

### 17. Data Persistence
```sql
-- Check review records
SELECT * FROM test_case_reviews ORDER BY created_at DESC LIMIT 5;

-- Check notification records
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;

-- Check review status
SELECT case_id, review_status FROM test_cases LIMIT 10;
```

---

## Quick Issue Log

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 |       |          |        |
| 2 |       |          |        |
| 3 |       |          |        |

---

## Test Result Summary

**Date:** _______________  
**Tester:** _______________

- [ ] All core workflow tests passed
- [ ] All notification tests passed
- [ ] All filter tests passed
- [ ] All permission tests passed
- [ ] All error handling tests passed
- [ ] All UI/UX tests passed
- [ ] Database verification passed

**Overall Status:** ⬜ PASS / ⬜ FAIL / ⬜ PASS WITH ISSUES

**Notes:**
_______________________________________
_______________________________________
_______________________________________

