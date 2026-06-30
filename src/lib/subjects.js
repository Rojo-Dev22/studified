/** Subjects aligned with the Ethiopian General Education Curriculum (MoE). */

export const CURRICULUM_FRAMEWORK =
  'Ethiopian General Education Curriculum (Federal Democratic Republic of Ethiopia — Ministry of Education)';

export const GRADES = [9, 10, 11, 12];

export const SUBJECTS = [
  'math',
  'english',
  'amharic',
  'physics',
  'chemistry',
  'biology',
  'history',
  'geography',
  'civics',
  'economics',
  'ict',
];

export const SUBJECT_LABELS = {
  math: 'Mathematics',
  english: 'English',
  amharic: 'Amharic (አማርኛ)',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  history: 'History',
  geography: 'Geography',
  civics: 'Civics & Ethical Education',
  economics: 'Economics',
  ict: 'ICT',
};

export function formatSubject(category) {
  return SUBJECT_LABELS[category] || category?.replace(/^\w/, (c) => c.toUpperCase()) || 'General';
}

export function formatGrade(grade) {
  return grade ? `Grade ${grade}` : '';
}
