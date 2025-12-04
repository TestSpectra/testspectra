-- Add submitted_for_review_at column to track when test case entered review queue
-- This provides deterministic ordering for pagination in review queue

-- Add the column
ALTER TABLE test_cases 
ADD COLUMN submitted_for_review_at TIMESTAMP WITH TIME ZONE;

-- Set initial value to created_at for existing records
UPDATE test_cases 
SET submitted_for_review_at = created_at;

-- Add index for efficient sorting in review queue
CREATE INDEX idx_test_cases_submitted_for_review 
ON test_cases(review_status, submitted_for_review_at, case_id);

-- Add comment
COMMENT ON COLUMN test_cases.submitted_for_review_at IS 
'Timestamp when test case was first submitted for review (status changed to pending). Used for deterministic ordering in review queue.';
