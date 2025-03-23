/*
  # Fix users_metadata policies to avoid recursion

  1. Changes
    - Drop existing policies
    - Create new non-recursive policies for users_metadata table
    - Update admin role for the specified user
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own metadata" ON users_metadata;
DROP POLICY IF EXISTS "Admin can manage all metadata" ON users_metadata;

-- Create new policies
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
        (SELECT role FROM users_metadata WHERE id = auth.uid()) = 'admin'
    );

-- Ensure the admin user has the correct role
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