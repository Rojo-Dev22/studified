/**
 * Quiz Me history — persisted in localStorage (results only; never mutates
 * question-bank data). SSR-safe.
 */
import { HISTORY_LIMIT } from './config.js';

const STORAGE_KEY = 'studified_quizme_history_v1';

export function getQuizHistory() {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Saves a result plus the questions the student missed, so the "Last test"
 * card can show exactly where they lost marks. Review rows are stored compact
 * (only incorrect/unanswered ones) and capped to keep localStorage small.
 *
 * @returns {object} the saved entry.
 */
export function saveQuizResult(session, result, review = []) {
  const missed = (Array.isArray(review) ? review : [])
    .filter((row) => row && !row.isCorrect)
    .slice(0, 50)
    .map((row) => ({
      text: row.text,
      pickedText: row.pickedText || null,
      correctText: row.correctText,
      explanation: row.explanation,
      topicName: row.topicName || '',
      difficulty: row.difficulty || null,
    }));

  const entry = {
    id: session.id,
    savedAt: new Date().toISOString(),
    grade: session.grade,
    subjectId: session.subjectId,
    subjectName: session.subjectName,
    topicId: session.topicId,
    topicName: session.topicName,
    total: result.total,
    correct: result.correct,
    percent: result.percent,
    xpEarned: result.xpEarned,
    missed,
  };
  try {
    if (typeof localStorage !== 'undefined') {
      const next = [entry, ...getQuizHistory()].slice(0, HISTORY_LIMIT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    }
  } catch {
    /* storage full/unavailable — history is non-critical */
  }
  return entry;
}

export function clearQuizHistory() {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* non-critical */
  }
}
