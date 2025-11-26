-- Add git-related fields and joined_date to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS joined_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS git_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS git_username VARCHAR(255);

-- Update existing users to have joined_date set to their created_at
UPDATE users SET joined_date = created_at WHERE joined_date IS NULL;
