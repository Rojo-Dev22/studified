/**
 * Quiz engine — builds quiz sessions from question-bank data.
 *
 * - Pure functions: imported source questions are NEVER mutated (runtime
 *   copies with shuffled options are created per session).
 * - Selection is random (Fisher-Yates), difficulty-balanced when possible,
 *   never duplicated within a quiz, never "first N".
 * - The actual valid question pool always wins over any requested count or
 *   index claim.
 */
import { ACTIVE_GRADE, DIFFICULTY_XP } from './config.js';
import { QuizDataError, loadQuestionBank, loadTopics, getTopicsForGrade } from './catalogService.js';
import { validateBank } from './validation.js';

export function shuffleArray(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Difficulty-balanced random selection: an even quota per difficulty first,
 * then round-robin distribution. If a perfect ratio is impossible the valid
 * pool takes priority (never fails on ratio).
 */
function balancedSelect(pool, count) {
  const groups = { easy: [], medium: [], hard: [] };
  shuffleArray(pool).forEach((q) => groups[q.difficulty]?.push(q));
  const order = shuffleArray(Object.keys(groups));
  const selected = [];
  const quota = Math.floor(count / 3);
  for (const d of order) selected.push(...groups[d].splice(0, Math.min(quota, groups[d].length)));
  while (selected.length < count) {
    let took = false;
    for (const d of order) {
      if (selected.length >= count) break;
      if (groups[d].length) {
        selected.push(groups[d].shift());
        took = true;
      }
    }
    if (!took) break;
  }
  return shuffleArray(selected);
}

/** Creates the runtime (shuffled, non-mutating) copy of a question. */
function buildRuntimeQuestion(q) {
  const options = shuffleArray(q.options).map((text, i) => ({ id: `o${i + 1}`, text }));
  const correctOption = options.find((o) => o.text === q.correctAnswer);
  return {
    sourceId: q.id,
    text: q.question,
    difficulty: q.difficulty,
    xp: DIFFICULTY_XP[q.difficulty],
    explanation: q.explanation,
    topicId: q.topicId,
    topicName: q.topicName,
    options,
    correctOptionId: correctOption.id,
  };
}

/**
 * Fresh-first selection with LRU recycling — the anti-repetition mechanism.
 *
 * 1. Questions the student has NOT seen recently are picked first (random,
 *    difficulty-balanced).
 * 2. Only when the unseen pool is smaller than the requested count are
 *    recently-seen questions recycled — least-recently-seen first — so the
 *    bank cycles evenly instead of repeating at random.
 * `recentIds` is ordered oldest-seen first (as stored by recents.js).
 */
function selectSessionQuestions(pool, count, recentIds = []) {
  if (!recentIds.length) return balancedSelect(pool, count);
  const recentSet = new Set(recentIds);
  const seenRank = new Map(recentIds.map((id, index) => [id, index])); // lower = seen longer ago
  const fresh = pool.filter((q) => !recentSet.has(q.id));
  const stale = pool
    .filter((q) => recentSet.has(q.id))
    .sort((a, b) => (seenRank.get(a.id) ?? 0) - (seenRank.get(b.id) ?? 0));
  const picked =
    fresh.length >= count
      ? balancedSelect(fresh, count)
      : [...balancedSelect(fresh, fresh.length), ...stale.slice(0, count - fresh.length)];
  return shuffleArray(picked);
}

/**
 * Builds a session from an already-loaded bank (pure — used by tests too).
 *
 * @param {object} bank              raw bank JSON (as loaded from quiz_data)
 * @param {number} grade             active grade
 * @param {object} subject           { id, name } from subjects.json
 * @param {Array}  topicsForSubject  topics.json topics for grade + subject
 * @param {string} topicId          'all' (All Topics) or a topics.json topic id
 * @param {number} requestedCount    how many questions were requested
 * @param {string[]} recentIds       recently-served ids (oldest first) to avoid repeating
 */
export function createQuizSessionFromBank({ bank, grade, subject, topicsForSubject, topicId = 'all', requestedCount, recentIds = [] }) {
  const { valid } = validateBank(bank, { grade, subjectId: subject.id, subjectName: subject.name, topicsForSubject });
  if (!valid.length) {
    throw new QuizDataError('NO_VALID_QUESTIONS', `No valid Grade ${grade} questions are available for ${subject.name}.`);
  }

  let pool = valid;
  if (topicId && topicId !== 'all') {
    pool = valid.filter((q) => q.topicId === topicId);
    if (!pool.length) {
      throw new QuizDataError('NO_QUESTIONS_FOR_TOPIC', `No valid questions exist for the selected ${subject.name} topic yet.`);
    }
  }

  const count = Math.max(1, Math.min(requestedCount, pool.length));
  const selected = selectSessionQuestions(pool, count, recentIds);
  const questions = selected.map(buildRuntimeQuestion);
  const topicName = topicId && topicId !== 'all' ? (topicsForSubject.find((t) => t.id === topicId)?.name || topicId) : 'All Topics';

  return {
    id: `qz_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    grade,
    subjectId: subject.id,
    subjectName: subject.name,
    topicId: topicId || 'all',
    topicName,
    requestedCount,
    count,
    availableCount: pool.length,
    questions,
    maxPossibleXP: questions.reduce((sum, q) => sum + q.xp, 0),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Loads the correct Grade 9 bank via the config files, then builds a session.
 * This is the quiz engine's public entry point.
 */
export async function createQuizSession({ subject, grade = ACTIVE_GRADE, topicId = 'all', requestedCount, recentIds = [] }) {
  const [bank, topicsData] = await Promise.all([loadQuestionBank(subject, grade), loadTopics()]);
  const topicsForSubject = getTopicsForGrade(topicsData, grade, subject.id);
  if (!topicsForSubject.length) {
    throw new QuizDataError('NO_TOPICS', `topics.json has no topics for ${subject.name} in Grade ${grade}.`);
  }
  return createQuizSessionFromBank({ bank, grade, subject, topicsForSubject, topicId, requestedCount, recentIds });
}
