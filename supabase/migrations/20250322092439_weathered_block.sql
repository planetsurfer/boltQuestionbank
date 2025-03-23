/*
  # Create test users

  1. Changes
    - Create test admin and teacher users
    - Set up proper authentication and metadata
    - Ensure all required fields are populated
*/

-- Create the admin user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_super_admin,
  is_sso_user
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role":"admin"}'::jsonb,
  false,
  false
);

-- Create the teacher user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_super_admin,
  is_sso_user
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'teacher@example.com',
  crypt('teacher123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role":"teacher"}'::jsonb,
  false,
  false
);