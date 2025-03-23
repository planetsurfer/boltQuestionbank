/*
  # Create initial users

  1. Changes
    - Remove existing test users
    - Create admin and teacher users with proper authentication settings
    - Set correct metadata and roles
*/

-- First, clean up any existing users
DELETE FROM auth.users WHERE email IN ('admin@example.com', 'teacher@example.com');

-- Create the admin user with proper auth settings
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
  is_sso_user,
  aud,
  role
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
  false,
  'authenticated',
  'authenticated'
);

-- Create the teacher user with proper auth settings
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
  is_sso_user,
  aud,
  role
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
  false,
  'authenticated',
  'authenticated'
);