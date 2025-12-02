# Requirements Document

## Introduction

Fitur review test case memungkinkan QA Lead untuk melakukan review terhadap test case yang dibuat oleh QA Engineer. Sistem ini menyediakan workflow approval sederhana dengan kemampuan approve atau request edit, dilengkapi dengan history review comment dan push notification real-time untuk memberitahu user tentang status review.

## Glossary

- **Test Case**: Dokumen yang berisi langkah-langkah pengujian yang dibuat oleh QA Engineer
- **QA Engineer**: User dengan role yang membuat dan mengedit test case
- **QA Lead**: User dengan role yang melakukan review dan approval test case
- **Review**: Proses evaluasi test case oleh QA Lead yang menghasilkan status approved atau request edit
- **Review Comment**: Komentar atau catatan yang diberikan oleh reviewer pada saat melakukan review
- **Review Status**: Status dari test case yang menunjukkan kondisi review (pending, approved, needs_revision)
- **Push Notification**: Notifikasi real-time yang dikirim ke user melalui WebSocket connection
- **Notification System**: Sistem yang mengelola pengiriman dan penyimpanan notifikasi
- **Review History**: Riwayat semua aktivitas review yang pernah dilakukan pada sebuah test case

## Requirements

### Requirement 1

**User Story:** Sebagai QA Engineer, saya ingin test case yang saya buat dapat direview oleh QA Lead, sehingga kualitas test case terjamin sebelum digunakan

#### Acceptance Criteria

1. WHEN a QA Engineer creates a new test case THEN the system SHALL set the review status to "pending"
2. WHEN a test case is in pending status THEN the system SHALL display the test case in the test case list with a visual indicator
3. WHEN a QA Engineer updates a test case that has been approved THEN the system SHALL change the review status back to "pending"
4. WHEN a QA Engineer updates a test case that needs revision THEN the system SHALL change the review status to "pending"

### Requirement 2

**User Story:** Sebagai QA Lead, saya ingin dapat mereview test case yang dibuat oleh QA Engineer, sehingga saya dapat memastikan test case memenuhi standar kualitas

#### Acceptance Criteria

1. WHEN a QA Lead views a test case detail THEN the system SHALL display a review action section with approve and request edit options
2. WHEN a QA Lead clicks approve button THEN the system SHALL prompt for optional review comment
3. WHEN a QA Lead submits an approval THEN the system SHALL update the review status to "approved" and save the review record
4. WHEN a QA Lead clicks request edit button THEN the system SHALL require a review comment explaining what needs to be changed
5. WHEN a QA Lead submits a request edit THEN the system SHALL update the review status to "needs_revision" and save the review record

### Requirement 3

**User Story:** Sebagai QA Engineer, saya ingin melihat history review dari test case saya, sehingga saya dapat memahami feedback yang diberikan dan melakukan perbaikan yang diperlukan

#### Acceptance Criteria

1. WHEN a user views a test case detail THEN the system SHALL display the review history section showing all past reviews
2. WHEN displaying review history THEN the system SHALL show reviewer name, review action, comment, and timestamp for each review
3. WHEN review history is empty THEN the system SHALL display a message indicating no reviews have been performed
4. WHEN a new review is submitted THEN the system SHALL add the review to the history immediately

### Requirement 4

**User Story:** Sebagai user, saya ingin menerima notifikasi real-time ketika ada aktivitas review pada test case saya, sehingga saya dapat segera mengetahui dan merespons

#### Acceptance Criteria

1. WHEN a QA Lead approves a test case THEN the system SHALL send a push notification to the test case creator
2. WHEN a QA Lead requests edit on a test case THEN the system SHALL send a push notification to the test case creator
3. WHEN a user receives a notification THEN the system SHALL display the notification in the notification panel
4. WHEN a user clicks on a notification THEN the system SHALL navigate to the related test case detail
5. WHEN a notification is displayed THEN the system SHALL show the notification type, message, timestamp, and read status

### Requirement 5

**User Story:** Sebagai user, saya ingin dapat memfilter test case berdasarkan status review, sehingga saya dapat dengan mudah menemukan test case yang perlu direview atau yang sudah direview

#### Acceptance Criteria

1. WHEN a user views the test case list THEN the system SHALL provide a filter option for review status
2. WHEN a user selects "pending" filter THEN the system SHALL display only test cases with pending review status
3. WHEN a user selects "approved" filter THEN the system SHALL display only test cases with approved review status
4. WHEN a user selects "needs revision" filter THEN the system SHALL display only test cases with needs revision review status
5. WHEN a user selects "all" filter THEN the system SHALL display all test cases regardless of review status

### Requirement 6

**User Story:** Sebagai user, saya ingin dapat melihat status review pada list test case, sehingga saya dapat dengan cepat mengetahui test case mana yang sudah direview atau belum

#### Acceptance Criteria

1. WHEN the system displays test case list THEN the system SHALL show review status badge for each test case
2. WHEN a test case has pending status THEN the system SHALL display a yellow badge with "Pending Review" text
3. WHEN a test case has approved status THEN the system SHALL display a green badge with "Approved" text
4. WHEN a test case has needs revision status THEN the system SHALL display a red badge with "Needs Revision" text

### Requirement 7

**User Story:** Sebagai system, saya ingin menyimpan semua notifikasi yang dikirim, sehingga user dapat melihat riwayat notifikasi yang pernah diterima

#### Acceptance Criteria

1. WHEN the system sends a push notification THEN the system SHALL persist the notification to the database
2. WHEN a user opens the notification panel THEN the system SHALL retrieve and display all notifications for that user
3. WHEN a user marks a notification as read THEN the system SHALL update the notification read status in the database
4. WHEN displaying notifications THEN the system SHALL order them by timestamp descending with unread notifications prioritized

### Requirement 8

**User Story:** Sebagai system, saya ingin menggunakan WebSocket untuk push notification, sehingga notifikasi dapat dikirim secara real-time tanpa polling

#### Acceptance Criteria

1. WHEN a user logs in THEN the system SHALL establish a WebSocket connection for that user
2. WHEN a WebSocket connection is established THEN the system SHALL authenticate the user using JWT token
3. WHEN a notification needs to be sent THEN the system SHALL push the notification through the WebSocket connection
4. WHEN a WebSocket connection is closed THEN the system SHALL handle reconnection gracefully
5. WHEN a user is offline THEN the system SHALL store notifications and deliver them when the user reconnects
