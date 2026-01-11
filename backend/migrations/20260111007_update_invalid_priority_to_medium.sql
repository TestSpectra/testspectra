-- Add migration to update invalid priority values to 'Medium'
UPDATE test_cases
SET priority = 'Medium'
WHERE priority NOT IN ('Low', 'Medium', 'High', 'Critical');
