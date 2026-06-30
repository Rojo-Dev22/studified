import { DEMO_USER, PEOPLE } from './people';
import { getBuiltinAssignments, getBuiltinChallenges } from './ethiopianCurriculum';
import { attachExercisesToQuest, attachExercisesToRaid } from './curriculumExercises';

const now = Date.now();
const daysAgo = (d) => new Date(now - d * 86400000).toISOString();

const P = PEOPLE;

export { DEMO_USER };

function freshQuest(q, i) {
  const dates = { created_date: daysAgo(Math.min(i, 10)), updated_date: daysAgo(0) };
  return attachExercisesToQuest({
    ...q,
    ...dates,
    status: 'available',
    accepted_by: undefined,
    exercise_answers: {},
    exercise_submitted: false,
    exercise_passed: false,
    exercise_score: null,
  });
}

function freshRaid(r, i) {
  const dates = { created_date: daysAgo(Math.min(i, 5)), updated_date: daysAgo(0) };
  return attachExercisesToRaid({
    ...r,
    ...dates,
    status: 'recruiting',
    participant_emails: [],
    leader_email: undefined,
    exercise_answers: {},
    exercise_submitted: false,
    exercise_passed: false,
    exercise_score: null,
  });
}

/** New Firebase user — personal progress reset, shared curriculum catalog. */
export function createInitialStoreForUser(profile) {
  const quests = getBuiltinAssignments().map(freshQuest);
  const raids = getBuiltinChallenges().map(freshRaid);
  const guilds = [
    {
      id: 'guild-1',
      name: 'Grade 10 Mathematics',
      description: 'MoE Unit 3 quadratic equations — daily problem practice.',
      emblem: 'star',
      rank: 'B',
      total_xp: 0,
      member_emails: [profile.email],
      leader_email: profile.email,
      max_members: 10,
      created_date: daysAgo(0),
      updated_date: daysAgo(0),
    },
  ];
  const currentUser = {
    ...profile,
    caption: profile.caption || '',
    specialities: profile.specialities || [],
    total_xp: profile.total_xp ?? 0,
    xp: profile.total_xp ?? 0,
    quests_completed: 0,
    focus_hours: 0,
    streak_days: 0,
    guild_id: 'guild-1',
  };
  return {
    Quest: quests,
    Raid: raids,
    Guild: guilds,
    GuildMessage: [],
    User: [currentUser],
    FocusSession: [],
    currentUser,
  };
}

