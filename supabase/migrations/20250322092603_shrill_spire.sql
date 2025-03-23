/*
  # Create admin and teacher users if they don't exist
  
  1. Changes
    - Add existence checks before creating users
    - Create admin user with proper authentication settings if not exists
    - Create teacher user with proper authentication settings if not exists
    - Set appropriate user metadata and roles
*/

DO $$
BEGIN
  -- Create admin user if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com') THEN
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
  END IF;

  -- Create teacher user if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'teacher@example.com') THEN
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
  END IF;
END $$;