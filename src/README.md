# TestSpectra - QA Automation Platform

> **Platform desktop berbasis Tauri/TypeScript untuk mengelola seluruh lifecycle QA automation**, mencakup Test Case Management (TCM), Configuration Management, Test Execution, Reporting, dan Role-Based Access Control (RBAC).

---

## 📋 Table of Contents

- [Overview](#overview)
- [Design System](#design-system)
- [Architecture](#architecture)
- [Core Features](#core-features)
  - [1. Authentication & User Management](#1-authentication--user-management)
  - [2. Dashboard](#2-dashboard)
  - [3. Test Case Management](#3-test-case-management)
  - [4. Test Execution & Reporting](#4-test-execution--reporting)
  - [5. Configuration Management](#5-configuration-management)
  - [6. Tools Module](#6-tools-module)
  - [7. Git Profile Integration](#7-git-profile-integration)
  - [8. Role-Based Access Control (RBAC)](#8-role-based-access-control-rbac)
- [File Structure](#file-structure)
- [Data Models](#data-models)
- [Navigation Flow](#navigation-flow)
- [Technologies Used](#technologies-used)

---

## Overview

**TestSpectra** adalah platform komprehensif untuk QA automation yang dirancang untuk tim QA, Developer, Product Manager, dan stakeholder lainnya. Platform ini menyediakan:

- **Centralized Test Case Management** dengan action-based steps (bukan Gherkin)
- **Multi-platform Test Configuration** (Web, Android, iOS, API, Load Testing)
- **Built-in Tools** untuk Web Inspector dan Appium Inspector
- **Advanced RBAC** dengan 7 roles dan custom permissions
- **Real-time Dashboard** dengan visualisasi tren dan statistik
- **Git Integration** untuk otomatis deteksi user profile dari Git config lokal

---

## Design System

### Color Scheme (Dark Mode)

Platform menggunakan **dark mode** dengan skema warna:

| Purpose | Color | CSS Class |
|---------|-------|-----------|
| **Background** | Dark Blue-Gray | `bg-slate-950`, `bg-slate-900`, `bg-slate-800` |
| **Success** | Green | `text-green-400`, `bg-green-500/20` |
| **Error/Failed** | Red | `text-red-400`, `bg-red-500/20` |
| **Primary Action** | Teal | `text-teal-400`, `bg-teal-500` |
| **Secondary Action** | Orange | `text-orange-400`, `bg-orange-500` |
| **Info/Links** | Blue | `text-blue-400`, `bg-blue-500` |

**Source:** `/styles/globals.css`

---

## Architecture

### Main Application Entry Point

**File:** `/App.tsx`

```typescript
// Core state management
- isAuthenticated: boolean
- currentUser: User | null
- currentView: View (dashboard | test-cases | configuration | tools | etc)
- selectedTestCase: TestCase | null
- selectedReport: Report | null
```

**Key Responsibilities:**
1. **Authentication flow** - Handle login/logout
2. **View routing** - Manage navigation between modules
3. **State management** - Centralized state untuk selected data
4. **Auto-scroll** - Smooth scroll to top pada view change
5. **Navigation history** - Track previousView untuk smart back navigation

**Key Functions:**
- `handleLogin()` - Mock authentication dengan MOCK_USERS
- `handleLogout()` - Clear session
- `handleViewChange()` - Switch between modules
- `handleViewDetail()` - Polymorphic handler (accepts ID string or full object)
- `handleSaveTestCase()` - Return to previous view after save

---

## Core Features

### 1. Authentication & User Management

#### 1.1 Login Page

**File:** `/components/LoginPage.tsx`

**Features:**
- Email/password authentication form
- Mock authentication menggunakan MOCK_USERS database
- Responsive design dengan gradient background
- Error handling untuk invalid credentials

**Mock Users:**
```typescript
// File: /App.tsx (lines 20-102)
MOCK_USERS = [
  { email: 'ahmad.rizki@company.com', role: 'admin' },
  { email: 'siti.nurhaliza@company.com', role: 'qa_lead' },
  { email: 'budi.santoso@company.com', role: 'qa_engineer' },
  { email: 'eko.prasetyo@company.com', role: 'developer' },
]
```

#### 1.2 User Management Module

**File:** `/components/UserManagement.tsx`

**Features:**
- **User listing** dengan filter by role dan status
- **Quick Create** untuk add user dengan minimal info
- **Inline editing** untuk update user data
- **Role management** dengan 7 predefined roles
- **Special permissions** untuk override base permissions
- **Bulk operations** - Delete multiple users
- **User status** - Active/Inactive toggle

**7 Roles Available:**
1. **Admin** - Full system access (Purple badge)
2. **QA Lead** - Manage QA team (Blue badge)
3. **QA Engineer** - Create and execute tests (Teal badge)
4. **Developer** - Execute automated tests (Orange badge)
5. **Product Manager** - View metrics (Green badge)
6. **UI/UX Designer** - View and generate tests (Pink badge)
7. **Viewer** - Read-only access (Gray badge)

**Key Components:**
- `ROLE_CONFIG` (lines 25-100) - Role definitions dengan permissions
- `AVAILABLE_SPECIAL_PERMISSIONS` (lines 102-113) - Additional permissions
- Quick Create Dialog (lines 300-450)
- User Table dengan inline edit (lines 550-850)

#### 1.3 Account Page

**File:** `/components/AccountPage.tsx`

**Features:**
- **Profile editing** - Update name dan email
- **Role information** - Display current role dengan permissions
- **Git integration** - Auto-detect Git username/email dari local config
- **Account metadata** - Joined date, last active timestamp
- **Base permissions** - View all role-based permissions
- **Special permissions** - View additional granted permissions

**Git Integration:**
```typescript
// Otomatis detect dari:
git config user.name
git config user.email
```

---

### 2. Dashboard

**File:** `/components/Dashboard.tsx`

**Features:**

#### 2.1 Statistics Cards
- **Total Test Cases** - Count semua test cases
- **Automated Tests** - Percentage automation coverage
- **Last Run Status** - Latest execution result
- **Pass Rate** - Success percentage dari last run

**Component:** `/components/StatCard.tsx`

#### 2.2 Trend Visualization
**Interactive Chart** (Last 7 Runs):
- **Combined chart** - Bar chart (passed/failed) + Line chart (pass rate)
- **Custom tooltip** dengan detailed metrics
- **Color-coded** - Green for passed, Red for failed, Blue for pass rate
- **Responsive** - Auto-adjust to container width

**Data Structure:**
```typescript
trendData = [
  { name: "Run #148", passed: 88, failed: 2, total: 90, passRate: 97.8 },
  // ... 6 more runs
]
```

#### 2.3 Recent Test Cases Activity
- **Clickable cards** - Navigate to test case detail
- **Author info** - Who created the test
- **Timestamp** - When it was created
- **Auto-fetch** - Fetch full test case data by ID dari centralized database

**Data Source:** `/data/mockTestCases.ts` via `getTestCaseDetail(id)`

#### 2.4 Recent Test Runs
- **Interactive timeline** - Click to view full report
- **Visual status** - Green (Passed) / Red (Failed)
- **Quick info** - Suite, test case name, duration

**Chart Library:** Recharts
- `AreaChart`, `LineChart`, `ComposedChart`
- Custom tooltips dengan Tailwind styling

---

### 3. Test Case Management

#### 3.1 Test Cases List

**File:** `/components/TestCasesList.tsx`

**Features:**

##### Search & Filtering
- **Search bar** - By ID or title
- **Filter by automation** - Automated / Manual / All
- **Filter by priority** - Critical / High / Medium / Low
- **Filter by suite** - Dynamic list dari available suites
- **Pagination** - Configurable items per page (10/25/50/100)

##### Table View
**Columns:**
1. ID (blue link)
2. Title + Last Run info
3. Suite/Module
4. Priority (color-coded badge)
5. Case Type (Positive/Negative/Edge)
6. Automation Status (with icon)
7. Last Execution status
8. Page Load Average
9. Actions (7 buttons)

##### Quick Create
- **Inline form** di top of table
- **Minimal fields** - Title, Suite, Priority, Case Type, Automation
- **Save & Edit** - Option untuk langsung edit after create
- **Visual highlight** - Teal border untuk new row

##### Inline Editing
- **Quick Edit** - Edit langsung di table row
- **Blue highlight** - Active editing row
- **Save/Cancel** buttons
- **Validation** - Required fields check

##### Bulk Operations
- **Bulk Delete Mode** - Toggle untuk multi-select
- **Checkbox selection** - Select individual atau select all
- **Delete confirmation** - Dialog dengan count preview
- **Visual feedback** - Red background untuk selected items

##### Action Buttons (per row)
1. **Quick Edit** (Orange) - Inline editing
2. **Full Edit** (Blue) - Navigate to form
3. **Delete** (Red) - Delete confirmation
4. **View History** (Purple) - Run history untuk test case ini
5. **Run Test / Record Manual** (Green/Teal) - Tergantung automation status
6. **View Detail** (Blue) - Navigate to detail page

**Data Source:** `/data/mockTestCases.ts` - `TEST_CASES_LIST`

#### 3.2 Test Case Form

**File:** `/components/TestCaseForm.tsx`

**Features:**

##### Basic Information Section
- Test Case ID (auto-generated atau TC-XXXX)
- Title (required)
- Description (textarea)
- Suite/Module (select)
- Priority (Critical/High/Medium/Low)
- Case Type (Positive/Negative/Edge)
- Automation Status (Automated/Manual toggle)

##### Test Steps Editor
**Action-Based Steps** (bukan Gherkin):
- **Add Step** button
- **Draggable rows** untuk reorder
- **Action types:** Navigate, Click, Type, Verify, Wait, Assert, Select, Upload, etc.
- **Target selector** - CSS selector atau XPath
- **Value** - Input value (optional)
- **Description** - Human-readable explanation

**Step Structure:**
```typescript
{
  action: string,        // "Navigate", "Click", "Type", etc.
  target?: string,       // CSS selector
  value?: string,        // Input value
  description?: string   // Human explanation
}
```

##### Expected Outcome
- Textarea untuk describe expected result
- Rich text support

##### Action Buttons
- **Save** (Green) - Save and return to previous view
- **Cancel** (Gray) - Discard changes

**Smart Navigation:**
- From Test Cases List → Save → Back to List
- From Test Case Detail → Edit → Save → Back to Detail

#### 3.3 Test Case Detail

**File:** `/components/TestCaseDetail.tsx`

**Features:**

##### Header Section
- Back button (navigate to previous view)
- Test Case ID + Title
- Status badge (Passed/Failed/Pending)
- Metadata (Created by, Created at, Last modified)

##### Information Cards
1. **Basic Info**
   - Suite/Module
   - Priority badge
   - Case Type badge
   - Automation status

2. **Description**
   - Full description text
   - Collapsible jika panjang

3. **Test Steps**
   - **Visual step list** dengan icons
   - Each step shows:
     - Action icon (dynamic based on action type)
     - Action name (colored)
     - Target selector
     - Description
   - Color-coded actions (Teal untuk action name)

4. **Expected Outcome**
   - Expected result description

5. **Tags** (jika ada)
   - Visual tag badges

##### Action Buttons
- **Edit** - Navigate to form
- **Run Test** (Automated) / **Record Manual Result** (Manual)
- **Delete** - Confirmation dialog

**Icon Mapping:**
```typescript
getActionIcon(action) {
  'Navigate' → Globe
  'Click' → MousePointer
  'Type' → Keyboard
  'Verify' → CheckCircle
  'Wait' → Clock
  'Assert' → Shield
  // ... dll
}
```

#### 3.4 Manual Test Result Form

**File:** `/components/ManualTestResultForm.tsx`

**Features:**
- **Test Case Info** - Display test being executed
- **Result Status** - Pass/Fail/Blocked radio buttons
- **Evidence Upload** - Screenshot/video attachment
- **Actual Result** - Textarea untuk describe what happened
- **Notes** - Additional comments
- **Timestamp** - Auto-record execution time
- **Save Result** - Submit manual execution result

---

### 4. Test Execution & Reporting

#### 4.1 Test Report

**File:** `/components/TestReport.tsx`

**Features:**

##### Execution Summary
- Run ID
- Test Suite name
- Test Case title
- Status (color-coded badge)
- Duration
- Timestamp

##### Detailed Results
- **Step-by-step execution log**
- Each step shows:
  - Status icon (✓ Pass / ✗ Fail)
  - Action performed
  - Expected vs Actual
  - Screenshot (if available)
  - Error message (if failed)

##### Performance Metrics
- Page load time
- Response time
- Memory usage
- Network requests

##### Screenshots Gallery
- Captured screenshots during execution
- Lightbox view

##### Error Stack Trace
- Jika test failed
- Full error details
- Stack trace

##### Export Options
- Export as PDF
- Export as HTML
- Share link

#### 4.2 Runs History

**File:** `/components/RunsHistory.tsx`

**Features:**

##### Timeline View
- **Chronological list** of all test executions
- **Filter by:**
  - Date range (DateTimePicker component)
  - Test Suite
  - Status (Passed/Failed/All)
  - Specific Test Case ID (when navigated from test case)

##### History Cards
Each card shows:
- Run ID + Timestamp
- Test Suite + Test Case
- Status badge
- Duration
- Pass rate
- Click to view full report

##### Statistics
- Total runs
- Success rate
- Average duration
- Trend graph

**Component:** `/components/DateTimePicker.tsx` - Custom date range picker

---

### 5. Configuration Management

**File:** `/components/Configuration.tsx`

**Features:**

Platform supports **2 main configuration tabs**:

#### 5.1 UI Automation Configuration

**3 Sub-tabs:**

##### 5.1.1 Web Automation (`web-config.json`)
**Settings:**
- Base URL
- Max Concurrent Sessions
- Headless Mode (toggle)
- Implicit Wait (ms)
- Page Load Timeout (ms)
- Script Timeout (ms)

**Browser Configuration:**
- **Multi-browser support**
- Add/Remove browsers dynamically
- Per-browser settings:
  - Browser type (Chrome/Firefox/Edge/Safari)
  - Mobile emulation (toggle)
  - Device name (if mobile)
  - Custom viewport (width x height)

**Data Structure:**
```typescript
browsers = [
  {
    id: '1',
    type: 'chrome',
    mobileEmulation: false,
    deviceName?: 'iPhone 14 Pro',
    width?: '390',
    height?: '844'
  }
]
```

##### 5.1.2 Android Automation (`android-config.json`)
**Appium Configuration:**
- Appium Server URL (default: http://localhost:4723)
- Platform Name: "Android"
- Platform Version (e.g., "13.0")
- Device Name (e.g., "Pixel 6")
- Automation Name: "UiAutomator2"
- App Package (e.g., "com.example.app")
- App Activity (e.g., ".MainActivity")
- Auto Grant Permissions (toggle)
- No Reset (toggle)
- Implicit Wait (ms)

##### 5.1.3 iOS Automation (`ios-config.json`)
**Appium Configuration:**
- Appium Server URL
- Platform Name: "iOS"
- Platform Version (e.g., "16.0")
- Device Name (e.g., "iPhone 14")
- Automation Name: "XCUITest"
- Bundle ID (e.g., "com.example.app")
- UDID (device identifier)
- Xcode Org ID
- Xcode Signing ID
- Auto Accept Alerts (toggle)
- No Reset (toggle)
- Implicit Wait (ms)

**Visual Indicators:**
- Desktop icon untuk Web
- Mobile icon untuk Android
- Apple icon untuk iOS

#### 5.2 API & Load Testing Configuration

**Settings:**

##### Load Test Parameters
- Virtual Users count
- Test Duration (e.g., "5m")

##### Load Stages (Ramp-up/down)
**Dynamic stage builder:**
- Add/Remove stages
- Per-stage configuration:
  - Duration (e.g., "1m", "30s")
  - Target VUs (Virtual Users)

**Example:**
```typescript
stages = [
  { duration: '1m', targetVUs: '50' },   // Ramp-up
  { duration: '3m', targetVUs: '100' },  // Sustained load
  { duration: '1m', targetVUs: '0' },    // Ramp-down
]
```

##### Success Thresholds
**Metric-based criteria:**
- Add/Remove thresholds
- Per-threshold configuration:
  - Metric type (p95_response_time / error_rate / etc.)
  - Max value threshold

**Example:**
```typescript
thresholds = [
  { metricType: 'p95_response_time', maxValue: '300' }, // 300ms
  { metricType: 'error_rate', maxValue: '5' },          // 5%
]
```

#### Configuration Actions
- **Save Configuration** - Export to JSON files
- **Reset to Default** - Restore default values
- **Import Config** - Load dari file
- **Live Validation** - Real-time input validation

**Visual Design:**
- Tab-based navigation
- Card-based sections
- Color-coded inputs
- Add/Remove buttons untuk dynamic lists

---

### 6. Tools Module

**File:** `/components/Tools.tsx`

**Features:**

#### 6.1 Web Inspector

**Chrome DevTools Protocol Inspector**

**Controls:**
- **Start Server** button
  - Launches local inspector server
  - Default port: 9222
  - URL: http://localhost:9222

- **Status indicator**
  - Green badge: "Running"
  - Gray badge: "Stopped"
  - Loading spinner saat starting

- **Open Inspector** button
  - Opens in new tab/window
  - Direct link to inspector UI

**Features:**
- Inspect web elements
- Monitor network requests
- Debug JavaScript
- View console logs
- Performance profiling

**Visual:**
- Blue gradient icon (Globe)
- Server status badge
- Port number display

#### 6.2 Appium Inspector

**Mobile Automation Inspector**

**Controls:**
- **Start Server** button
  - Launches Appium Inspector server
  - Default port: 4723
  - URL: http://localhost:4723

- **Status indicator**
  - Similar to Web Inspector

- **Open Inspector** button
  - Opens Appium Inspector UI

**Features:**
- Inspect mobile app elements
- View element hierarchy
- Record actions
- Generate locators
- Live screen mirroring

**Visual:**
- Orange gradient icon (Smartphone)
- Server status badge
- Port number display

#### Tool Management
- **One-click start/stop**
- **Port configuration**
- **Status monitoring**
- **Auto-cleanup on stop**

**Use Cases:**
- Create test selectors
- Debug test failures
- Explore app structure
- Validate element properties

---

### 7. Git Profile Integration

**Location:** Account Page - Git Integration section

**File:** `/components/AccountPage.tsx` (lines 150-200)

**Features:**

#### Auto-Detection
Platform otomatis mendeteksi Git profile dari local configuration:

```bash
# Detected from:
git config --global user.name
git config --global user.email
```

#### Display
- **Git Username** - Display dengan GitBranch icon
- **Git Email** - Display dengan Mail icon
- **Visual badges** - Color-coded indicators
- **Read-only** - Auto-populated, tidak bisa edit manual

#### Use Cases
1. **Test Case Attribution** - Auto-assign creator berdasarkan Git user
2. **Audit Trail** - Track who created/modified test cases
3. **Team Collaboration** - Identify test case owners
4. **Git Integration** - Link test cases dengan Git commits

**Example Display:**
```
Git Username: ahmad.rizki
Git Email:    ahmad.rizki@company.com
```

---

### 8. Role-Based Access Control (RBAC)

**Files:**
- `/components/UserManagement.tsx` (ROLE_CONFIG, lines 25-100)
- `/App.tsx` (MOCK_USERS dengan role assignments)
- `/components/AccountPage.tsx` (Role display)

#### RBAC Principles

**Core Principle:**
> **"Semua role bisa VIEW apapun, permissions hanya untuk ACTIONS yang bisa dilakukan"**

Artinya:
- ✅ Semua role bisa lihat Dashboard, Test Cases, Reports, Configurations
- 🔒 Permissions mengatur: Create, Edit, Delete, Execute, Manage, Export

#### 7 Roles Detailed

##### 1. Admin
**Badge:** Purple (`bg-purple-500/20`)

**Description:** Full system access and user management

**Base Permissions:**
- ✅ View all data
- ✅ Manage users and roles
- ✅ Full access to all test cases (create/edit/delete)
- ✅ Execute all tests
- ✅ Manage configurations
- ✅ Export reports
- ✅ Manage integrations (Git, Jira, etc)

##### 2. QA Lead
**Badge:** Blue (`bg-blue-500/20`)

**Description:** Lead QA team and manage test strategies

**Base Permissions:**
- ✅ View all data
- ✅ Manage QA team members (add/edit QA Engineers)
- ✅ Full access to all test cases
- ✅ Execute all tests
- ✅ Manage test configurations
- ✅ Review and approve test cases
- ✅ Export reports

##### 3. QA Engineer
**Badge:** Teal (`bg-teal-500/20`)

**Description:** Create and execute test cases

**Base Permissions:**
- ✅ View all data
- ✅ Create and edit test cases (own test cases)
- ✅ Execute manual and automated tests
- ✅ Record test results
- ✅ View test reports
- ✅ Access test configurations (read)

##### 4. Developer
**Badge:** Orange (`bg-orange-500/20`)

**Description:** Execute automated tests and manage configurations

**Base Permissions:**
- ✅ View all data
- ✅ View test cases (read-only)
- ✅ Execute automated tests
- ✅ View test results and reports
- ✅ Access API test configurations

**Special Permissions (example):**
- ✅ Manage QA team members
- ✅ Review and approve test cases
- ✅ Manage test configurations

##### 5. Product Manager
**Badge:** Green (`bg-green-500/20`)

**Description:** View test coverage and quality metrics

**Base Permissions:**
- ✅ View all data
- ✅ View test cases (read-only)
- ✅ View test reports
- ✅ View dashboard metrics
- ✅ Export reports

##### 6. UI/UX Designer
**Badge:** Pink (`bg-pink-500/20`)

**Description:** Generate test cases and view run history

**Base Permissions:**
- ✅ View all data
- ✅ Full access to all test cases (create untuk UI tests)
- ✅ View run history
- ✅ Export reports
- ✅ Access UI automation configs

##### 7. Viewer
**Badge:** Gray (`bg-slate-500/20`)

**Description:** Read-only access to test information

**Base Permissions:**
- ✅ View all data
- ❌ No write/execute permissions

#### Special Permissions System

**Available Special Permissions:**
```typescript
AVAILABLE_SPECIAL_PERMISSIONS = [
  'Manage users and roles',
  'Manage QA team members',
  'Full access to all test cases',
  'Create and edit test cases',
  'Execute manual and automated tests',
  'Execute automated tests',
  'Record test results',
  'Manage configurations',
  'Manage test configurations',
  'Review and approve test cases',
  'Export reports',
  'Manage integrations (Git, Jira, etc)',
]
```

**Use Case:**
- Admin dapat grant additional permissions ke specific user
- Override base role permissions
- Temporary elevated access
- Cross-functional teams

**Example:**
```typescript
// Developer dengan special permissions
{
  role: 'developer',
  specialPermissions: [
    'Manage QA team members',      // Override
    'Review and approve test cases' // Override
  ]
}
```

#### Permission Enforcement

**In UI:**
```tsx
{currentUser.role === 'admin' || hasPermission('manage_users') ? (
  <Button>Add User</Button>
) : null}
```

**In API:**
```typescript
if (!canExecuteTests(user.role)) {
  throw new Error('Insufficient permissions');
}
```

---

## File Structure

### Core Application Files

```
/
├── App.tsx                          # Main application entry, routing, state
├── styles/
│   └── globals.css                  # Tailwind config, typography, dark theme
├── data/
│   └── mockTestCases.ts             # Centralized test case database
└── components/
    ├── LoginPage.tsx                # Authentication
    ├── Sidebar.tsx                  # Navigation sidebar
    ├── AccountPage.tsx              # User profile, Git integration
    │
    ├── Dashboard.tsx                # Statistics, trends, recent activity
    ├── StatCard.tsx                 # Reusable stat card component
    │
    ├── TestCasesList.tsx            # Test case table, filters, bulk ops
    ├── TestCaseForm.tsx             # Create/edit test case form
    ├── TestCaseDetail.tsx           # Test case detail view
    │
    ├── TestReport.tsx               # Test execution report
    ├── RunsHistory.tsx              # Historical runs timeline
    ├── ManualTestResultForm.tsx     # Manual test result recording
    │
    ├── Configuration.tsx            # Test configs (Web/Android/iOS/API)
    ├── Tools.tsx                    # Web/Appium inspector launcher
    │
    ├── UserManagement.tsx           # RBAC, user CRUD, permissions
    │
    ├── QuickCreateDialog.tsx        # Quick create modal
    ├── DeleteConfirmDialog.tsx      # Delete confirmation modal
    ├── DateTimePicker.tsx           # Date range picker
    │
    └── ui/                          # Shadcn/ui components
        ├── button.tsx
        ├── badge.tsx
        ├── tabs.tsx
        ├── dialog.tsx
        ├── ... (30+ UI components)
```

---

## Data Models

### Test Case Model

**File:** `/data/mockTestCases.ts`

```typescript
interface TestStep {
  action: string;           // "Navigate", "Click", "Type", etc.
  target?: string;          // CSS selector atau XPath
  value?: string;           // Input value
  description?: string;     // Human-readable description
}

interface TestCaseSummary {
  id: string;               // "TC-1001"
  title: string;
  suite: string;            // "Authentication", "E-Commerce", etc.
  priority: string;         // "Critical" | "High" | "Medium" | "Low"
  caseType: string;         // "Positive" | "Negative" | "Edge"
  automation: string;       // "Automated" | "Manual"
  lastStatus: 'passed' | 'failed' | 'pending';
  pageLoadAvg: string;      // "1.2s" atau "-"
  lastRun: string;          // "5 menit lalu"
}

interface TestCaseDetail extends TestCaseSummary {
  description?: string;
  steps?: TestStep[];
  tags?: string[];
  createdBy?: string;
  createdAt?: string;
  lastModified?: string;
}
```

**Helper Functions:**
```typescript
getTestCaseDetail(id: string): TestCaseDetail | undefined
enrichTestCase(summary: TestCaseSummary): TestCaseDetail
```

**Export:**
```typescript
export const TEST_CASES_LIST: TestCaseSummary[]  // For table display
```

### User Model

**File:** `/App.tsx` (lines 20-102)

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'qa_lead' | 'qa_engineer' | 'developer' | 
        'product_manager' | 'ui_ux_designer' | 'viewer';
  status: 'active' | 'inactive';
  joinedDate: string;
  lastActive: string;
  gitUsername?: string;
  gitEmail?: string;
  basePermissions: string[];
  specialPermissions?: string[];
}
```

### Configuration Models

**File:** `/components/Configuration.tsx`

```typescript
// Web Config
interface Browser {
  id: string;
  type: string;              // "chrome" | "firefox" | "edge" | "safari"
  mobileEmulation: boolean;
  deviceName?: string;       // "iPhone 14 Pro"
  width?: string;            // "390"
  height?: string;           // "844"
}

// Load Testing
interface LoadStage {
  id: string;
  duration: string;          // "1m", "30s"
  targetVUs: string;         // "100"
}

interface SuccessThreshold {
  id: string;
  metricType: string;        // "p95_response_time" | "error_rate"
  maxValue: string;          // "300" (ms atau %)
}
```

---

## Navigation Flow

### View Hierarchy

```
LoginPage
  ↓ (authenticated)
App (Layout dengan Sidebar)
  ├── Dashboard
  │     ├── Click stat card → TestCasesList
  │     ├── Click recent test case → TestCaseDetail
  │     └── Click recent run → TestReport
  │
  ├── TestCasesList
  │     ├── Create button → TestCaseForm (new)
  │     ├── Edit button → TestCaseForm (edit)
  │     ├── View Detail → TestCaseDetail
  │     ├── View History → RunsHistory (filtered)
  │     ├── Run Test → TestReport
  │     └── Record Manual → ManualTestResultForm
  │
  ├── TestCaseDetail
  │     ├── Edit button → TestCaseForm
  │     ├── Run Test → TestReport
  │     ├── Record Manual → ManualTestResultForm
  │     └── Back button → Previous View (smart)
  │
  ├── TestCaseForm
  │     ├── Save → Previous View
  │     └── Cancel → Previous View
  │
  ├── TestReport
  │     └── Back button → Previous View
  │
  ├── RunsHistory
  │     └── Click run → TestReport
  │
  ├── Configuration
  │     ├── UI Automation tab
  │     │   ├── Web
  │     │   ├── Android
  │     │   └── iOS
  │     └── API & Load Testing tab
  │
  ├── Tools
  │     ├── Web Inspector
  │     └── Appium Inspector
  │
  ├── UserManagement
  │     ├── Quick Create → Inline form
  │     ├── Edit User → Inline edit
  │     └── Delete User → Confirmation dialog
  │
  └── Account
        └── Edit Profile → Inline edit
```

### Smart Back Navigation

**Implementation:** `/App.tsx` (handleViewDetail, handleEditTestCase, etc.)

```typescript
// Track previous view
const [previousView, setPreviousView] = useState<View>('test-cases');

// Example: Edit Test Case
handleEditTestCase(testCase) {
  setPreviousView(currentView);  // Remember where we are
  setCurrentView('test-case-form');
}

// Save returns to where user came from
handleSaveTestCase() {
  setCurrentView(previousView);  // Go back
}
```

**Result:**
- Dashboard → Detail → Edit → Save → **Back to Detail** ✅
- Test Cases → Detail → Edit → Save → **Back to Detail** ✅
- Test Cases → Edit → Save → **Back to List** ✅

---

## Technologies Used

### Frontend Framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling utility
- **Shadcn/ui** - Component library (30+ components)

### Charts & Visualization
- **Recharts** - Interactive charts
  - AreaChart, LineChart, ComposedChart
  - Custom tooltips
  - Responsive containers

### Icons
- **Lucide React** - Icon library (100+ icons used)

### State Management
- **React useState** - Local component state
- **React useRef** - DOM references
- **React useEffect** - Side effects

### Routing
- **Custom view-based routing** - Not using React Router
- **State-based navigation** - Via `currentView` state

### UI Components (Shadcn/ui)
- **Forms:** Input, Textarea, Select, Checkbox, Radio, Switch
- **Feedback:** Alert, Toast (Sonner), Dialog, Popover
- **Navigation:** Tabs, Breadcrumb, Pagination
- **Data Display:** Table, Badge, Card, Avatar, Skeleton
- **Layout:** Separator, Sheet, Sidebar, Resizable
- **Advanced:** Calendar, DatePicker, Command, Context Menu

### Development
- **Vite** - Build tool
- **ESLint** - Code linting
- **Prettier** - Code formatting

### Target Platform
- **Tauri** - Desktop application framework
- **Cross-platform** - Windows, macOS, Linux

---

## Key Features Summary

| Feature | Description | File Reference |
|---------|-------------|----------------|
| **Authentication** | Mock login system dengan role-based users | `/components/LoginPage.tsx` |
| **Dashboard** | Stats, trends (7 runs), recent activities | `/components/Dashboard.tsx` |
| **Test Management** | CRUD, search, filter, bulk ops, inline edit | `/components/TestCasesList.tsx` |
| **Test Editor** | Action-based steps, drag-drop, visual editor | `/components/TestCaseForm.tsx` |
| **Test Detail** | Full view dengan visual step icons | `/components/TestCaseDetail.tsx` |
| **Test Reports** | Execution results dengan screenshots | `/components/TestReport.tsx` |
| **Run History** | Timeline view dengan filters | `/components/RunsHistory.tsx` |
| **Manual Testing** | Record manual test results | `/components/ManualTestResultForm.tsx` |
| **Configuration** | Web/Android/iOS/API/Load configs | `/components/Configuration.tsx` |
| **Tools** | Web/Appium Inspector launcher | `/components/Tools.tsx` |
| **User Management** | RBAC, 7 roles, special permissions | `/components/UserManagement.tsx` |
| **Account** | Profile, Git integration, permissions | `/components/AccountPage.tsx` |
| **Git Integration** | Auto-detect local Git config | `/components/AccountPage.tsx` |
| **RBAC** | 7 roles dengan granular permissions | `/components/UserManagement.tsx` |
| **Dark Theme** | Blue-gray dark mode dengan color system | `/styles/globals.css` |
| **Data Layer** | Centralized mock database | `/data/mockTestCases.ts` |

---

## Design Patterns

### 1. Centralized Data Source
- Single source of truth: `/data/mockTestCases.ts`
- Helper functions: `getTestCaseDetail()`, `enrichTestCase()`
- No duplicate data across components

### 2. Smart Navigation
- Track `previousView` untuk contextual back navigation
- Auto-scroll to top on view change
- Polymorphic handlers (accept ID or object)

### 3. Component Composition
- Reusable UI components (Shadcn/ui)
- Custom components (`StatCard`, `DeleteConfirmDialog`)
- Props-based communication

### 4. State Management
- Centralized state in `App.tsx`
- Props drilling untuk data passing
- Local state untuk UI-only state (filters, pagination)

### 5. Role-Based UI
- Conditional rendering based on `currentUser.role`
- Permission checks via helper functions
- Special permissions override system

### 6. Mock Data Strategy
- Realistic mock data untuk development
- Easy to replace dengan API calls
- Type-safe interfaces

---

## Future Enhancements

### Potential Improvements
1. **Backend Integration** - Replace mock data dengan real API
2. **Real Git Integration** - Execute Git commands via Tauri
3. **Test Execution Engine** - Run tests dari platform
4. **CI/CD Integration** - Jenkins, GitHub Actions, GitLab CI
5. **Real-time Collaboration** - WebSocket untuk multi-user
6. **Advanced Analytics** - ML-based test insights
7. **Plugin System** - Extensible architecture
8. **Export/Import** - Test case migration tools
9. **Mobile App** - React Native companion app
10. **AI Test Generation** - Auto-generate tests dari specs

---

## Developer Notes

### Code Style
- **TypeScript strict mode** - Type safety enforced
- **Tailwind CSS** - No custom CSS files except globals.css
- **Component naming** - PascalCase untuk components
- **File naming** - PascalCase untuk component files
- **Props interface** - Always define interface untuk component props

### Best Practices
1. Always use centralized data (`/data/mockTestCases.ts`)
2. Never duplicate test case data
3. Use `previousView` untuk smart navigation
4. Validate forms before submission
5. Show loading states untuk async operations
6. Use confirmation dialogs untuk destructive actions
7. Implement proper error handling
8. Add visual feedback untuk user actions

### Component Guidelines
- Keep components focused (Single Responsibility)
- Extract reusable logic ke helper functions
- Use Shadcn/ui components sebagai base
- Customize via Tailwind classes, bukan inline styles
- Document complex logic dengan comments

---

## License & Credits

**TestSpectra** - QA Automation Platform

Built with:
- React + TypeScript
- Tailwind CSS
- Shadcn/ui
- Recharts
- Lucide Icons

---

**Last Updated:** November 25, 2024  
**Version:** 1.0.0  
**Maintained by:** QA Engineering Team
