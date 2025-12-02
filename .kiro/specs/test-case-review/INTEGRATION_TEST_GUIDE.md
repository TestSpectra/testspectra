# Integration Test Guide: Test Case Review System

## Overview
This document provides comprehensive integration testing procedures for the Test Case Review System. Follow these tests to verify all requirements are met.

## Prerequisites
- Backend server running on configured port
- Frontend application running
- PostgreSQL database with migrations applied
- At least 2 test users:
  - QA Engineer (role: 'qa_engineer')
  - QA Lead (role: 'qa_lead')

## Test Environment Setup

### 1. Start Backend
```bash
cd backend
./start-services.sh
```

### 2. Start Frontend
```bash
pnpm dev
```

### 3. Verify Database Migrations
Check that these tables exist:
- `test_case_reviews`
- `notifications`
- `test_cases` (with `review_status` column)

---

## Test Suite 1: Review Workflow End-to-End

### Test 1.1: New Test Case Creation
**Requirement: 1.1**

**Steps:**
1. Login as QA Engineer
2. Navigate to Test Cases
3. Click "Create New Test Case"
4. Fill in test case details
5. Save the test case

**Expected Results:**
- ✅ Test case is created successfully
- ✅ Review status is set to "pending"
- ✅ Yellow "Pending Review" badge appears in test case list
- ✅ Test case appears in "Pending" filter

**Validation:**
```sql
SELECT id, case_id, review_status FROM test_cases WHERE case_id = 'TC-XXXX';
-- review_status should be 'pending'
```

---

### Test 1.2: QA Lead Approval Workflow
**Requirements: 2.1, 2.2, 2.3, 4.1**

**Steps:**
1. Login as QA Lead
2. Navigate to Test Cases
3. Click on a test case with "Pending Review" status
4. Verify Review Section is visible at top of detail page
5. Click "Approve" button
6. Enter optional comment: "Looks good, approved"
7. Submit approval

**Expected Results:**
- ✅ Review Section displays with Approve and Request Edit buttons
- ✅ Comment textarea is available
- ✅ After submission:
  - Review status changes to "approved"
  - Green "Approved" badge appears in list
  - Review appears in Review History section
  - Notification is created for test case creator
  - WebSocket notification is sent (if creator is online)

**Validation:**
```sql
-- Check review record
SELECT * FROM test_case_reviews WHERE test_case_id = (SELECT id FROM test_cases WHERE case_id = 'TC-XXXX');

-- Check test case status
SELECT review_status FROM test_cases WHERE case_id = 'TC-XXXX';
-- Should be 'approved'

-- Check notification
SELECT * FROM notifications WHERE related_entity_id = 'TC-XXXX' AND notification_type = 'review_approved';
```

---

### Test 1.3: Request Edit Workflow
**Requirements: 2.4, 2.5, 4.2**

**Steps:**
1. Login as QA Lead
2. Navigate to a pending test case
3. Click "Request Edit" button
4. Try to submit without comment

**Expected Results:**
- ✅ Validation error: "Comment is required when requesting edits"
- ✅ Form does not submit

**Steps (continued):**
5. Enter comment: "Please add more detailed assertions"
6. Submit request edit

**Expected Results:**
- ✅ Review status changes to "needs_revision"
- ✅ Red "Needs Revision" badge appears
- ✅ Review appears in history with comment
- ✅ Notification created for test case creator
- ✅ WebSocket notification sent

**Validation:**
```sql
-- Check review record
SELECT action, comment FROM test_case_reviews WHERE test_case_id = (SELECT id FROM test_cases WHERE case_id = 'TC-XXXX') ORDER BY created_at DESC LIMIT 1;
-- action should be 'needs_revision', comment should not be null

-- Check notification
SELECT * FROM notifications WHERE related_entity_id = 'TC-XXXX' AND notification_type = 'review_needs_revision';
```

---

### Test 1.4: Status Reset on Update
**Requirements: 1.3, 1.4**

**Steps:**
1. Login as QA Engineer
2. Navigate to an approved test case
3. Click Edit
4. Make any change (e.g., update description)
5. Save the test case

