/*
  # Set up users_metadata table and admin role

  1. New Tables
    - `users_metadata`
      - `id` (uuid, primary key, references auth.users)
      - `role` (text, default 'teacher')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on users_metadata table
    - Add policies for authenticated users
    - Set up admin role for specified user
*/

-- Create users_metadata table if it doesn't exist
CREATE TABLE IF NOT EXISTS users_metadata (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'teacher',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own metadata"
    ON users_metadata
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admin can manage all metadata"
    ON users_metadata
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users_metadata um
            WHERE um.id = auth.uid() AND um.role = 'admin'
        )
    );

-- Set admin role for the specified user
DO $$
DECLARE
    user_id uuid;
BEGIN
    -- Get the user ID for the admin email
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = 'planetsurf@gmail.com'
    LIMIT 1;

    -- If user exists, set their role to admin
    IF user_id IS NOT NULL THEN
        INSERT INTO users_metadata (id, role)
        VALUES (user_id, 'admin')
        ON CONFLICT (id) DO UPDATE
        SET role = 'admin';
    END IF;
END $$;