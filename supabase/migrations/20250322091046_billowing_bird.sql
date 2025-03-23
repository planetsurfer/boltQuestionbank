/*
  # Create questions table

  1. New Tables
    - `questions`
      - `id` (uuid, primary key)
      - `question_title` (text)
      - `level` (text)
      - `subject` (text)
      - `marks` (text)
      - `paper` (text, nullable)
      - `question_number` (text, nullable)
      - `reference_code` (text, nullable)
      - `timezone` (text, nullable)
      - `adapted_from` (text, nullable)
      - `question_diagram` (text, nullable)
      - `markscheme_image` (text, nullable)
      - `question_body` (text)
      - `markscheme_body` (text, nullable)
      - `examiner_report` (text, nullable)
      - `published_date` (text, nullable)
      - `question_html` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to read
    - Add policies for admin users to manage all questions
*/

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_title text NOT NULL,
    level text NOT NULL,
    subject text NOT NULL,
    marks text NOT NULL,
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
    published_date text,
    question_html text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at trigger
CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can read questions"
    ON questions
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin users can manage all questions"
    ON questions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users_metadata um
            WHERE um.id = auth.uid() AND um.role = 'admin'
        )
    );