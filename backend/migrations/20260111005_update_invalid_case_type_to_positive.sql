-- Add migration to update invalid case_type values to 'Positive'
UPDATE test_cases
SET case_type = 'Positive'
WHERE case_type NOT IN (
    'Positive', 'Negative', 'Regression', 'Smoke', 'Sanity', 'Performance',
    'Security', 'Usability', 'Compatibility', 'Acceptance', 'Exploratory',
    'AdHoc', 'Automation', 'Manual', 'Edge'
);
