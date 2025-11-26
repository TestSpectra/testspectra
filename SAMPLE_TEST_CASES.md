# 📋 Sample Test Cases - Comprehensive Examples

Script lokasi: `/tmp/create_sample_test_cases.sh`

## 🎯 Coverage Summary

### ✅ 4 Test Cases Created

1. **TC-0006**: E2E Login dengan Email dan Password - Comprehensive Flow
2. **TC-0007**: Mobile Product Search dengan Filter dan Sort  
3. **TC-0008**: Form Submission dengan Validasi dan Drag-Drop Upload
4. **TC-0009**: Multi-Page Navigation dengan Back, Refresh, dan Keyboard Shortcuts

---

## 📊 Action Types Coverage (16/16)

| Action Type | Test Case | Description |
|-------------|-----------|-------------|
| `navigate` | TC-0006, TC-0008, TC-0009 | Navigate to URL |
| `click` | TC-0006, TC-0007, TC-0009 | Click/Tap element |
| `type` | TC-0006, TC-0007, TC-0008 | Type text into input |
| `clear` | TC-0008 | Clear input field |
| `select` | TC-0007, TC-0008 | Select dropdown option |
| `scroll` | TC-0007, TC-0009 | Scroll page/element |
| `swipe` | TC-0007 | Mobile swipe gesture |
| `wait` | TC-0008 | Wait for duration |
| `waitForElement` | TC-0006 | Wait for element to appear |
| `pressKey` | TC-0007, TC-0009 | Press keyboard key |
| `longPress` | TC-0007 | Long press/hold |
| `doubleTap` | TC-0007 | Double click/tap |
| `hover` | TC-0006 | Hover over element |
| `dragDrop` | TC-0008 | Drag and drop |
| `back` | TC-0009 | Browser back button |
| `refresh` | TC-0009 | Refresh page |

---

## ✅ Assertion Types Coverage (18/18)

| Assertion Type | Test Case | Needs Selector | Needs Value | Needs Attribute |
|----------------|-----------|----------------|-------------|-----------------|
| `elementDisplayed` | All | ✓ | - | - |
| `elementNotDisplayed` | TC-0008, TC-0009 | ✓ | - | - |
| `elementExists` | TC-0006 | ✓ | - | - |
| `elementClickable` | TC-0006 | ✓ | - | - |
| `elementInViewport` | TC-0007, TC-0009 | ✓ | - | - |
| `textEquals` | TC-0008 | ✓ | ✓ | - |
| `textContains` | TC-0006, TC-0007 | ✓ | ✓ | - |
| `valueEquals` | TC-0006, TC-0007, TC-0008 | ✓ | ✓ | - |
| `valueContains` | TC-0006 | ✓ | ✓ | - |
| `urlEquals` | TC-0006, TC-0009 | - | ✓ | - |
| `urlContains` | TC-0006, TC-0007, TC-0009 | - | ✓ | - |
| `titleEquals` | TC-0009 | - | ✓ | - |
| `titleContains` | TC-0006 | - | ✓ | - |
| `hasClass` | TC-0006, TC-0007, TC-0008 | ✓ | ✓ | - |
| `hasAttribute` | TC-0006, TC-0009 | ✓ | - | ✓ |
| `isEnabled` | TC-0006, TC-0008 | ✓ | - | - |
| `isDisabled` | TC-0008 | ✓ | - | - |
| `isSelected` | TC-0007, TC-0008 | ✓ | - | - |

---

## 📝 Test Case Details

### 1️⃣ TC-0006: E2E Login Flow
**Suite:** Authentication  
**Priority:** Critical  
**Type:** Positive  
**Automation:** Automated  
**Steps:** 8

**Highlights:**
- ✅ Pre-condition & Post-condition (rich text HTML)
- ✅ Multiple assertions per step
- ✅ Custom expected result per step
- ✅ Web-focused actions (navigate, click, type, hover, waitForElement)

**Action Flow:**
```
1. navigate → Login page
2. waitForElement → Email input visible
3. click → Focus email input
4. type → Enter email
5. type → Enter password
6. hover → Login button
7. click → Submit login
8. waitForElement → Dashboard loaded
```

---

### 2️⃣ TC-0007: Mobile Product Search
**Suite:** E-Commerce  
**Priority:** High  
**Type:** Positive  
**Automation:** Automated  
**Steps:** 8

**Highlights:**
- ✅ Mobile-specific actions (swipe, longPress, doubleTap)
- ✅ Mixed assertions (visibility, selection, viewport)
- ✅ Rich text pre/post conditions

**Action Flow:**
```
1. click → Open search
2. type → Search query
3. pressKey → Submit search
4. scroll → Load more products
5. swipe → Open filter panel
6. select → Filter by price
7. longPress → Quick actions menu
8. doubleTap → Add to favorites
```

---

### 3️⃣ TC-0008: Form Interaction
**Suite:** User Registration  
**Priority:** Medium  
**Type:** Positive  
**Automation:** Automated  
**Steps:** 8

**Highlights:**
- ✅ Form manipulation (type, clear, select)
- ✅ Drag & Drop file upload
- ✅ Validation checks (enabled/disabled states)
- ✅ Complex assertions

