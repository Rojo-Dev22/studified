/**
 * Quiz engine configuration.
 *
 * The architecture supports Grades 9-12 through the JSON config files, but
 * only ACTIVE_GRADE is exposed in the UI / quiz engine today. Activating a
 * future grade = add its banks + topics data, then change ACTIVE_GRADE (or
 * expose a picker) — no engine rewrite needed.
 */

/** The only grade currently active in the application. */
export const ACTIVE_GRADE = 9;

/** Grades the architecture can serve once their data exists. */
export const SUPPORTED_GRADES = [9, 10, 11, 12];

/** Base URL of the runtime quiz data (served from /public in Vite). */
export const QUIZ_DATA_BASE = '/quiz_data';

/** XP per question, derived from difficulty — the only XP source. */
export const DIFFICULTY_XP = { easy: 10, medium: 15, hard: 20 };
export const DIFFICULTIES = ['easy', 'medium', 'hard'];

/** Question-count choices offered in the UI (always capped by real availability). */
export const COUNT_CHOICES = [5, 10, 15, 20];

/** How many past results are kept in localStorage. */
export const HISTORY_LIMIT = 20;

/**
 * How many recently-served question ids are remembered per grade+subject so
 * quizzes avoid repeating questions until the bank has cycled through.
 */
export const RECENT_QUESTIONS_LIMIT = 300;
