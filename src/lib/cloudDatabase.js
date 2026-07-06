import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  increment,
  arrayUnion,
  writeBatch
} from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from './firebase';

// ─── Database Collections ─────────────────────────────────────────

const COLLECTIONS = {
  USERS: 'users',
  LEADERBOARD: 'leaderboard',
  GUILDS: 'guilds',
};

// ─── User Profile Management ─────────────────────────────────────

/**
 * Save user profile to Firestore with change tracking
 */
export async function saveUserProfile(uid, profile, gameData = null) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    console.warn('Firebase not configured or missing uid');
    return false;
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    
    // Get existing profile to track changes
    const existingSnap = await getDoc(userRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : {};
    const existingProfile = existingData.profile || {};
    
    // Detect changes
    const changes = detectProfileChanges(existingProfile, profile);
    
    // Prepare clean profile data
    const cleanProfile = {
      email: String(profile.email || ''),
      full_name: String(profile.full_name || 'Student'),
      caption: String(profile.caption || ''),
      specialities: Array.isArray(profile.specialities) ? profile.specialities : [],
      avatar: String(profile.avatar || ''),
      interests: Array.isArray(profile.interests) ? profile.interests : [],
      location: String(profile.location || ''),
      social_github: String(profile.social_github || ''),
      social_twitter: String(profile.social_twitter || ''),
      social_website: String(profile.social_website || ''),
      total_xp: Number(profile.total_xp) || 0,
      xp: Number(profile.xp) || 0,
      quests_completed: Number(profile.quests_completed) || 0,
      focus_hours: Number(profile.focus_hours) || 0,
      streak_days: Number(profile.streak_days) || 0,
      grade: Number(profile.grade) || 10,
      updatedAt: serverTimestamp(),
    };

    // Save main user document
    const userData = {
      profile: cleanProfile,
      updatedAt: serverTimestamp(),
    };

    // Add game data if provided
    if (gameData) {
      userData.gameData = {
        Quest: Array.isArray(gameData.Quest) ? gameData.Quest : [],
        Raid: Array.isArray(gameData.Raid) ? gameData.Raid : [],
        Guild: Array.isArray(gameData.Guild) ? gameData.Guild : [],
        GuildMessage: Array.isArray(gameData.GuildMessage) ? gameData.GuildMessage : [],
        FocusSession: Array.isArray(gameData.FocusSession) ? gameData.FocusSession : [],
        User: Array.isArray(gameData.User) ? gameData.User : [],
      };
    }

    await setDoc(userRef, userData, { merge: true });

    // Save profile change history if there are changes
    if (changes.length > 0) {
      const changeRef = doc(collection(userRef, 'profileHistory'));
      await setDoc(changeRef, {
        changes: changes,
        changedAt: serverTimestamp(),
        previousValues: existingProfile,
        newValues: cleanProfile,
      });
    }

    // Update leaderboard
    await updateLeaderboard(uid, cleanProfile);

    console.log('✅ User profile saved to Firestore');
    return true;
  } catch (err) {
    console.error('❌ Failed to save user profile:', err);
    return false;
  }
}

/**
 * Detect changes between old and new profile
 */
function detectProfileChanges(oldProfile, newProfile) {
  const changes = [];
  const fieldsToTrack = [
    'full_name', 'caption', 'specialities', 'avatar', 'interests',
    'location', 'social_github', 'social_twitter', 'social_website'
  ];

  fieldsToTrack.forEach(field => {
    const oldVal = oldProfile[field];
    const newVal = newProfile[field];
    
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        field,
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  });

  return changes;
}

/**
 * Get user profile change history
 */
export async function getProfileHistory(uid, limitCount = 50) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    return [];
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const historyRef = collection(userRef, 'profileHistory');
    const q = query(historyRef, orderBy('changedAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      changedAt: doc.data().changedAt?.toDate() || new Date(),
    }));
  } catch (err) {
    console.error('Failed to fetch profile history:', err);
    return [];
  }
}

// ─── XP Management ───────────────────────────────────────────────

/**
 * Add XP transaction to user's history
 */
