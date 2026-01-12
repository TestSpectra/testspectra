-- Add proper step_type enum with CHECK constraint
-- Ensures only valid step_type values are stored.

-- First, update any existing NULL step_type to 'regular' (safe default)
UPDATE test_steps SET step_type = 'regular' WHERE step_type IS NULL;

-- Add CHECK constraint for valid step_type values
ALTER TABLE test_steps
ADD CONSTRAINT test_steps_step_type_check
CHECK (step_type IN ('regular', 'shared_definition', 'shared_reference'));

-- Update existing shared step definition steps to use 'shared_definition'
UPDATE test_steps
SET step_type = 'shared_definition'
WHERE shared_step_id IS NOT NULL AND test_case_id IS NULL;

-- Note: shared_reference rows will be created when test cases reference shared steps
-- (handled by application layer, not migration)
