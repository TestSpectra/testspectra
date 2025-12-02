-- Test case reviews table
CREATE TABLE IF NOT EXISTS test_case_reviews (
    id UUID PRIMARY KEY,
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL CHECK (action IN ('approved', 'needs_revision')),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_reviews_test_case_id ON test_case_reviews(test_case_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON test_case_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON test_case_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_test_case_created ON test_case_reviews(test_case_id, created_at DESC);
