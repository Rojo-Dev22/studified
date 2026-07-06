import { checkAndUnlockAchievements } from '@/lib/cloudDatabase';

/**
 * Achievement definitions for the gamification system
 */
export const ACHIEVEMENTS = {
  // Quest achievements
  first_quest: {
    id: 'first_quest',
    name: 'First Quest',
    description: 'Complete your first quest',
    icon: 'Star',
    check: (stats) => (stats.quests_completed || 0) >= 1,
  },
  ten_quests: {
    id: 'ten_quests',
    name: 'Task Master',
    description: 'Complete 10 quests',
    icon: 'Trophy',
    check: (stats) => (stats.quests_completed || 0) >= 10,
  },
  fifty_quests: {
    id: 'fifty_quests',
    name: 'Quest Legend',
    description: 'Complete 50 quests',
    icon: 'Sword',
    check: (stats) => (stats.quests_completed || 0) >= 50,
  },
  hundred_quests: {
    id: 'hundred_quests',
    name: 'Quest Champion',
    description: 'Complete 100 quests',
    icon: 'Crown',
    check: (stats) => (stats.quests_completed || 0) >= 100,
  },

  // Focus achievements
  first_focus: {
    id: 'first_focus',
    name: 'Focused Mind',
    description: 'Complete your first focus session',
    icon: 'Timer',
    check: (stats) => (stats.focus_sessions || 0) >= 1,
  },
  ten_hours: {
    id: 'ten_hours',
    name: 'Deep Work',
    description: 'Log 10 focus hours',
    icon: 'Brain',
    check: (stats) => (stats.focus_hours || 0) >= 10,
  },
  fifty_hours: {
    id: 'fifty_hours',
    name: 'Focus Master',
    description: 'Log 50 focus hours',
    icon: 'Zap',
    check: (stats) => (stats.focus_hours || 0) >= 50,
  },
  hundred_hours: {
    id: 'hundred_hours',
    name: 'Centurion',
    description: 'Log 100 focus hours',
    icon: 'Flame',
    check: (stats) => (stats.focus_hours || 0) >= 100,
  },

  // Streak achievements
  streak_3: {
    id: 'streak_3',
    name: 'On Fire',
    description: 'Maintain a 3-day streak',
    icon: 'Flame',
    check: (stats) => (stats.streak_days || 0) >= 3,
  },
  streak_7: {
    id: 'streak_7',
    name: 'Unstoppable',
    description: 'Maintain a 7-day streak',
    icon: 'Zap',
    check: (stats) => (stats.streak_days || 0) >= 7,
  },
  streak_14: {
    id: 'streak_14',
    name: 'Dedicated',
    description: 'Maintain a 14-day streak',
    icon: 'Target',
    check: (stats) => (stats.streak_days || 0) >= 14,
  },
  streak_30: {
    id: 'streak_30',
    name: 'Unbreakable',
    description: 'Maintain a 30-day streak',
    icon: 'Award',
    check: (stats) => (stats.streak_days || 0) >= 30,
  },

  // Level achievements
  level_5: {
    id: 'level_5',
    name: 'Scholar',
    description: 'Reach level 5',
    icon: 'BookOpen',
    check: (stats) => (stats.level || 1) >= 5,
  },
  level_10: {
    id: 'level_10',
    name: 'Sage',
    description: 'Reach level 10',
    icon: 'Lightbulb',
    check: (stats) => (stats.level || 1) >= 10,
  },
  level_20: {
    id: 'level_20',
    name: 'Master',
    description: 'Reach level 20',
    icon: 'GraduationCap',
    check: (stats) => (stats.level || 1) >= 20,
  },
  level_50: {
    id: 'level_50',
    name: 'Legend',
    description: 'Reach level 50',
    icon: 'Crown',
    check: (stats) => (stats.level || 1) >= 50,
  },

  // XP achievements
  xp_1000: {
    id: 'xp_1000',
    name: 'Rising Star',
    description: 'Earn 1,000 total XP',
    icon: 'Star',
    check: (stats) => (stats.total_xp || 0) >= 1000,
  },
  xp_5000: {
    id: 'xp_5000',
    name: 'XP Hunter',
    description: 'Earn 5,000 total XP',
    icon: 'Target',
    check: (stats) => (stats.total_xp || 0) >= 5000,
  },
  xp_10000: {
    id: 'xp_10000',
    name: 'XP Master',
    description: 'Earn 10,000 total XP',
    icon: 'Trophy',
    check: (stats) => (stats.total_xp || 0) >= 10000,
  },
  xp_50000: {
    id: 'xp_50000',
    name: 'XP Legend',
    description: 'Earn 50,000 total XP',
    icon: 'Crown',
    check: (stats) => (stats.total_xp || 0) >= 50000,
  },

  // Social achievements
  social: {
    id: 'social',
    name: 'Social Butterfly',
    description: 'Join a guild',
    icon: 'Heart',
    check: (stats) => (stats.guilds?.length || 0) > 0,
  },
  guild_leader: {
    id: 'guild_leader',
    name: 'Guild Leader',
    description: 'Lead a guild',
    icon: 'Shield',
    check: (stats) => (stats.guilds_led || 0) >= 1,
  },

  // Special achievements
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete a quest before 8 AM',
    icon: 'Sun',
    check: (stats) => stats.early_bird_completed || false,
  },
  night_owl: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete a quest after 10 PM',
    icon: 'Moon',
    check: (stats) => stats.night_owl_completed || false,
  },
  speed_demon: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a quest in under 5 minutes',
    icon: 'Zap',
    check: (stats) => stats.speed_demon_completed || false,
  },
  perfectionist: {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Score 100% on a quest',
    icon: 'CheckCircle',
    check: (stats) => stats.perfect_score || false,
  },
};

