-- Remove expected_outcome column from test_cases table
ALTER TABLE test_cases DROP COLUMN IF EXISTS expected_outcome;
