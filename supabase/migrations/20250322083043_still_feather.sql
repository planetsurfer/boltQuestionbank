/*
  # Fix users metadata table and dependencies

  1. Changes
    - Drop dependent policies first
    - Recreate users_metadata table with proper structure
    - Set up improved trigger function
    - Establish proper RLS policies
*/

-- Drop dependent policies first
DROP POLICY IF EXISTS "Admin can manage subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admin can manage questions" ON public.questions;

-- Drop existing objects to ensure clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.users_metadata;

-- Create users_metadata table
CREATE TABLE public.users_metadata (
    id uuid PRIMARY KEY,
    role text NOT NULL DEFAULT 'teacher',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT fk_user FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
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

-- Create function to handle new user creation with robust error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_role text;
BEGIN
    -- Get role from metadata or use default
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'teacher');
    
    -- Insert user metadata
    BEGIN
        INSERT INTO public.users_metadata (id, role)
        VALUES (NEW.id, v_role);
    EXCEPTION 
        WHEN unique_violation THEN
            -- If record already exists, update it
            UPDATE public.users_metadata 
            SET role = v_role 
            WHERE id = NEW.id;
        WHEN OTHERS THEN
            -- Log any other errors but don't fail the transaction
            RAISE LOG 'Error in handle_new_user for user %: %, SQLSTATE: %', 
                NEW.id, 
                SQLERRM,
                SQLSTATE;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user handling
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.users_metadata ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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
            SELECT 1 
            FROM public.users_metadata um 
            WHERE um.id = auth.uid() AND um.role = 'admin'
        )
    );

-- Recreate the dependent policies
CREATE POLICY "Admin can manage subjects"
    ON public.subjects
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.users_metadata
            WHERE users_metadata.id = auth.uid()
            AND users_metadata.role = 'admin'
        )
    );

CREATE POLICY "Admin can manage questions"
    ON public.questions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.users_metadata
            WHERE users_metadata.id = auth.uid()
            AND users_metadata.role = 'admin'
        )
    );