export async function addXPTransaction(uid, amount, source, description, metadata = {}) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    return false;
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    
    // Add XP transaction to history
    const transactionRef = doc(collection(userRef, 'xpHistory'));
    await setDoc(transactionRef, {
      amount: Number(amount),
      source: String(source),
      description: String(description),
      metadata: metadata,
      createdAt: serverTimestamp(),
    });

    // Update user's total XP
    await setDoc(userRef, {
      'profile.total_xp': increment(Number(amount)),
      'profile.xp': increment(Number(amount)),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    console.log(`✅ Added ${amount} XP to user ${uid}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to add XP transaction:', err);
    return false;
  }
}

/**
 * Get XP transaction history
 */
export async function getXPHistory(uid, limitCount = 100) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    return [];
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const xpRef = collection(userRef, 'xpHistory');
    const q = query(xpRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));
  } catch (err) {
    console.error('Failed to fetch XP history:', err);
    return [];
  }
}

// ─── Achievements System ─────────────────────────────────────────

/**
 * Unlock achievement for user
 */
export async function unlockAchievement(uid, achievementId, achievementData) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    return false;
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const achievementRef = doc(collection(userRef, 'achievements'), achievementId);
    
    await setDoc(achievementRef, {
      achievementId: String(achievementId),
      ...achievementData,
      unlockedAt: serverTimestamp(),
    }, { merge: true });

    console.log(`✅ Unlocked achievement ${achievementId} for user ${uid}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to unlock achievement:', err);
    return false;
  }
}

/**
 * Get user's achievements
 */
export async function getAchievements(uid) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    return [];
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const achievementsRef = collection(userRef, 'achievements');
    const snapshot = await getDocs(achievementsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      unlockedAt: doc.data().unlockedAt?.toDate() || new Date(),
    }));
  } catch (err) {
    console.error('Failed to fetch achievements:', err);
    return [];
  }
}

/**
 * Check and unlock achievements based on user stats
 */
export async function checkAndUnlockAchievements(uid, userStats) {
  const achievements = [];
  
  // Quest achievements
  if (userStats.quests_completed >= 1) {
    achievements.push({ id: 'first_quest', name: 'First Quest', description: 'Complete your first quest' });
  }
  if (userStats.quests_completed >= 10) {
    achievements.push({ id: 'ten_quests', name: 'Task Master', description: 'Complete 10 quests' });
  }
  if (userStats.quests_completed >= 50) {
    achievements.push({ id: 'fifty_quests', name: 'Quest Legend', description: 'Complete 50 quests' });
  }

  // Focus achievements
  if (userStats.focus_sessions >= 1) {
    achievements.push({ id: 'first_focus', name: 'Focused Mind', description: 'Complete first focus session' });
  }
  if (userStats.focus_hours >= 10) {
    achievements.push({ id: 'ten_hours', name: 'Deep Work', description: 'Log 10 focus hours' });
  }

  // Streak achievements
  if (userStats.streak_days >= 3) {
    achievements.push({ id: 'streak_3', name: 'On Fire', description: '3-day streak' });
  }
  if (userStats.streak_days >= 7) {
    achievements.push({ id: 'streak_7', name: 'Unstoppable', description: '7-day streak' });
  }

  // Level achievements
  if (userStats.level >= 5) {
    achievements.push({ id: 'level_5', name: 'Scholar', description: 'Reach level 5' });
  }
  if (userStats.level >= 10) {
    achievements.push({ id: 'level_10', name: 'Sage', description: 'Reach level 10' });
  }

  // Unlock all achievements
  for (const achievement of achievements) {
    await unlockAchievement(uid, achievement.id, achievement);
  }

  return achievements;
}

// ─── Assignment/Quest Tracking ───────────────────────────────────

/**
 * Save assignment completion to history
 */
export async function saveAssignmentCompletion(uid, assignmentData) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    return false;
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const assignmentRef = doc(collection(userRef, 'assignments'));
    
    const assignmentRecord = {
      ...assignmentData,
      completedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    await setDoc(assignmentRef, assignmentRecord);

    // Update user stats
    await setDoc(userRef, {
      'profile.quests_completed': increment(1),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    console.log('✅ Assignment completion saved');
    return true;
  } catch (err) {
    console.error('❌ Failed to save assignment completion:', err);
    return false;
  }
}

/**
 * Get assignment history
 */
export async function getAssignmentHistory(uid, limitCount = 100) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    return [];
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const assignmentsRef = collection(userRef, 'assignments');
    const q = query(assignmentsRef, orderBy('completedAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      completedAt: doc.data().completedAt?.toDate() || new Date(),
    }));
  } catch (err) {
    console.error('Failed to fetch assignment history:', err);
    return [];
  }
}

