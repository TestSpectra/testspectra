-- Add migration to update case_type column to PascalCase
UPDATE test_cases
SET case_type =
    CASE case_type
        WHEN 'positive' THEN 'Positive'
        WHEN 'negative' THEN 'Negative'
        WHEN 'edge' THEN 'Edge'
        ELSE case_type
    END;
