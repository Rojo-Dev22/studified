/**
 * Recently-served question memory — the anti-repetition mechanism.
 *
 * Every time a quiz session is built, its question ids are recorded per
 * grade+subject (most recent last). The engine then prefers questions the
 * student has NOT seen recently and only recycles (least-recently-seen first)
 * once the unseen pool runs dry, so each bank cycles evenly instead of
 * repeating at random. SSR-safe, like history.js.
 */
import { RECENT_QUESTIONS_LIMIT } from './config.js';

const keyFor = (grade, subjectId) => `studified_quizme_seen_${grade}_${subjectId}`;

/** @returns {string[]} recently-served question ids, oldest first. */
export function getRecentQuestionIds(grade, subjectId) {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(keyFor(grade, subjectId));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Records questions as served (ids are re-appended so they move to the
 * most-recent end), trimmed to RECENT_QUESTIONS_LIMIT.
 * @returns {string[]} the updated list (oldest first).
 */
export function markQuestionsUsed(grade, subjectId, ids = []) {
  const clean = (Array.isArray(ids) ? ids : []).filter((id) => typeof id === 'string');
  try {
    if (typeof localStorage === 'undefined' || !clean.length) return [];
    const previous = getRecentQuestionIds(grade, subjectId).filter((id) => !clean.includes(id));
    const next = [...previous, ...clean].slice(-RECENT_QUESTIONS_LIMIT);
    localStorage.setItem(keyFor(grade, subjectId), JSON.stringify(next));
    return next;
  } catch {
    return []; // storage unavailable — repetition avoidance is non-critical
  }
}

/** Dev/reset utility. */
export function clearRecentQuestions(grade, subjectId) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(keyFor(grade, subjectId));
  } catch {
    /* non-critical */
  }
}