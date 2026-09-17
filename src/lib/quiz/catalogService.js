/**
 * Data layer — loads and caches the authoritative configuration files
 * (subjects.json, topics.json, question_index.json) and the Grade 9 question
 * banks from /quiz_data (served from /public).
 *
 * All errors are normalized to QuizDataError so the UI can show friendly
 * messages instead of stack traces.
 */
import { ACTIVE_GRADE, QUIZ_DATA_BASE } from './config.js';

export class QuizDataError extends Error {
  constructor(code, message, cause = null) {
    super(message);
    this.name = 'QuizDataError';
    this.code = code;
    this.cause = cause;
  }
}

/** url -> in-flight/fulfilled Promise (module-level cache, survives re-renders). */
const cache = new Map();

async function fetchJSON(url) {
  if (!cache.has(url)) {
    cache.set(
      url,
      (async () => {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new QuizDataError('FETCH_FAILED', `${url} responded ${res.status}`);
          const data = await res.json();
          if (!data || typeof data !== 'object') throw new QuizDataError('MALFORMED', `${url} is not a valid JSON object`);
          return data;
        } catch (err) {
          cache.delete(url); // allow retry after transient failure
          if (err instanceof QuizDataError) throw err;
          throw new QuizDataError('MALFORMED', `${url} could not be parsed`, err);
        }
      })(),
    );
  }
  return cache.get(url);
}

/* ── subjects.json — authoritative subject registry ─────────────────────── */

export async function loadSubjects() {
  const data = await fetchJSON(`${QUIZ_DATA_BASE}/subjects.json`);
  if (!Array.isArray(data.subjects)) throw new QuizDataError('MALFORMED', 'subjects.json has no "subjects" array');
  return data;
}

/* ── topics.json — authoritative topic registry (grade-specific) ────────── */

export async function loadTopics() {
  const data = await fetchJSON(`${QUIZ_DATA_BASE}/topics.json`);
  if (!data.grades || typeof data.grades !== 'object') throw new QuizDataError('MALFORMED', 'topics.json has no "grades" registry');
  return data;
}

/** topics.json -> grades[String(grade)][subjectId] — never hardcode topics. */
export function getTopicsForGrade(topicsData, grade, subjectId) {
  const list = topicsData?.grades?.[String(grade)]?.[subjectId];
  return Array.isArray(list) ? list : [];
}

/* ── question_index.json — derived availability index ───────────────────── */

export async function loadQuestionIndex() {
  const data = await fetchJSON(`${QUIZ_DATA_BASE}/question_index.json`);
  if (!data.grades || typeof data.grades !== 'object') throw new QuizDataError('MALFORMED', 'question_index.json has no "grades" registry');
  return data;
}

export function getIndexEntry(indexData, grade, subjectId) {
  return indexData?.grades?.[String(grade)]?.[subjectId] || null;
}

/**
 * Subjects usable for a grade: subjects.json says the grade is supported AND
 * the index shows real question data. (Bank validity is re-verified against
 * the actual file when a quiz starts — the bank always wins.)
 */
export function getUsableSubjects({ subjectsData, indexData, grade = ACTIVE_GRADE }) {
  if (!subjectsData || !indexData) return [];
  return subjectsData.subjects.filter((s) => {
    if (!Array.isArray(s.grades) || !s.grades.includes(grade)) return false;
    const entry = getIndexEntry(indexData, grade, s.id);
    return !!entry && entry.totalQuestions > 0;
  });
}

/** Per-topic availability for the count picker, straight from the index. */
export function getTopicAvailability(indexData, grade, subjectId) {
  const entry = getIndexEntry(indexData, grade, subjectId);
  return entry?.topics || {};
}

/** Total availability for a subject (index fast-path). */
export function getSubjectAvailability(indexData, grade, subjectId) {
  const entry = getIndexEntry(indexData, grade, subjectId);
  return entry ? entry.totalQuestions : 0;
}

/* ── question banks — the ultimate source of question content ───────────── */

const bankCache = new Map(); // `${grade}:${subjectId}` -> Promise<bankJson>

export async function loadQuestionBank(subject, grade = ACTIVE_GRADE) {
  const key = `${grade}:${subject.id}`;
  if (!bankCache.has(key)) {
    bankCache.set(
      key,
      (async () => {
        // Path comes from the index (regenerated from the banks themselves).
        let file = null;
        try {
          const indexData = await loadQuestionIndex();
          file = getIndexEntry(indexData, grade, subject.id)?.file || null;
        } catch {
          /* index unavailable — fall back to subjects.json pattern */
        }
        if (!file) {
          if (!subject.questionBankPattern) {
            throw new QuizDataError('BANK_UNAVAILABLE', `No question bank location known for ${subject.name}`);
          }
          file = subject.questionBankPattern.replace('{grade}', String(grade));
        }
        try {
          return await fetchJSON(`${QUIZ_DATA_BASE}/${file}`);
        } catch (err) {
          throw new QuizDataError('BANK_UNAVAILABLE', `Question bank for ${subject.name} (Grade ${grade}) could not be loaded`, err);
        }
      })(),
    );
  }
  return bankCache.get(key);
}

/** Clears the in-memory caches (used by tests). */
export function clearQuizCaches() {
  cache.clear();
  bankCache.clear();
}
