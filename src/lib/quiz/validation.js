/**
 * Runtime question validation — mirrors the rules enforced by
 * scripts/generate-quiz-index.cjs so the app and the dev tooling agree.
 *
 * Invalid questions are EXCLUDED from selection and never modified: the
 * actual question-bank file is the ultimate source of truth.
 */
import { DIFFICULTIES, DIFFICULTY_XP } from './config.js';
import { normalizeTopicKey, resolveTopicId } from './topicMapping.js';

export function validateQuestion(q, { grade, subjectName, topicsForSubject }) {
  const errors = [];
  if (!q || typeof q !== 'object' || Array.isArray(q)) {
    return { valid: false, errors: ['not an object'], topicId: null };
  }
  if (typeof q.id !== 'string' || !q.id.trim()) errors.push('missing id');
  if (Number(q.grade) !== grade) errors.push(`grade mismatch (${JSON.stringify(q.grade)} !== ${grade})`);
  if (normalizeTopicKey(q.subject) !== normalizeTopicKey(subjectName)) {
    errors.push(`subject mismatch (${JSON.stringify(q.subject)} !== ${subjectName})`);
  }
  if (typeof q.question !== 'string' || !q.question.trim()) errors.push('missing question text');
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    errors.push(`option count ${Array.isArray(q.options) ? q.options.length : 'n/a'} !== 4`);
  } else {
    if (q.options.some((o) => typeof o !== 'string' || !o.trim())) errors.push('empty option text');
    if (new Set(q.options).size !== q.options.length) errors.push('duplicate options');
  }
  if (typeof q.correctAnswer !== 'string' || !q.correctAnswer.trim()) errors.push('missing correctAnswer');
  else if (Array.isArray(q.options) && !q.options.includes(q.correctAnswer)) {
    errors.push('correctAnswer does not match any option');
  }
  if (typeof q.explanation !== 'string' || !q.explanation.trim()) errors.push('missing explanation');
  if (!DIFFICULTIES.includes(q.difficulty)) errors.push(`invalid difficulty ${JSON.stringify(q.difficulty)}`);
  else if (q.xp !== DIFFICULTY_XP[q.difficulty]) {
    errors.push(`xp ${JSON.stringify(q.xp)} !== ${DIFFICULTY_XP[q.difficulty]} for ${q.difficulty}`);
  }

  const { topicId } = topicsForSubject ? resolveTopicId(q, topicsForSubject) : { topicId: null };
  if (topicsForSubject && !topicId) errors.push(`topic "${q.topic}" not resolvable to the topics.json registry`);

  return { valid: errors.length === 0, errors, topicId };
}

/**
 * Validates a whole bank and returns the usable questions annotated with
 * their authoritative topicId/topicName, plus a stats/report object.
 */
export function validateBank(bankJson, { grade, subjectId, subjectName, topicsForSubject }) {
  const questions = Array.isArray(bankJson?.questions) ? bankJson.questions : [];
  const valid = [];
  const invalid = [];
  const seenIds = new Set();
  const seenText = new Set();
  const stats = {
    total: questions.length,
    duplicates: 0,
    duplicateIds: [],
    duplicateText: [],
    difficulty: { easy: 0, medium: 0, hard: 0 },
    topics: {},
  };

  for (const q of questions) {
    const { valid: ok, errors, topicId } = validateQuestion(q, { grade, subjectName, topicsForSubject });
    if (!ok) {
      invalid.push({ id: q?.id ?? '(no id)', errors });
      continue;
    }
    if (seenIds.has(q.id)) {
      stats.duplicates += 1;
      stats.duplicateIds.push(q.id);
      continue;
    }
    const tkey = normalizeTopicKey(q.question);
    if (seenText.has(tkey)) {
      stats.duplicates += 1;
      stats.duplicateText.push(q.id);
      continue;
    }
    seenIds.add(q.id);
    seenText.add(tkey);

    const topic = topicsForSubject.find((t) => t.id === topicId) || null;
    valid.push({ ...q, topicId, topicName: topic?.name || '' });
    stats.difficulty[q.difficulty] += 1;
    if (topicId) stats.topics[topicId] = (stats.topics[topicId] || 0) + 1;
  }

  if (invalid.length) {
    console.warn(`[quiz] ${subjectId} G${grade}: ${invalid.length} invalid question(s) excluded:`, invalid.slice(0, 10));
  }
  return { valid, invalid, stats };
}
