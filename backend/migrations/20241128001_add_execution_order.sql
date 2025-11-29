-- Add execution_order column for test case ordering
-- Uses FLOAT for fractional indexing to avoid updating multiple rows on reorder

ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS execution_order FLOAT;

-- Initialize execution_order based on existing created_at order
WITH ordered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
    FROM test_cases
)
UPDATE test_cases tc
SET execution_order = ordered.rn
FROM ordered
WHERE tc.id = ordered.id AND tc.execution_order IS NULL;

-- Set default for new rows (will be max + 1)
ALTER TABLE test_cases ALTER COLUMN execution_order SET DEFAULT 0;

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_test_cases_execution_order ON test_cases(execution_order);