/**
 * Check all achievements for a user and unlock new ones
 */
export async function checkAchievements(uid, userStats) {
  if (!uid || !userStats) return [];

  const newAchievements = [];
  const stats = {
    quests_completed: userStats.quests_completed || 0,
    focus_hours: userStats.focus_hours || 0,
    focus_sessions: userStats.focus_sessions || 0,
    streak_days: userStats.streak_days || 0,
    level: userStats.level || 1,
    total_xp: userStats.total_xp || 0,
    guilds: userStats.guilds || [],
    guilds_led: userStats.guilds_led || 0,
  };

  for (const [achievementId, achievement] of Object.entries(ACHIEVEMENTS)) {
    if (achievement.check(stats)) {
      const unlocked = await unlockAchievement(uid, achievement);
      if (unlocked) {
        newAchievements.push(achievement);
      }
    }
  }

  return newAchievements;
}

/**
 * Unlock achievement for user
 */
async function unlockAchievement(uid, achievement) {
  try {
    const { unlockAchievement: unlockCloudAchievement } = await import('@/lib/cloudDatabase');
    const result = await unlockCloudAchievement(uid, achievement.id, {
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
    });
    return result;
  } catch (err) {
    console.error('Failed to unlock achievement:', err);
    return false;
  }
}

/**
 * Get all achievement definitions
 */
export function getAllAchievements() {
  return Object.values(ACHIEVEMENTS);
}

/**
 * Get achievement by ID
 */
export function getAchievementById(achievementId) {
  return ACHIEVEMENTS[achievementId] || null;
}

/**
 * Check specific achievement conditions
 */
export function checkSpecialAchievements(questData, focusData) {
  const specials = [];
  const now = new Date();
  const hour = now.getHours();

  // Early bird (before 8 AM)
  if (hour < 8 && questData?.completed) {
    specials.push('early_bird');
  }

  // Night owl (after 10 PM)
  if (hour >= 22 && questData?.completed) {
    specials.push('night_owl');
  }

  // Speed demon (completed in under 5 minutes)
  if (questData?.duration_minutes && questData.duration_minutes < 5 && questData.completed) {
    specials.push('speed_demon');
  }

  // Perfectionist (100% score)
  if (questData?.score === 100) {
    specials.push('perfectionist');
  }

  return specials;
}