// ─── AI Chat History ─────────────────────────────────────────────

/**
 * Save AI chat interaction
 */
export async function saveAIChat(uid, chatData) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    return false;
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const chatRef = doc(collection(userRef, 'aiChats'));
    
    const chatRecord = {
      ...chatData,
      createdAt: serverTimestamp(),
    };

    await setDoc(chatRef, chatRecord);

    // Add activity feed entry
    await addActivity(uid, {
      type: 'ai_chat',
      title: 'AI Chat Session',
      description: `Asked: "${chatData.prompt?.substring(0, 50)}..."`,
      metadata: { chatId: chatRef.id },
    });

    console.log('✅ AI chat saved');
    return true;
  } catch (err) {
    console.error('❌ Failed to save AI chat:', err);
    return false;
  }
}

/**
 * Get AI chat history
 */
export async function getAIChatHistory(uid, limitCount = 50) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    return [];
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const chatsRef = collection(userRef, 'aiChats');
    const q = query(chatsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));
  } catch (err) {
    console.error('Failed to fetch AI chat history:', err);
    return [];
  }
}

// ─── Activity Feed ───────────────────────────────────────────────

/**
 * Add activity to user's feed
 */
export async function addActivity(uid, activityData) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    return false;
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const activityRef = doc(collection(userRef, 'activity'));
    
    const activityRecord = {
      ...activityData,
      createdAt: serverTimestamp(),
    };

    await setDoc(activityRef, activityRecord);
    return true;
  } catch (err) {
    console.error('❌ Failed to add activity:', err);
    return false;
  }
}

/**
 * Get user's activity feed
 */
export async function getActivityFeed(uid, limitCount = 50) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    return [];
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const activityRef = collection(userRef, 'activity');
    const q = query(activityRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));
  } catch (err) {
    console.error('Failed to fetch activity feed:', err);
    return [];
  }
}

// ─── Leaderboard Management ──────────────────────────────────────

/**
 * Update leaderboard entry for user
 */
export async function updateLeaderboard(uid, profile) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    return false;
  }

  try {
    const leaderboardRef = doc(firestore, COLLECTIONS.LEADERBOARD, uid);
    
    await setDoc(leaderboardRef, {
      uid: uid,
      email: profile.email,
      full_name: profile.full_name,
      avatar: profile.avatar,
      total_xp: profile.total_xp || 0,
      quests_completed: profile.quests_completed || 0,
      focus_hours: profile.focus_hours || 0,
      streak_days: profile.streak_days || 0,
      level: calculateLevel(profile.total_xp || 0),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return true;
  } catch (err) {
    console.error('❌ Failed to update leaderboard:', err);
    return false;
  }
}

/**
 * Get leaderboard data from Firestore
 */
export async function getLeaderboard(limitCount = 50) {
  if (!isFirebaseConfigured() || !firestore) {
    return [];
  }

  try {
    const leaderboardRef = collection(firestore, COLLECTIONS.LEADERBOARD);
    const q = query(
      leaderboardRef,
      orderBy('total_xp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    }));
  } catch (err) {
    console.error('Failed to fetch leaderboard:', err);
    return [];
  }
}

/**
 * Calculate level from XP
 */
function calculateLevel(totalXP) {
  // Simple level calculation: level = floor(sqrt(totalXP / 100))
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
}

// ─── User Stats Aggregation ──────────────────────────────────────

/**
 * Get comprehensive user stats
 */
export async function getUserStats(uid) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    return null;
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return null;
    }

    const userData = userSnap.data();
    const profile = userData.profile || {};

    // Get additional stats from subcollections
    const [xpHistory, achievements, assignments, activity] = await Promise.all([
      getXPHistory(uid, 10),
      getAchievements(uid),
      getAssignmentHistory(uid, 10),
      getActivityFeed(uid, 10),
    ]);

    return {
      profile,
      xpHistory,
      achievements,
      recentAssignments: assignments,
      recentActivity: activity,
      totalXPEarned: xpHistory.reduce((sum, tx) => sum + (tx.amount || 0), 0),
      achievementCount: achievements.length,
    };
  } catch (err) {
    console.error('Failed to fetch user stats:', err);
    return null;
  }
}

