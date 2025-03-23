// Initial question titles
export const DEFAULT_QUESTION_TITLES = [
  'Algebra Basics',
  'Calculus Fundamentals',
  'Geometry Problems',
  'Linear Equations',
  'Matrices and Determinants',
  'Number Theory',
  'Probability',
  'Statistics',
  'Trigonometry',
  'Vector Analysis'
];

// Initial subjects
export const DEFAULT_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science'
];

// Initial levels
export const DEFAULT_LEVELS = [
  'HL',
  'SL'
];

// Get titles from localStorage or use defaults
export function getQuestionTitles(): string[] {
  const stored = localStorage.getItem('questionTitles');
  return stored ? JSON.parse(stored) : DEFAULT_QUESTION_TITLES;
}

// Get subjects from localStorage or use defaults
export function getSubjects(): string[] {
  const stored = localStorage.getItem('subjects');
  return stored ? JSON.parse(stored) : DEFAULT_SUBJECTS;
}

// Get levels from localStorage or use defaults
export function getLevels(): string[] {
  const stored = localStorage.getItem('levels');
  return stored ? JSON.parse(stored) : DEFAULT_LEVELS;
}

// Save titles to localStorage
export function saveQuestionTitles(titles: string[]): void {
  localStorage.setItem('questionTitles', JSON.stringify(titles));
}

// Save subjects to localStorage
export function saveSubjects(subjects: string[]): void {
  localStorage.setItem('subjects', JSON.stringify(subjects));
}

// Save levels to localStorage
export function saveLevels(levels: string[]): void {
  localStorage.setItem('levels', JSON.stringify(levels));
}