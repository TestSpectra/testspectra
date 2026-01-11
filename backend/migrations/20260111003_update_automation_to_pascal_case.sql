-- Add migration to update automation column to PascalCase
UPDATE test_cases
SET automation =
    CASE automation
        WHEN 'manual' THEN 'Manual'
        WHEN 'automated' THEN 'Automated'
        ELSE automation
    END;