export function getSeedData() {
  const quests = getBuiltinAssignments().map((q, i) => {
    const dates = { created_date: daysAgo(Math.min(i, 10)), updated_date: daysAgo(Math.min(i, 5)) };
    if (q.curriculum_id === 'eth-g10-chem-u2-d1') {
      return attachExercisesToQuest({
        ...q,
        ...dates,
        status: 'active',
        accepted_by: DEMO_USER.email,
        exercise_answers: { e1: ['b'] },
        exercise_submitted: false,
        exercise_passed: false,
      });
    }
    if (q.curriculum_id === 'eth-g9-bio-u1-d1') {
      return attachExercisesToQuest({
        ...q,
        ...dates,
        status: 'completed',
        accepted_by: DEMO_USER.email,
        exercise_passed: true,
        exercise_submitted: true,
        exercise_score: { correct: 4, total: 4, percent: 100 },
      });
    }
    return attachExercisesToQuest({ ...q, ...dates });
  });

  const raids = getBuiltinChallenges().map((r, i) => {
    const dates = { created_date: daysAgo(Math.min(i, 5)), updated_date: daysAgo(0) };
    if (r.curriculum_id === 'eth-ch-g10-phy-motion') {
      return attachExercisesToRaid({
        ...r,
        ...dates,
        status: 'active',
        participant_emails: [P.dawit.email, DEMO_USER.email],
        leader_email: P.dawit.email,
        exercise_passed: false,
        exercise_submitted: false,
      });
    }
    if (r.curriculum_id === 'eth-ch-g9-hist-adwa') {
      return attachExercisesToRaid({
        ...r,
        ...dates,
        participant_emails: [P.mulugeta.email],
        leader_email: P.mulugeta.email,
      });
    }
    return attachExercisesToRaid({ ...r, ...dates, leader_email: P.dawit.email });
  });

  const guilds = [
    { id: 'guild-1', name: 'Grade 10 Mathematics', description: 'MoE Unit 3 quadratic equations — daily problem practice.', emblem: 'star', rank: 'B', total_xp: 12400, member_emails: [DEMO_USER.email, P.mulugeta.email, P.dawit.email, P.tigist.email], leader_email: DEMO_USER.email, max_members: 10, created_date: daysAgo(30), updated_date: daysAgo(0) },
    { id: 'guild-2', name: 'Amharic & English Club', description: 'ንባብ, writing, and exit-exam essay support per Ethiopian curriculum.', emblem: 'moon', rank: 'C', total_xp: 8200, member_emails: [P.selamawit.email, P.bereket.email, P.nahom.email], leader_email: P.selamawit.email, max_members: 12, created_date: daysAgo(45), updated_date: daysAgo(1) },
    { id: 'guild-3', name: 'NEAE Prep STEM', description: 'Physics, chemistry, biology — aligned to MoE Grade 11–12 units.', emblem: 'flame', rank: 'A', total_xp: 18900, member_emails: [P.dawit.email, P.tigist.email, P.mulugeta.email, P.nahom.email, P.bereket.email], leader_email: P.dawit.email, max_members: 8, created_date: daysAgo(60), updated_date: daysAgo(0) },
    { id: 'guild-4', name: 'Civics & History', description: 'FDRE Constitution, Adwa, and modern Ethiopia units.', emblem: 'shield', rank: 'C', total_xp: 6700, member_emails: [P.tigist.email, P.bereket.email], leader_email: P.tigist.email, max_members: 10, created_date: daysAgo(20), updated_date: daysAgo(2) },
  ];

  const users = [
    DEMO_USER,
    { id: 'user-2', email: P.dawit.email, full_name: P.dawit.full_name, total_xp: 5420, quests_completed: 24, focus_hours: 38.5, streak_days: 12 },
    { id: 'user-3', email: P.tigist.email, full_name: P.tigist.full_name, total_xp: 4890, quests_completed: 21, focus_hours: 32.0, streak_days: 9 },
    { id: 'user-4', email: P.mulugeta.email, full_name: P.mulugeta.full_name, total_xp: 4100, quests_completed: 18, focus_hours: 28.5, streak_days: 6 },
    { id: 'user-5', email: P.selamawit.email, full_name: P.selamawit.full_name, total_xp: 3650, quests_completed: 15, focus_hours: 25.0, streak_days: 4 },
    { id: 'user-6', email: P.bereket.email, full_name: P.bereket.full_name, total_xp: 2980, quests_completed: 12, focus_hours: 19.5, streak_days: 3 },
    { id: 'user-7', email: P.nahom.email, full_name: P.nahom.full_name, total_xp: 2210, quests_completed: 9, focus_hours: 15.0, streak_days: 2 },
    { id: 'user-8', email: P.rahel.email, full_name: P.rahel.full_name, total_xp: 1560, quests_completed: 5, focus_hours: 10.5, streak_days: 1 },
  ];

  const focusSessions = [
    { id: 'fs-1', duration_minutes: 25, subject: 'Grade 10 Mathematics — Unit 3', status: 'completed', actual_minutes: 25, xp_earned: 100, distraction_count: 0, created_date: daysAgo(0), updated_date: daysAgo(0) },
    { id: 'fs-2', duration_minutes: 45, subject: 'Grade 9 History — Adwa', status: 'completed', actual_minutes: 43, xp_earned: 172, distraction_count: 1, created_date: daysAgo(1), updated_date: daysAgo(1) },
    { id: 'fs-3', duration_minutes: 25, subject: 'Grade 10 English — Reading', status: 'completed', actual_minutes: 25, xp_earned: 100, distraction_count: 0, created_date: daysAgo(2), updated_date: daysAgo(2) },
    { id: 'fs-4', duration_minutes: 60, subject: 'Grade 10 Physics — Motion', status: 'completed', actual_minutes: 58, xp_earned: 232, distraction_count: 2, created_date: daysAgo(3), updated_date: daysAgo(3) },
    { id: 'fs-5', duration_minutes: 25, subject: 'Grade 10 Biology — Cells', status: 'completed', actual_minutes: 24, xp_earned: 96, distraction_count: 0, created_date: daysAgo(4), updated_date: daysAgo(4) },
  ];

  const guildMessages = [
    { id: 'msg-1', guild_id: 'guild-1', sender_email: P.mulugeta.email, sender_name: P.mulugeta.full_name, text: 'Who is doing quadratic factoring exercises tonight?', created_date: daysAgo(0) },
    { id: 'msg-2', guild_id: 'guild-1', sender_email: DEMO_USER.email, sender_name: P.hana.full_name, text: 'Yes — Unit 3 textbook problems at 7pm.', created_date: daysAgo(0) },
    { id: 'msg-3', guild_id: 'guild-4', sender_email: P.tigist.email, sender_name: P.tigist.full_name, text: 'Adwa timeline due Friday — share your drafts.', created_date: daysAgo(1) },
    { id: 'msg-4', guild_id: 'guild-3', sender_email: P.dawit.email, sender_name: P.dawit.full_name, text: 'Physics motion challenge is open — join in Challenges.', created_date: daysAgo(0) },
  ];

  return {
    Quest: quests,
    Raid: raids,
    Guild: guilds,
    GuildMessage: guildMessages,
    User: users,
    FocusSession: focusSessions,
    currentUser: { ...DEMO_USER },
  };
}
