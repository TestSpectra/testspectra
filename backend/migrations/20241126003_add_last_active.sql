-- Add last_active column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();

-- Update existing users to have last_active = created_at
UPDATE users SET last_active = created_at WHERE last_active IS NULL;
