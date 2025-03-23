/*
  # Fix user metadata handling

  1. Changes
    - Drop and recreate handle_new_user function with improved error handling
    - Ensure proper role assignment from metadata
    - Add explicit error handling for metadata creation
*/

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with improved error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role text;
BEGIN
  -- Get role from metadata or use default
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'teacher');
  
  -- Insert or update user metadata
  INSERT INTO public.users_metadata (id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (id) DO UPDATE 
  SET role = EXCLUDED.role
  RETURNING id INTO NEW.id;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log detailed error information
  RAISE LOG 'Error in handle_new_user for user %: %, SQLSTATE: %', 
    NEW.id, 
    SQLERRM,
    SQLSTATE;
  
  -- Ensure we still return the NEW record even if metadata creation fails
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger with AFTER INSERT timing
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();