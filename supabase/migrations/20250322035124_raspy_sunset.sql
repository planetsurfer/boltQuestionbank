/*
  # Create questions table for database management system

  1. New Tables
    - `questions`
      - All fields from CSV structure
      - Added metadata fields for tracking

  2. Security
    - Enable RLS on questions table
    - Add policies for authenticated users to perform CRUD operations

  3. Indexes
    - Add indexes on commonly queried fields
*/

-- Create the questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_title text NOT NULL,
  level text NOT NULL,
  subject_id uuid REFERENCES subjects(id),
  marks integer NOT NULL,
  paper text,
  question_number text,
  reference_code text,
  timezone text,
  adapted_from text,
  question_diagram text,
  markscheme_image text,
  question_body text NOT NULL,
  markscheme_body text,
  examiner_report text,
  published_date date,
  question_html text,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to select questions"
  ON questions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert questions"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update questions"
  ON questions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete questions"
  ON questions
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_questions_level ON questions(level);
CREATE INDEX IF NOT EXISTS idx_questions_reference_code ON questions(reference_code);
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);

-- Add trigger for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();