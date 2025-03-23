/*
  # Update Questions Table Schema

  1. Changes
    - Update questions table with all required fields
    - Set appropriate data types and constraints
    - Ensure RLS policies are maintained
*/

-- Drop existing table
DROP TABLE IF EXISTS questions CASCADE;

-- Create questions table with updated schema
CREATE TABLE questions (
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

-- Create updated_at trigger
CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users"
    ON questions
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Enable insert for all users"
    ON questions
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Enable update for all users"
    ON questions
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for all users"
    ON questions
    FOR DELETE
    TO public
    USING (true);