// ─── Batch Operations ────────────────────────────────────────────

/**
 * Initialize new user in Firestore
 */
export async function initializeUserInFirestore(uid, profile, gameData = null) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    return false;
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    
    const cleanProfile = {
      email: String(profile.email || ''),
      full_name: String(profile.full_name || 'Student'),
      caption: String(profile.caption || ''),
      specialities: Array.isArray(profile.specialities) ? profile.specialities : [],
      avatar: String(profile.avatar || ''),
      interests: Array.isArray(profile.interests) ? profile.interests : [],
      location: String(profile.location || ''),
      social_github: String(profile.social_github || ''),
      social_twitter: String(profile.social_twitter || ''),
      social_website: String(profile.social_website || ''),
      total_xp: Number(profile.total_xp) || 0,
      xp: Number(profile.xp) || 0,
      quests_completed: Number(profile.quests_completed) || 0,
      focus_hours: Number(profile.focus_hours) || 0,
      streak_days: Number(profile.streak_days) || 0,
      grade: Number(profile.grade) || 10,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const userData = {
      profile: cleanProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (gameData) {
      userData.gameData = {
        Quest: Array.isArray(gameData.Quest) ? gameData.Quest : [],
        Raid: Array.isArray(gameData.Raid) ? gameData.Raid : [],
        Guild: Array.isArray(gameData.Guild) ? gameData.Guild : [],
        GuildMessage: Array.isArray(gameData.GuildMessage) ? gameData.GuildMessage : [],
        FocusSession: Array.isArray(gameData.FocusSession) ? gameData.FocusSession : [],
        User: Array.isArray(gameData.User) ? gameData.User : [],
      };
    }

    await setDoc(userRef, userData);

    // Initialize leaderboard entry
    await updateLeaderboard(uid, cleanProfile);

    console.log('✅ User initialized in Firestore');
    return true;
  } catch (err) {
    console.error('❌ Failed to initialize user:', err);
    return false;
  }
}

/**
 * Sync user data from localStorage to Firestore
 */
export async function syncUserToFirestore(uid, store, profile) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    return false;
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    
    const cleanProfile = {
      email: String(profile.email || ''),
      full_name: String(profile.full_name || 'Student'),
      caption: String(profile.caption || ''),
      specialities: Array.isArray(profile.specialities) ? profile.specialities : [],
      avatar: String(profile.avatar || ''),
      interests: Array.isArray(profile.interests) ? profile.interests : [],
      location: String(profile.location || ''),
      social_github: String(profile.social_github || ''),
      social_twitter: String(profile.social_twitter || ''),
      social_website: String(profile.social_website || ''),
      total_xp: Number(store.currentUser?.total_xp) || 0,
      xp: Number(store.currentUser?.xp) || 0,
      quests_completed: Number(store.currentUser?.quests_completed) || 0,
      focus_hours: Number(store.currentUser?.focus_hours) || 0,
      streak_days: Number(store.currentUser?.streak_days) || 0,
      grade: Number(store.currentUser?.grade) || 10,
    };

    const userData = {
      profile: cleanProfile,
      updatedAt: serverTimestamp(),
    };

    if (store.gameData) {
      userData.gameData = store.gameData;
    }

    await setDoc(userRef, userData, { merge: true });

    // Update leaderboard
    await updateLeaderboard(uid, cleanProfile);

    console.log('✅ User synced to Firestore');
    return true;
  } catch (err) {
    console.error('❌ Failed to sync user:', err);
    return false;
  }
}

// ─── Utility Functions ───────────────────────────────────────────

/**
 * Format date for display
 */
export function formatFirestoreDate(timestamp) {
  if (!timestamp) return new Date().toISOString();
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return new Date(timestamp).toISOString();
}

/**
 * Get time ago string
 */
export function getTimeAgo(timestamp) {
  const date = formatFirestoreDate(timestamp);
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return then.toLocaleDateString();
}