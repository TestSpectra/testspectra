-- Add migration to update invalid automation values to 'Manual'
UPDATE test_cases
SET automation = 'Manual'
WHERE automation NOT IN ('Manual', 'Automated');
