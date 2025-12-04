# Review Queue API Documentation

## Overview
Endpoint khusus untuk mengelola review queue dengan pagination, filtering, dan search yang di-handle di backend untuk performa optimal.

---

## Endpoints

### 1. Get Review Stats
Mendapatkan statistik review untuk semua status.

**Endpoint**: `GET /reviews/stats`

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "pending": 5,
  "pendingRevision": 2,
  "approved": 10,
  "needsRevision": 3
}
```

---

### 2. Get Review Queue
Mendapatkan daftar test cases untuk review dengan pagination dan filtering.

**Endpoint**: `GET /reviews/queue`

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | string | Yes | - | Review status: 'pending', 'approved', 'needs_revision' |
| `search` | string | No | - | Search by title, case_id, or creator name |
| `priority` | string | No | 'all' | Priority filter: 'critical', 'high', 'medium', 'low', 'all' |
| `suite` | string | No | 'all' | Suite filter or 'all' |
| `page` | number | No | 1 | Page number (starts from 1) |

**Response**:
```json
{
  "items": [
    {
      "caseId": "TC-0001",
      "title": "Test Login Functionality",
      "suite": "Authentication",
      "priority": "High",
      "caseType": "Functional",
      "automation": "Manual",
      "lastStatus": "pending",
      "pageLoadAvg": null,
      "lastRun": null,
      "executionOrder": 1.0,
      "updatedAt": "2024-12-04T10:00:00Z",
      "reviewStatus": "pending",
      "createdByName": "John Doe"
    }
  ],
  "total": 25,
  "page": 1,
  "pageSize": 10,
  "availableSuites": ["Authentication", "Dashboard", "Reports"]
}
```

**Notes**:
- Page size is fixed at 10 items per page
- When `status=pending`, backend automatically includes both 'pending' and 'pending_revision' items
- Items are sorted: pending first, then by oldest (updatedAt ASC)

---

## Implementation Details

### Backend (Rust)

#### File Structure
```
backend/src/
├── handlers/
│   └── review.rs          # Review endpoints
└── models/
    └── review.rs          # Review models
```

#### Key Models

**ReviewStats**:
```rust
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReviewStats {
    pub pending: i64,
    pub pending_revision: i64,
    pub approved: i64,
    pub needs_revision: i64,
}
```

**ReviewQueueQuery**:
```rust
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReviewQueueQuery {
    pub status: Option<String>,
    pub search: Option<String>,
    pub priority: Option<String>,
    pub suite: Option<String>,
    pub page: Option<i32>,
}
```

**ReviewQueueItem**:
```rust
#[derive(Debug, Clone, FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReviewQueueItem {
    pub case_id: String,
    pub title: String,
    pub suite: String,
    pub priority: String,
    pub case_type: String,
    pub automation: String,
    pub last_status: String,
    pub page_load_avg: Option<String>,
    pub last_run: Option<String>,
    pub execution_order: f64,
    pub updated_at: DateTime<Utc>,
    pub review_status: String,
    pub created_by_name: Option<String>,
}
```

**ReviewQueueResponse**:
```rust
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReviewQueueResponse {
    pub items: Vec<ReviewQueueItem>,
    pub total: i64,
    pub page: i32,
    pub page_size: i32,
    pub available_suites: Vec<String>,
}
```

#### SQL Query Logic

For `status=pending`:
```sql
WHERE (review_status = 'pending' OR review_status = 'pending_revision')
  AND [other filters...]
ORDER BY 
  CASE WHEN review_status = 'pending' THEN 0 ELSE 1 END,
  updated_at ASC
LIMIT 10 OFFSET [offset]
```

For other statuses:
```sql
WHERE review_status = [status]
  AND [other filters...]
ORDER BY updated_at ASC
LIMIT 10 OFFSET [offset]
```

### Frontend (React/TypeScript)

#### Service Layer
**File**: `src/services/review-service.ts`

```typescript
interface ReviewQueueParams {
  status: string;
  search?: string;
  priority?: string;
  suite?: string;
  page?: number;
}

interface ReviewQueueResponse {
  items: ReviewQueueItem[];
  total: number;
  page: number;
  pageSize: number;
  availableSuites: string[];
}

async getReviewQueue(params: ReviewQueueParams): Promise<ReviewQueueResponse>
```

#### Component
**File**: `src/components/TestCaseReviewQueue.tsx`

**Features**:
- Lazy loading with Intersection Observer
- Auto-load next page on scroll
- Filter changes trigger new API call with page reset
- Real-time updates via WebSocket
- Stats card click changes filter and refetches data

**State Management**:
```typescript
const [testCases, setTestCases] = useState<ReviewQueueItem[]>([]);
const [currentPage, setCurrentPage] = useState(1);
const [totalItems, setTotalItems] = useState(0);
const [hasMore, setHasMore] = useState(false);
const [isLoadingMore, setIsLoadingMore] = useState(false);
```

---

## Usage Examples

### Example 1: Get Pending Reviews
```bash
curl -X GET "http://localhost:8080/reviews/queue?status=pending&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 2: Filter by Priority
```bash
curl -X GET "http://localhost:8080/reviews/queue?status=pending&priority=high&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 3: Search Test Cases
```bash
curl -X GET "http://localhost:8080/reviews/queue?status=approved&search=login&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 4: Combined Filters
```bash
curl -X GET "http://localhost:8080/reviews/queue?status=pending&priority=high&suite=Authentication&search=test&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 5: Pagination
```bash
# Page 1 (items 1-10)
curl -X GET "http://localhost:8080/reviews/queue?status=pending&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Page 2 (items 11-20)
curl -X GET "http://localhost:8080/reviews/queue?status=pending&page=2" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Frontend Flow

