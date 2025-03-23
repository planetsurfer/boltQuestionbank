/*
  # Fix users metadata and auth handling

  1. Changes
    - Drop and recreate users_metadata table with proper constraints
    - Update handle_new_user function with improved error handling
    - Ensure proper trigger setup
    - Set up RLS policies correctly
*/

-- Drop and recreate users_metadata table
DROP TABLE IF EXISTS public.users_metadata;
CREATE TABLE public.users_metadata (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'teacher',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at trigger
CREATE TRIGGER update_users_metadata_updated_at
    BEFORE UPDATE ON public.users_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with improved error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role text := COALESCE(NEW.raw_user_meta_data->>'role', 'teacher');
BEGIN
  INSERT INTO public.users_metadata (id, role)
  VALUES (NEW.id, default_role)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create auth trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.users_metadata ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can read own metadata" ON public.users_metadata;
DROP POLICY IF EXISTS "Admin can manage all user metadata" ON public.users_metadata;

CREATE POLICY "Users can read own metadata"
ON public.users_metadata
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admin can manage all user metadata"
ON public.users_metadata
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users_metadata um
    WHERE um.id = auth.uid() AND um.role = 'admin'
  )
);