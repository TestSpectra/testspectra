-- Add migration to update priority column to PascalCase
UPDATE test_cases
SET priority =
    CASE priority
        WHEN 'low' THEN 'Low'
        WHEN 'medium' THEN 'Medium'
        WHEN 'high' THEN 'High'
        WHEN 'critical' THEN 'Critical'
        ELSE priority
    END;
