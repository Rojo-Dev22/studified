/**
 * Scoring — XP comes exclusively from question difficulty (easy=10, medium=15,
 * hard=20). The UI can never award arbitrary XP.
 */
import { DIFFICULTY_XP } from './config.js';

/**
 * @param {object} session  quiz session from the engine
 * @param {object} answers  { [sourceId]: selectedOptionId }
 */
export function scoreSession(session, answers = {}) {
  const questions = session?.questions || [];
  const total = questions.length;
  let correct = 0;
  let xpEarned = 0;
  let unanswered = 0;

  for (const q of questions) {
    const picked = answers[q.sourceId];
    if (!picked) {
      unanswered += 1;
      continue;
    }
    if (picked === q.correctOptionId) {
      correct += 1;
      xpEarned += q.xp ?? DIFFICULTY_XP[q.difficulty] ?? 0;
    }
  }

  return {
    total,
    correct,
    incorrect: total - correct,
    unanswered,
    percent: total ? Math.round((correct / total) * 100) : 0,
    xpEarned,
  };
}

/** Per-question review rows for the results screen. */
export function buildReview(session, answers = {}) {
  return (session?.questions || []).map((q, index) => {
    const pickedId = answers[q.sourceId];
    const picked = q.options.find((o) => o.id === pickedId) || null;
    const correctOption = q.options.find((o) => o.id === q.correctOptionId) || null;
    return {
      index,
      sourceId: q.sourceId,
      text: q.text,
      topicName: q.topicName,
      difficulty: q.difficulty,
      xp: q.xp,
      pickedText: picked?.text || null,
      correctText: correctOption?.text || '',
      isCorrect: !!pickedId && pickedId === q.correctOptionId,
      isUnanswered: !pickedId,
      explanation: q.explanation,
    };
  });
}
