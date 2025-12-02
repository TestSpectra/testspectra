-- Add review_status column to test_cases table
ALTER TABLE test_cases 
ADD COLUMN IF NOT EXISTS review_status VARCHAR(50) NOT NULL DEFAULT 'pending' 
CHECK (review_status IN ('pending', 'approved', 'needs_revision'));

-- Index for performance optimization
CREATE INDEX IF NOT EXISTS idx_test_cases_review_status ON test_cases(review_status);