### Initial Load
```
1. User opens Review Queue page
2. Component fetches page 1 with current filters
3. Display 10 items
4. Show "Loading more..." if hasMore = true
```

### Lazy Loading
```
1. User scrolls to bottom
2. Intersection Observer triggers
3. Fetch next page (currentPage + 1)
4. Append new items to existing list
5. Update hasMore flag
6. Repeat until all items loaded
```

### Filter Change
```
1. User changes filter (status/priority/suite/search)
2. Reset currentPage to 1
3. Clear existing testCases array
4. Fetch page 1 with new filters
5. Display new results
```

### Stats Card Click
```
1. User clicks stats card (e.g., "Pending Review")
2. Update filterStatus state
3. Save to localStorage
4. Reset currentPage to 1
5. Clear existing testCases array
6. Fetch page 1 with new status
```

### WebSocket Update
```
1. Backend broadcasts review_stats_update
2. Frontend receives message
3. Update stats state
4. Reset currentPage to 1
5. Clear existing testCases array
6. Refetch page 1 to get latest data
```

---

## Testing Guide

### Manual Testing Checklist

#### Basic Functionality
- [ ] Load review queue page
- [ ] Verify 10 items displayed initially
- [ ] Scroll to bottom, verify next 10 items load
- [ ] Continue scrolling until all items loaded

#### Stats Cards
- [ ] Click "Pending Review" → Shows pending + pending_revision
- [ ] Click "Approved" → Shows approved items
- [ ] Click "Needs Revision" → Shows needs_revision items
- [ ] Verify counts match stats

#### Filters
- [ ] Search by title → Results match search term
- [ ] Search by case ID → Results match ID
- [ ] Search by creator name → Results match creator
- [ ] Select priority → Only selected priority shown
- [ ] Select suite → Only selected suite shown
- [ ] Combine filters → All filters applied correctly

#### Pagination
- [ ] Page 1 shows items 1-10
- [ ] Page 2 shows items 11-20
- [ ] Last page shows remaining items
- [ ] No duplicate items across pages

#### Real-time Updates
- [ ] Open two browser windows
- [ ] Review a test case in window 1
- [ ] Verify stats update in window 2
- [ ] Verify list refreshes in window 2

#### Edge Cases
- [ ] Empty results → Shows "No test cases found"
- [ ] Search with no matches → Shows empty state
- [ ] Invalid page number → Returns empty items
- [ ] Special characters in search → Handles correctly

### API Testing

#### Test Stats Endpoint
```bash
curl -X GET "http://localhost:8080/reviews/stats" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq
```

Expected: Valid ReviewStats object

#### Test Queue Endpoint
```bash
curl -X GET "http://localhost:8080/reviews/queue?status=pending&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq
```

Expected: Valid ReviewQueueResponse with 10 items

#### Test Filters
```bash
# Priority filter
curl -X GET "http://localhost:8080/reviews/queue?status=pending&priority=high" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.items[].priority'

# Should only show "High" priority items

# Suite filter
curl -X GET "http://localhost:8080/reviews/queue?status=pending&suite=Authentication" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.items[].suite'

# Should only show "Authentication" suite items
```

---

## Performance Considerations

### Backend
- Fixed page size (10 items) prevents large data transfers
- Database indexes on `review_status`, `priority`, `suite`, `updated_at`
- Dynamic query building with parameter binding prevents SQL injection
- Efficient sorting with CASE statement

### Frontend
- Lazy loading reduces initial render time
- Intersection Observer is more efficient than scroll event listeners
- Filter changes clear existing data to prevent memory leaks
- WebSocket updates trigger targeted refetch, not full page reload

---

## Troubleshooting

### Issue: Empty Results
**Symptoms**: API returns empty items array

**Solutions**:
1. Check if test cases exist in database
2. Verify review_status values are correct ('pending', 'approved', etc.)
3. Check filter parameters are valid
4. Test without filters first

### Issue: Pagination Not Working
**Symptoms**: Same items appear on different pages

**Solutions**:
1. Verify page parameter is being sent correctly
2. Check total count in response
3. Ensure pageSize is 10
4. Check sorting is consistent

### Issue: Search Not Working
**Symptoms**: Search returns no results or wrong results

**Solutions**:
1. Check URL encoding of search term
2. Verify search is case-insensitive (ILIKE in SQL)
3. Test with simple search terms first
4. Check if search term exists in title/case_id/creator_name

### Issue: WebSocket Not Updating
**Symptoms**: Stats don't update in real-time

**Solutions**:
1. Check WebSocket connection in browser console
2. Verify backend is broadcasting review_stats_update
3. Check message payload structure (should have 'payload' field)
4. Ensure frontend onMessage handler is registered

### Issue: Slow Performance
**Symptoms**: API takes long time to respond

**Solutions**:
1. Check database indexes exist
2. Verify query is using indexes (EXPLAIN ANALYZE)
3. Reduce page size if needed
4. Consider caching for stats endpoint

---

## Future Enhancements

### Potential Improvements
1. **Configurable Page Size**: Allow frontend to specify page size
2. **Sorting Options**: Allow sorting by different fields
3. **Bulk Actions**: Select multiple items for bulk review
4. **Export**: Export filtered results to CSV/Excel
5. **Advanced Filters**: Date range, multiple priorities, etc.
6. **Saved Filters**: Save and load filter presets
7. **Review Assignment**: Assign specific reviewers to test cases

### API Versioning
Consider versioning the API for future breaking changes:
- `/v1/reviews/queue`
- `/v2/reviews/queue`

---

## Related Documentation
- [Review System Overview](./REVIEW_SYSTEM.md)
- [WebSocket Integration](./WEBSOCKET.md)
- [Test Case Management](./TEST_CASE_MANAGEMENT.md)
- [API Authentication](./AUTHENTICATION.md)
