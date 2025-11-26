-- Create test_suites table
CREATE TABLE IF NOT EXISTS test_suites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Insert default suites based on existing test_cases data
INSERT INTO test_suites (name, description)
SELECT DISTINCT suite, 'Migrated from existing test cases'
FROM test_cases
WHERE suite IS NOT NULL AND suite != ''
ON CONFLICT (name) DO NOTHING;
