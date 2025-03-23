/*
  # Fix subject topics table

  1. Changes
    - Drop and recreate subject_topics table with proper cleanup
    - Set up proper RLS policies
    - Add initial topic data for each subject

  2. Security
    - Enable RLS
    - Add policy for authenticated users to read topics
*/

-- Drop everything related to subject_topics with proper cleanup
DO $$ 
BEGIN
  -- Drop policies first
  DROP POLICY IF EXISTS "Anyone can read subject topics" ON subject_topics;
  
  -- Drop the table with CASCADE to remove dependencies
  DROP TABLE IF EXISTS subject_topics CASCADE;
END $$;

-- Create the table fresh
CREATE TABLE subject_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  topic text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subject, topic)
);

-- Enable RLS
ALTER TABLE subject_topics ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Anyone can read subject topics"
  ON subject_topics
  FOR SELECT
  TO authenticated
  USING (true);

-- Add initial data
INSERT INTO subject_topics (subject, topic)
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