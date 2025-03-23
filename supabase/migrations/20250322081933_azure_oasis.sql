/*
  # Add trigger for automatic user metadata creation

  1. Changes
    - Add trigger function to handle new user creation
    - Add trigger to automatically create user metadata entry

  2. Security
    - Maintains existing RLS policies
    - Ensures every new user gets a metadata entry
*/

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users_metadata (id, role)
  VALUES (NEW.id, 'teacher')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create user metadata
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();