**Expected Results:**
- ✅ Review status resets to "pending"
- ✅ Badge changes back to yellow "Pending Review"
- ✅ Previous review history is preserved

**Steps (repeat for needs_revision):**
6. Get a test case with "needs_revision" status
7. Edit and save

**Expected Results:**
- ✅ Status resets to "pending"

**Validation:**
```sql
SELECT review_status FROM test_cases WHERE case_id = 'TC-XXXX';
-- Should be 'pending' after update
```

---

## Test Suite 2: Review History

### Test 2.1: Review History Display
**Requirements: 3.1, 3.2, 3.3, 3.4**

**Steps:**
1. Login as any user
2. Navigate to a test case that has been reviewed multiple times
3. Scroll to Review History section

**Expected Results:**
- ✅ All reviews are displayed in chronological order (newest first)
- ✅ Each review shows:
  - Reviewer name
  - Review action (Approved/Needs Revision)
  - Comment (if provided)
  - Timestamp
- ✅ Different styling for approved vs needs_revision actions

**Steps (for empty history):**
4. Navigate to a test case with no reviews

**Expected Results:**
- ✅ Message displayed: "No reviews yet"

---

## Test Suite 3: Notification System

### Test 3.1: Real-time Notification Delivery
**Requirements: 4.1, 4.2, 4.3, 8.1, 8.2, 8.3**

**Setup:**
1. Open two browser windows
2. Window 1: Login as QA Engineer
3. Window 2: Login as QA Lead
4. Keep Window 1 visible to see notifications

**Steps:**
1. In Window 2 (QA Lead), approve a test case created by QA Engineer
2. Observe Window 1 (QA Engineer)

**Expected Results:**
- ✅ Notification badge updates immediately (unread count increases)
- ✅ Toast notification appears (if implemented)
- ✅ WebSocket connection is active (check browser console)

**Validation (Browser Console):**
```javascript
// Check WebSocket connection
// Should see: "WebSocket connected" or similar message
```

---

### Test 3.2: Notification Panel
**Requirements: 4.3, 4.4, 4.5, 7.2**

**Steps:**
1. Login as QA Engineer
2. Click on notification badge/icon
3. Notification panel opens

**Expected Results:**
- ✅ Panel displays list of notifications
- ✅ Each notification shows:
  - Type icon/indicator
  - Title
  - Message
  - Timestamp
  - Read/unread status
- ✅ Unread notifications are visually distinct
- ✅ Only user's own notifications are shown

**Steps:**
4. Click on a notification

**Expected Results:**
- ✅ Navigates to related test case detail page
- ✅ Notification is marked as read
- ✅ Unread count decreases

---

### Test 3.3: Mark as Read Functionality
**Requirements: 7.3**

**Steps:**
1. Open notification panel with unread notifications
2. Click "Mark as Read" on individual notification
3. Observe changes

**Expected Results:**
- ✅ Notification visual state changes to "read"
- ✅ Unread count decreases by 1

**Steps:**
4. Click "Mark All as Read" button

**Expected Results:**
- ✅ All notifications marked as read
- ✅ Unread count becomes 0
- ✅ Badge indicator disappears or shows 0

**Validation:**
```sql
SELECT is_read FROM notifications WHERE user_id = 'USER_UUID';
-- All should be true
```

---

### Test 3.4: Notification Persistence
**Requirements: 7.1, 7.4**

**Steps:**
1. Login as QA Engineer
2. Receive some notifications
3. Logout
4. Login again
5. Open notification panel

**Expected Results:**
- ✅ All previous notifications are still visible
- ✅ Unread notifications appear first
- ✅ Within each group (read/unread), sorted by timestamp descending

**Validation:**
```sql
SELECT * FROM notifications WHERE user_id = 'USER_UUID' ORDER BY is_read ASC, created_at DESC;
-- Should match UI order
```

---

### Test 3.5: Offline Notification Delivery
**Requirements: 8.5**

