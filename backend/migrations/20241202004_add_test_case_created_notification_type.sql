-- Add 'test_case_created' to notification_type constraint
-- Using IF EXISTS to make it safe for re-running
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_notification_type_check 
CHECK (notification_type IN ('review_approved', 'review_needs_revision', 'test_case_created'));
