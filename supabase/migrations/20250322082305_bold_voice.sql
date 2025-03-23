/*
  # Fix user metadata trigger and RLS policies

  1. Changes
    - Drop and recreate handle_new_user function with proper error handling
    - Update RLS policies for users_metadata table
    - Add default role column value
  
  2. Security
    - Enable RLS on users_metadata table
    - Add policies for admin and user access
*/

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users_metadata (id, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'teacher'))
  ON CONFLICT (id) DO UPDATE 
  SET role = EXCLUDED.role;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error (will appear in Postgres logs)
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled
ALTER TABLE public.users_metadata ENABLE ROW LEVEL SECURITY;

-- Update RLS policies
DROP POLICY IF EXISTS "Admin can manage all user metadata" ON public.users_metadata;
DROP POLICY IF EXISTS "Users can read own metadata" ON public.users_metadata;

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

CREATE POLICY "Users can read own metadata"
ON public.users_metadata
FOR SELECT
TO authenticated
USING (id = auth.uid());