**Steps:**
1. Login as QA Engineer
2. Close browser (go offline)
3. Have QA Lead approve a test case
4. Login again as QA Engineer

**Expected Results:**
- ✅ Notification appears in notification panel
- ✅ Unread count reflects missed notifications
- ✅ No duplicate notifications

---

## Test Suite 4: Filter Functionality

### Test 4.1: Review Status Filters
**Requirements: 5.1, 5.2, 5.3, 5.4, 5.5**

**Setup:**
Create test cases with different statuses:
- At least 2 with "pending"
- At least 2 with "approved"
- At least 2 with "needs_revision"

**Steps:**
1. Navigate to Test Cases list
2. Verify filter dropdown/tabs are visible
3. Select "Pending" filter

**Expected Results:**
- ✅ Only test cases with "pending" status are displayed
- ✅ Count matches expected number

**Steps:**
4. Select "Approved" filter

**Expected Results:**
- ✅ Only approved test cases are displayed

**Steps:**
5. Select "Needs Revision" filter

**Expected Results:**
- ✅ Only test cases needing revision are displayed

**Steps:**
6. Select "All" filter

**Expected Results:**
- ✅ All test cases are displayed regardless of status
- ✅ Total count matches sum of all statuses

**Validation:**
```sql
-- Verify counts
SELECT review_status, COUNT(*) FROM test_cases GROUP BY review_status;
```

---

## Test Suite 5: UI Responsiveness and Error Handling

### Test 5.1: Review Status Badges
**Requirements: 6.1, 6.2, 6.3, 6.4**

**Steps:**
1. Navigate to Test Cases list
2. Observe badges for different test cases

**Expected Results:**
- ✅ Pending: Yellow badge with "Pending Review" text
- ✅ Approved: Green badge with "Approved" text
- ✅ Needs Revision: Red badge with "Needs Revision" text
- ✅ Badges are clearly visible and properly styled

---

### Test 5.2: Loading States

**Steps:**
1. Navigate to test case detail with slow network (throttle in DevTools)
2. Observe loading states

**Expected Results:**
- ✅ Loading indicators appear while fetching data
- ✅ Review section shows loading state
- ✅ Review history shows loading state
- ✅ No broken UI during loading

---

### Test 5.3: Error Handling - Invalid Review

**Steps:**
1. Login as QA Engineer (not QA Lead)
2. Try to access review functionality (if exposed)

**Expected Results:**
- ✅ Review section is not visible to non-QA Lead users
- ✅ If API is called directly, returns 403 Forbidden

**Steps:**
3. Login as QA Lead
4. Try to review own test case

**Expected Results:**
- ✅ Error message: "Cannot review your own test case"
- ✅ Review not created

---

### Test 5.4: Error Handling - Network Failures

**Steps:**
1. Disconnect network
2. Try to submit a review
3. Observe error handling

**Expected Results:**
- ✅ Error message displayed to user
- ✅ UI remains functional
- ✅ Can retry after network restored

---

### Test 5.5: WebSocket Reconnection
**Requirements: 8.4**

**Steps:**
1. Login and establish WebSocket connection
2. Stop backend server
3. Observe browser console
4. Restart backend server
5. Wait for reconnection

**Expected Results:**
- ✅ Connection loss is detected
- ✅ Automatic reconnection attempts occur
- ✅ Connection re-established when server available
- ✅ No duplicate connections created

---

## Test Suite 6: Permission Enforcement

### Test 6.1: QA Lead Permissions

**Steps:**
1. Login as QA Lead
2. Navigate to any test case detail

**Expected Results:**
- ✅ Review Section is visible
- ✅ Can approve test cases
- ✅ Can request edits

---

### Test 6.2: QA Engineer Permissions

**Steps:**
1. Login as QA Engineer
2. Navigate to test case detail

**Expected Results:**
- ✅ Review Section is NOT visible
- ✅ Can view review history
- ✅ Can see review status badges

---

### Test 6.3: Self-Review Prevention

**Steps:**
1. Login as QA Lead
2. Create a test case as QA Lead
3. Try to review own test case

