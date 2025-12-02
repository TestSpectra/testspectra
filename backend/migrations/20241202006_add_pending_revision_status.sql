-- Add 'pending_revision' to review_status constraint
-- This status is for test cases that have been revised and are waiting for re-review
ALTER TABLE test_cases 
DROP CONSTRAINT IF EXISTS test_cases_review_status_check;

ALTER TABLE test_cases 
ADD CONSTRAINT test_cases_review_status_check 
CHECK (review_status IN ('pending', 'pending_revision', 'approved', 'needs_revision'));
