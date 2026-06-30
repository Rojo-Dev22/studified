import { getBuiltinAssignments, getBuiltinChallenges } from './ethiopianCurriculum';
import { attachExercisesToQuest, attachExercisesToRaid } from './curriculumExercises';

function mergeByCurriculumId(builtinList, existingList) {
  const existingMap = new Map(
    (existingList || [])
      .filter((item) => item.curriculum_id)
      .map((item) => [item.curriculum_id, item])
  );

  return builtinList.map((builtin) => {
    const prev = existingMap.get(builtin.curriculum_id);
    const merged = prev
      ? {
          ...builtin,
          id: prev.id,
          status: prev.status ?? builtin.status,
          accepted_by: prev.accepted_by,
          participant_emails: prev.participant_emails ?? builtin.participant_emails,
          leader_email: prev.leader_email ?? builtin.leader_email,
          exercise_answers: prev.exercise_answers ?? {},
          exercise_submitted: prev.exercise_submitted ?? false,
          exercise_passed: prev.exercise_passed ?? false,
          exercise_score: prev.exercise_score ?? null,
          created_date: prev.created_date ?? builtin.created_date,
          updated_date: prev.updated_date ?? builtin.updated_date,
        }
      : { ...builtin };

    return builtin.curriculum_id?.startsWith('eth-ch-')
      ? attachExercisesToRaid(merged)
      : attachExercisesToQuest(merged);
  });
}

/** Ensure only MoE-aligned built-in assignments & challenges exist in the store. */
export function syncCurriculumToStore(store) {
  const assignments = getBuiltinAssignments();
  const challenges = getBuiltinChallenges();

  const next = {
    ...store,
    Quest: mergeByCurriculumId(assignments, store.Quest),
    Raid: mergeByCurriculumId(challenges, store.Raid),
  };

  return next;
}
