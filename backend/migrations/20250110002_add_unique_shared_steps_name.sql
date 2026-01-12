-- Add unique constraint on shared_steps.name
-- This migration ensures shared step names are unique across the system.

-- Add unique constraint; handle potential existing duplicates gracefully
DO $$
BEGIN
    -- First, remove any duplicate names (keep the earliest created)
    DELETE FROM shared_steps s1
    USING shared_steps s2
    WHERE s1.name = s2.name
      AND s1.id > s2.id;

    -- Now add the unique constraint
    ALTER TABLE shared_steps
    ADD CONSTRAINT shared_steps_name_unique UNIQUE(name);
EXCEPTION
    WHEN duplicate_table THEN
        -- If constraint already exists, do nothing
        NULL;
END$$;
