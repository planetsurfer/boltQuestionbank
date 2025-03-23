/*
  # Add initial admin user metadata

  1. Changes
    - Add admin role in users_metadata table
    - Note: The actual user creation and password setup should be done through Supabase Auth API
  
  2. Security
    - Only sets up the admin role in metadata
    - Actual user authentication handled by Supabase Auth
*/

-- Create admin role in users_metadata if it doesn't exist
INSERT INTO public.users_metadata (id, role)
SELECT 
  id,
  'admin'
FROM auth.users 
WHERE email = 'planetsurf@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin'
WHERE users_metadata.id IN (
  SELECT id FROM auth.users WHERE email = 'planetsurf@gmail.com'
);