**Expected Results:**
- ✅ Review section either hidden or disabled
- ✅ If attempted via API, returns error
- ✅ Error message: "Cannot review your own test case"

---

### Test 6.4: Notification Access Control

**Steps:**
1. Login as User A
2. Note notification IDs from database
3. Try to access User B's notification via API

**Expected Results:**
- ✅ Returns 403 Forbidden
- ✅ Cannot mark other user's notifications as read
- ✅ Cannot view other user's notifications

---

## Test Suite 7: WebSocket Authentication

### Test 7.1: Valid Token Authentication
**Requirements: 8.2**

**Steps:**
1. Login with valid credentials
2. Observe WebSocket connection in browser DevTools

**Expected Results:**
- ✅ WebSocket connection established
- ✅ JWT token sent during connection
- ✅ Connection accepted

---

### Test 7.2: Invalid Token Rejection

**Steps:**
1. Modify WebSocket connection code to send invalid token
2. Attempt connection

**Expected Results:**
- ✅ Connection rejected
- ✅ Error code 4001 or similar
- ✅ Error message indicates authentication failure

---

### Test 7.3: Expired Token Handling

**Steps:**
1. Login and establish connection
2. Wait for token to expire (or manually expire)
3. Observe behavior

**Expected Results:**
- ✅ Connection closes gracefully
- ✅ User prompted to re-authenticate
- ✅ New connection established after re-login

---

## Performance Tests

### Test P.1: Multiple Concurrent Reviews

**Steps:**
1. Have 3-5 QA Leads review different test cases simultaneously
2. Observe system behavior

**Expected Results:**
- ✅ All reviews processed correctly
- ✅ No race conditions
- ✅ All notifications delivered
- ✅ Database consistency maintained

---

### Test P.2: Notification Load

**Steps:**
1. Create 50+ notifications for a single user
2. Open notification panel
3. Scroll through notifications

**Expected Results:**
- ✅ Pagination works correctly
- ✅ UI remains responsive
- ✅ No performance degradation

---

## Database Integrity Tests

### Test D.1: Cascade Deletes

**Steps:**
1. Create test case with reviews
2. Delete test case

**Expected Results:**
- ✅ Test case deleted
- ✅ Associated reviews deleted (CASCADE)
- ✅ No orphaned records

**Validation:**
```sql
SELECT * FROM test_case_reviews WHERE test_case_id = 'DELETED_UUID';
-- Should return 0 rows
```

---

### Test D.2: Transaction Integrity

**Steps:**
1. Submit review that should create notification
2. Simulate database error during notification creation
3. Check database state

**Expected Results:**
- ✅ Either both review and notification created, or neither
- ✅ No partial state
- ✅ Transaction rolled back on error

---

## Regression Tests

### Test R.1: Existing Functionality

**Steps:**
1. Verify all existing test case functionality still works:
   - Create test case
   - Edit test case
   - Delete test case
   - Run test case
   - View test results

**Expected Results:**
- ✅ All existing features work as before
- ✅ No breaking changes introduced

---

## Test Completion Checklist

- [ ] All Test Suite 1 tests passed
- [ ] All Test Suite 2 tests passed
- [ ] All Test Suite 3 tests passed
- [ ] All Test Suite 4 tests passed
- [ ] All Test Suite 5 tests passed
- [ ] All Test Suite 6 tests passed
- [ ] All Test Suite 7 tests passed
- [ ] Performance tests passed
- [ ] Database integrity tests passed
- [ ] Regression tests passed
- [ ] All requirements validated
- [ ] No critical bugs found
- [ ] UI is responsive and user-friendly
- [ ] Error messages are clear and helpful
- [ ] Documentation is complete

---

## Known Issues / Notes

Document any issues found during testing:

1. Issue: [Description]
   - Severity: Critical/High/Medium/Low
   - Steps to reproduce:
   - Expected vs Actual:
   - Status: Open/Fixed/Won't Fix

---

## Sign-off

**Tested by:** _______________
**Date:** _______________
**Version:** _______________
**Status:** Pass / Fail / Pass with Issues