**Action Flow:**
```
1. navigate → Register page
2. type → Enter fullname
3. clear → Clear fullname
4. type → Re-enter fullname
5. select → Choose country
6. dragDrop → Upload file
7. wait → Form validation
8. click → Submit form
```

---

### 4️⃣ TC-0009: Browser Navigation
**Suite:** Navigation  
**Priority:** Low  
**Type:** Edge  
**Automation:** Manual  
**Steps:** 8

**Highlights:**
- ✅ Browser controls (back, refresh)
- ✅ Keyboard shortcuts (F5, Ctrl+K, Escape)
- ✅ URL & Title assertions
- ✅ Tags included

**Action Flow:**
```
1. navigate → Homepage
2. click → Navigate to products
3. scroll → Scroll to footer
4. back → Browser back
5. pressKey → F5 refresh
6. refresh → Programmatic refresh
7. pressKey → Ctrl+K (search modal)
8. pressKey → Escape (close modal)
```

---

## 🎨 Field Coverage

### All Test Cases Include:
- ✅ **Title** (descriptive dan lengkap)
- ✅ **Suite** (berbeda-beda: Authentication, E-Commerce, User Registration, Navigation)
- ✅ **Priority** (Critical, High, Medium, Low - semua ter-cover)
- ✅ **Case Type** (Positive, Edge)
- ✅ **Automation Status** (Automated, Manual)
- ✅ **Pre-Condition** (rich text HTML dengan ordered/unordered list)
- ✅ **Post-Condition** (rich text HTML)
- ✅ **Steps** (8 steps per test case)
  - ✅ Step Order (sequential)
  - ✅ Action Type (varied)
  - ✅ Action Params (object dengan dynamic properties)
  - ✅ Assertions (array, multiple per step)
  - ✅ Custom Expected Result (rich text HTML)
- ✅ **Tags** (TC-0009)

---

## 🚀 How to Use

### Create Sample Data
```bash
# Run the script
chmod +x /tmp/create_sample_test_cases.sh
/tmp/create_sample_test_cases.sh
```

### View in Application
1. Open application: `http://localhost:5173`
2. Navigate to **Dashboard** - recent test cases akan muncul
3. Click test case untuk melihat **Detail Page**
4. Click **Edit** untuk melihat form dengan data lengkap
5. Explore **Test Cases List** untuk melihat semua test cases

### Verify Data
```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@testspectra.com","password":"Admin123!"}' \
  | jq -r '.accessToken')

# View specific test case
curl -s http://localhost:3000/api/test-cases/TC-0006 \
  -H "Authorization: Bearer $TOKEN" | jq .

# List all test cases
curl -s "http://localhost:3000/api/test-cases?page=1&pageSize=20" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## 🎯 Testing Checklist

### Dashboard
- [ ] Recent test cases muncul (TC-0006 sampai TC-0009)
- [ ] Suite badge displayed
- [ ] Author name visible
- [ ] Time ago correct

### Test Case Detail Page
- [ ] Pre-condition rendered (HTML formatting preserved)
- [ ] Post-condition rendered
- [ ] All 8 steps displayed
- [ ] Action type labels correct
- [ ] Action parameters shown
- [ ] Assertions displayed per step
- [ ] Custom expected result rendered (HTML)
- [ ] Metadata (created by, timestamps) correct

### Edit Mode
- [ ] Form pre-filled dengan data existing
- [ ] All steps loaded correctly
- [ ] Action params mapped ke form fields
- [ ] Assertions loaded per step
- [ ] Rich text editors show HTML content
- [ ] Can drag & drop reorder steps

### Save/Update
- [ ] Edit test case → modify → save → verify changes
- [ ] All fields persist correctly
- [ ] Steps order maintained
- [ ] Assertions preserved

---

## 📦 Data Structure Example

### Frontend Action Format:
```typescript
{
  id: "step-1",
  type: "click",
  selector: "#button",
  assertions: [
    { id: "a1", type: "elementDisplayed", selector: ".modal" }
  ],
  customExpectedResult: "<p>Modal opened</p>"
}
```

### Backend Step Format:
```json
{
  "stepOrder": 1,
  "actionType": "click",
  "actionParams": { "selector": "#button" },
  "assertions": [
    {
      "assertionType": "elementDisplayed",
      "selector": ".modal",
      "expectedValue": null,
      "attribute": null
    }
  ],
  "customExpectedResult": "<p>Modal opened</p>"
}
```

---

## ✨ Best Practices Demonstrated

1. **Rich Text Fields**: Pre/post conditions use HTML formatting (lists, bold, italic)
2. **Multiple Assertions**: Each step can have multiple assertions
3. **Dynamic Action Params**: Different actions have different parameters
4. **Assertion Validation**: Assertions respect their action context
5. **Custom Expected Results**: Rich text per step for detailed expectations
6. **Complete Coverage**: All action and assertion types represented
7. **Real-world Scenarios**: Test cases mimic actual testing workflows

---

**Created:** November 26, 2025  
**Backend API:** http://localhost:3000  
**Frontend:** http://localhost:5173
