# Quick Start Guide - Test Case Review System Testing

Get up and running with integration testing in 5 minutes.

---

## Step 1: Verify Implementation (30 seconds)

```bash
# Run the verification script
./.kiro/specs/test-case-review/verify-implementation.sh
```

**Expected:** ✅ All 53 checks should pass

---

## Step 2: Start the System (1 minute)

### Terminal 1 - Backend
```bash
cd backend
./start-services.sh
```

**Expected:** 
- PostgreSQL starts
- Backend server starts on configured port
- "Server running on http://..." message appears

### Terminal 2 - Frontend
```bash
pnpm dev
```

**Expected:**
- Vite dev server starts
- "Local: http://localhost:5173" message appears

---

## Step 3: Verify Database (30 seconds)

```bash
# Connect to database
psql -U <username> -d <database>

# Check tables exist
\dt

# Should see:
# - test_case_reviews
# - notifications
# - test_cases (with review_status column)

# Exit
\q
```

---

## Step 4: Create Test Users (1 minute)

You need at least 2 users:

### Option A: Use existing users
Check if you already have users with these roles:
```sql
SELECT id, email, name, role FROM users WHERE role IN ('QA Engineer', 'QA Lead');
```

### Option B: Create new users
Use the user management interface in the application:
1. Login as admin
2. Go to User Management
3. Create:
   - User 1: QA Engineer role
   - User 2: QA Lead role

---

## Step 5: Run Quick Tests (2 minutes)

Open the [Quick Test Checklist](./QUICK_TEST_CHECKLIST.md) and run through the core workflow:

### Test 1: Create Test Case
1. Login as QA Engineer
2. Create new test case
3. ✅ Verify "Pending Review" badge (yellow)

### Test 2: Approve Test Case
1. Login as QA Lead
2. Open the test case
3. Click "Approve"
4. ✅ Verify "Approved" badge (green)
5. ✅ Verify notification sent to QA Engineer

### Test 3: Request Edit
1. Create another test case as QA Engineer
2. Login as QA Lead
3. Click "Request Edit"
4. Try without comment → ✅ Error shown
5. Add comment and submit
6. ✅ Verify "Needs Revision" badge (red)
7. ✅ Verify notification sent

### Test 4: Status Reset
1. Login as QA Engineer
2. Edit the approved test case
3. Save changes
4. ✅ Verify status resets to "Pending Review"

### Test 5: Filters
1. Go to test cases list
2. Try each filter:
   - Pending → ✅ Only pending shown
   - Approved → ✅ Only approved shown
   - Needs Revision → ✅ Only needs revision shown
   - All → ✅ All shown

---

## Step 6: Test Notifications (1 minute)

### Real-time Delivery
1. Open two browsers
2. Browser 1: Login as QA Engineer
3. Browser 2: Login as QA Lead
4. Browser 2: Approve a test case
5. Browser 1: ✅ Notification appears immediately

### Notification Panel
1. Click notification badge
2. ✅ Panel opens with notifications
3. Click a notification
4. ✅ Navigates to test case
5. ✅ Notification marked as read

---

## Step 7: Test WebSocket (30 seconds)

### Connection
1. Login to application
2. Open browser DevTools (F12)
3. Go to Console tab
4. ✅ Look for "WebSocket connected" or similar message

### Reconnection
1. Stop backend server
2. ✅ Console shows connection lost
3. Start backend server
4. ✅ Console shows reconnected

---

## Troubleshooting

### Backend won't start
```bash
# Check if port is already in use
lsof -i :8080  # or your configured port

# Check PostgreSQL is running
pg_isready

# Check logs
tail -f backend/logs/backend.log
```

### Frontend won't start
```bash
# Clear node modules and reinstall
rm -rf node_modules
pnpm install

# Check for port conflicts
lsof -i :5173
```

### Database connection fails
```bash
# Check PostgreSQL is running
brew services list | grep postgresql  # macOS
systemctl status postgresql           # Linux

# Check connection string in .env
cat backend/.env | grep DATABASE_URL
```

### WebSocket not connecting
1. Check browser console for errors
2. Verify backend WebSocket endpoint is accessible
3. Check JWT token is valid
4. Try refreshing the page

### Notifications not appearing
1. Check WebSocket is connected (browser console)
2. Verify notification was created in database:
   ```sql
   SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;
   ```
3. Check user_id matches logged-in user
4. Try refreshing the page

---

## Quick Verification Queries

### Check review status distribution
```sql
SELECT review_status, COUNT(*) 
FROM test_cases 
GROUP BY review_status;
```

### Check recent reviews
```sql
SELECT tc.case_id, tcr.action, u.name as reviewer, tcr.created_at
FROM test_case_reviews tcr
JOIN test_cases tc ON tcr.test_case_id = tc.id
JOIN users u ON tcr.reviewer_id = u.id
ORDER BY tcr.created_at DESC
LIMIT 10;
```

### Check recent notifications
```sql
SELECT u.name, n.notification_type, n.title, n.created_at, n.is_read
FROM notifications n
JOIN users u ON n.user_id = u.id
ORDER BY n.created_at DESC
LIMIT 10;
```

### Check WebSocket activity (if logged)
```sql
-- This depends on your logging setup
-- Check backend logs for WebSocket connections
tail -f backend/logs/backend.log | grep -i websocket
```

---

## Success Criteria

After completing these steps, you should have:

- ✅ Backend and frontend running
- ✅ Database tables created and accessible
- ✅ Test users created (QA Engineer and QA Lead)
- ✅ Test case created with "Pending Review" status
- ✅ Test case approved with "Approved" status
- ✅ Test case with "Needs Revision" status
- ✅ Notifications sent and received
- ✅ WebSocket connection established
- ✅ Filters working correctly
- ✅ Review history displaying correctly

---

## Next Steps

### If all tests passed ✅
Proceed to comprehensive testing:
1. Open [Integration Test Guide](./INTEGRATION_TEST_GUIDE.md)
2. Execute all 28 integration tests
3. Document any issues found
4. Review [Polish Recommendations](./POLISH_RECOMMENDATIONS.md)

### If tests failed ❌
1. Document the failure in [Quick Test Checklist](./QUICK_TEST_CHECKLIST.md)
2. Check troubleshooting section above
3. Review relevant code in:
   - Backend: `backend/src/handlers/`
   - Frontend: `src/components/` and `src/services/`
4. Check browser console and backend logs for errors

---

## Getting Help

### Documentation
- [README](./README.md) - Documentation index
- [Design](./design.md) - System architecture
- [Requirements](./requirements.md) - Feature requirements

### Logs
- Backend: `backend/logs/backend.log`
- Frontend: Browser DevTools Console
- Database: PostgreSQL logs

### Common Issues
See [Integration Test Guide](./INTEGRATION_TEST_GUIDE.md) - Error Handling section

---

**Estimated Time:** 5-10 minutes for quick start  
**Full Testing Time:** 1-2 hours for comprehensive testing

Good luck! 🚀

