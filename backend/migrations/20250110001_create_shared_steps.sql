-- Migration: Create shared_steps table and extend test_steps for shared steps
-- This migration is designed to be appended after existing migrations without breaking
-- version ordering or previously applied schemas.

-- Clean up old user_defined_actions table if it exists (no data migration needed)
DROP TABLE IF EXISTS user_defined_actions CASCADE;

-- Shared steps metadata table
CREATE TABLE IF NOT EXISTS shared_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shared_steps_created_by ON shared_steps(created_by);
CREATE INDEX IF NOT EXISTS idx_shared_steps_name ON shared_steps(name);

-- Trigger for updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_shared_steps_updated_at'
    ) THEN
        CREATE TRIGGER update_shared_steps_updated_at
            BEFORE UPDATE ON shared_steps
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END$$;

-- Extend test_steps to support shared steps definitions
ALTER TABLE test_steps 
    ALTER COLUMN test_case_id DROP NOT NULL;

ALTER TABLE test_steps 
    ADD COLUMN IF NOT EXISTS step_type VARCHAR(20) NOT NULL DEFAULT 'regular',
    ADD COLUMN IF NOT EXISTS shared_step_id UUID REFERENCES shared_steps(id);

-- Index for shared step lookups
CREATE INDEX IF NOT EXISTS idx_test_steps_shared_step_id ON test_steps(shared_step_id);
