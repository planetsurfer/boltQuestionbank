/*
  # Create subject_topics table with proper policies

  1. New Tables
    - `subject_topics`
      - `id` (uuid, primary key)
      - `subject` (text, not null)
      - `topic` (text, not null)
      - `created_at` (timestamptz)
      - Unique constraint on (subject, topic)

  2. Security
    - Enable RLS
    - Add policies for:
      - Select: All authenticated users can read
      - Insert: All authenticated users can add topics
      - Delete: All authenticated users can delete topics

  3. Initial Data
    - Add default topics for each subject
*/

-- Drop everything related to subject_topics with proper cleanup
DO $$ 
BEGIN
  -- Drop policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'subject_topics'
  ) THEN
    DROP POLICY IF EXISTS "Anyone can read subject topics" ON public.subject_topics;
    DROP POLICY IF EXISTS "Anyone can add topics" ON public.subject_topics;
    DROP POLICY IF EXISTS "Anyone can delete topics" ON public.subject_topics;
  END IF;
  
  -- Drop the table if it exists
  DROP TABLE IF EXISTS public.subject_topics CASCADE;
EXCEPTION
  WHEN others THEN
    -- Log any errors but continue
    RAISE NOTICE 'Error during cleanup: %', SQLERRM;
END $$;

-- Create the table fresh
CREATE TABLE public.subject_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  topic text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subject, topic)
);

-- Enable RLS
ALTER TABLE public.subject_topics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
  -- Select policy
  CREATE POLICY "Anyone can read subject topics"
    ON public.subject_topics
    FOR SELECT
    TO authenticated
    USING (true);

  -- Insert policy
  CREATE POLICY "Anyone can add topics"
    ON public.subject_topics
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

  -- Delete policy
  CREATE POLICY "Anyone can delete topics"
    ON public.subject_topics
    FOR DELETE
    TO authenticated
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Ignore if policies already exist
END $$;

-- Add initial data
INSERT INTO public.subject_topics (subject, topic)
VALUES 
  -- Mathematics topics
  ('Mathematics', 'Algebra Basics'),
  ('Mathematics', 'Calculus Fundamentals'),
  ('Mathematics', 'Geometry Problems'),
  ('Mathematics', 'Linear Equations'),
  ('Mathematics', 'Matrices and Determinants'),
  ('Mathematics', 'Number Theory'),
  ('Mathematics', 'Probability'),
  ('Mathematics', 'Statistics'),
  ('Mathematics', 'Trigonometry'),
  ('Mathematics', 'Vector Analysis'),
  
  -- Physics topics
  ('Physics', 'Mechanics'),
  ('Physics', 'Thermodynamics'),
  ('Physics', 'Waves'),
  ('Physics', 'Electricity'),
  ('Physics', 'Magnetism'),
  ('Physics', 'Nuclear Physics'),
  ('Physics', 'Quantum Physics'),
  
  -- Chemistry topics
  ('Chemistry', 'Atomic Structure'),
  ('Chemistry', 'Chemical Bonding'),
  ('Chemistry', 'Periodic Table'),
  ('Chemistry', 'Organic Chemistry'),
  ('Chemistry', 'Physical Chemistry'),
  ('Chemistry', 'Analytical Chemistry'),
  
  -- Biology topics
  ('Biology', 'Cell Biology'),
  ('Biology', 'Genetics'),
  ('Biology', 'Evolution'),
  ('Biology', 'Ecology'),
  ('Biology', 'Human Anatomy'),
  ('Biology', 'Plant Biology'),
  
  -- Computer Science topics
  ('Computer Science', 'Programming Fundamentals'),
  ('Computer Science', 'Data Structures'),
  ('Computer Science', 'Algorithms'),
  ('Computer Science', 'Database Systems'),
  ('Computer Science', 'Computer Networks'),
  ('Computer Science', 'Software Engineering')
ON CONFLICT (subject, topic) DO NOTHING;