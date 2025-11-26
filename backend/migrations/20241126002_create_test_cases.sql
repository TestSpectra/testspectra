-- Sequence for test case IDs
CREATE SEQUENCE IF NOT EXISTS test_case_id_seq START WITH 1;

-- Test cases table
CREATE TABLE IF NOT EXISTS test_cases (
    id UUID PRIMARY KEY,
    case_id VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    suite VARCHAR(255) NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
    case_type VARCHAR(50) NOT NULL DEFAULT 'Positive',
    automation VARCHAR(50) NOT NULL DEFAULT 'Manual',
    last_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    page_load_avg VARCHAR(50),
    last_run VARCHAR(100),
    expected_outcome TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Test steps table
CREATE TABLE IF NOT EXISTS test_steps (
    id UUID PRIMARY KEY,
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    action VARCHAR(500) NOT NULL,
    target VARCHAR(500),
    value VARCHAR(500),
    description TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_test_cases_case_id ON test_cases(case_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_suite ON test_cases(suite);
CREATE INDEX IF NOT EXISTS idx_test_cases_priority ON test_cases(priority);
CREATE INDEX IF NOT EXISTS idx_test_cases_automation ON test_cases(automation);
CREATE INDEX IF NOT EXISTS idx_test_cases_last_status ON test_cases(last_status);
CREATE INDEX IF NOT EXISTS idx_test_cases_created_by ON test_cases(created_by);
CREATE INDEX IF NOT EXISTS idx_test_steps_test_case_id ON test_steps(test_case_id);

-- Updated_at trigger for test_cases
DROP TRIGGER IF EXISTS update_test_cases_updated_at ON test_cases;
CREATE TRIGGER update_test_cases_updated_at
    BEFORE UPDATE ON test_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
