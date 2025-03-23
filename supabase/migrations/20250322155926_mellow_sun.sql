/*
  # Create subject topics table and add initial data

  1. New Tables
    - `subject_topics`
      - `id` (uuid, primary key)
      - `subject` (text, not null)
      - `topic` (text, not null)
      - `created_at` (timestamp)
      - Unique constraint on subject + topic combination

  2. Security
    - Enable RLS on `subject_topics` table
    - Add policy for authenticated users to read topics
*/

-- Drop table if it exists to ensure clean state
DROP TABLE IF EXISTS subject_topics CASCADE;

-- Create subject_topics table
CREATE TABLE subject_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  topic text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subject, topic)
);

-- Enable RLS
ALTER TABLE subject_topics ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can read subject topics" ON subject_topics;

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