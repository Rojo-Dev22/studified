import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from './firebase';
import {
  canPerformRead,
  canPerformWrite,
  recordRead,
  recordWrite,
  budgetStateFor,
  BUDGET_STATES,
} from './budgetGuard';

// ─── Database Collections ─────────────────────────────────────────

const COLLECTIONS = {
  USERS: 'users',
  LEADERBOARD: 'leaderboard',
  GUILDS: 'guilds',
  COMPLETION_EVENTS: 'completionEvents',
};

// ─── $0 Cost Firewall helpers (architecture Sections 6, 11, 21) ────
// Every Firestore read/write is counted against the daily safety budgets.
// Non-essential traffic (leaderboard publishing, activity feed, history
// refreshes) is dropped first when the budget is under pressure; essential
// user-data writes keep working until the budget is fully exhausted, at
// which point the app goes local-only. localStorage is the primary store,
// so degradation never loses data.

// Firestore documents are capped at 1 MiB. Keep the synced user document
// comfortably below that: if the game store blob grows too large, sync the
// profile only and keep the full data local (Section 21 — bounded storage).
const MAX_GAME_DATA_BYTES = 900 * 1024;

function estimateGameSize(gameData) {
  try {
    return JSON.stringify(gameData, (_key, value) =>
      value && typeof value.toDate === 'function' ? '__timestamp__' : value
    ).length;
  } catch {
    return Infinity; // cannot measure → treat as oversized (fail closed)
  }
}

function buildSyncableGameData(gameData) {
  if (!gameData || typeof gameData !== 'object') {
    return { gameData: null, oversized: false };
  }
  const normalized = {
    Quest: Array.isArray(gameData.Quest) ? gameData.Quest : [],
    Raid: Array.isArray(gameData.Raid) ? gameData.Raid : [],
    Guild: Array.isArray(gameData.Guild) ? gameData.Guild : [],
    GuildMessage: Array.isArray(gameData.GuildMessage) ? gameData.GuildMessage : [],
    FocusSession: Array.isArray(gameData.FocusSession) ? gameData.FocusSession : [],
    User: Array.isArray(gameData.User) ? gameData.User : [],
  };
  if (estimateGameSize(normalized) <= MAX_GAME_DATA_BYTES) {
    return { gameData: normalized, oversized: false };
  }
  console.warn(
    '⚠️ gameData exceeds the Firestore document budget — syncing profile only. ' +
    'The full store stays in localStorage; trim stored history to re-enable full cloud sync (§21).'
  );
  return { gameData: null, oversized: true };
}

// Leaderboard publishing dedupe (§11): the leaderboard mirrors rank stats,
// so it only needs a write when one of those stats actually changed.
const LEADERBOARD_FIELDS = ['total_xp', 'quests_completed', 'focus_hours', 'streak_days', 'full_name', 'avatar'];
const leaderboardSnapshotKey = (uid) => `studified_lb_published_${uid}`;

function shouldPublishLeaderboard(uid, profile) {
  try {
    const raw = localStorage.getItem(leaderboardSnapshotKey(uid));
    if (!raw) return true; // never published from this device — publish once
    const last = JSON.parse(raw);
    return LEADERBOARD_FIELDS.some(
      (field) => (last?.[field] ?? null) !== (profile?.[field] ?? null)
    );
  } catch {
    return true;
  }
}

function markLeaderboardPublished(uid, profile) {
  try {
    const snapshot = {};
    LEADERBOARD_FIELDS.forEach((field) => {
      snapshot[field] = profile?.[field] ?? null;
    });
    localStorage.setItem(leaderboardSnapshotKey(uid), JSON.stringify(snapshot));
  } catch {
    /* non-fatal — worst case the next save republishes the leaderboard */
  }
}

// True when the write budget still has headroom above the degraded threshold.
// Non-essential writes stop at degraded (95%); essential ones only stop when
// the budget is fully exhausted (100%, handled by canPerformWrite).
function budgetAllowsNonEssentialWrite() {
  const writeState = budgetStateFor('writes');
  return writeState !== BUDGET_STATES.DEGRADED && writeState !== BUDGET_STATES.EXHAUSTED;
}

// ─── User Profile Management ─────────────────────────────────────

/**
 * Save user profile to Firestore with change tracking
 */
export async function saveUserProfile(uid, profile, gameData = null) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    console.warn('Firebase not configured or missing uid');
    return false;
  }

  // Cost firewall (§6/§25): once the daily write budget is exhausted, pause
  // cloud sync and stay local-only until reset. localStorage already holds
  // the data — returning false here is graceful degradation, not data loss.
  if (!canPerformWrite(2)) {
    console.warn('⏸️ Firestore write budget exhausted — cloud sync paused until reset (local data is safe).');
    return false;
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    
    // Get existing profile to track changes (protects balances on partial
    // saves, so this read runs even under budget pressure).
    recordRead();
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
      // Preserve existing balances/inventory when a partial profile omits them
      gamecoin: profile.gamecoin != null ? Number(profile.gamecoin) || 0 : Number(existingProfile.gamecoin) || 0,
      acoin: profile.acoin != null ? Number(profile.acoin) || 0 : Number(existingProfile.acoin) || 0,
      owned_items: Array.isArray(profile.owned_items) ? profile.owned_items : (Array.isArray(existingProfile.owned_items) ? existingProfile.owned_items : []),
      equipped: (profile.equipped && typeof profile.equipped === 'object') ? profile.equipped : ((existingProfile.equipped && typeof existingProfile.equipped === 'object') ? existingProfile.equipped : {}),
      updatedAt: serverTimestamp(),
    };

    // Save main user document
    const userData = {
      profile: cleanProfile,
      updatedAt: serverTimestamp(),
    };

    // Add game data if provided, bounded to the Firestore document size
    // budget (§21) so an oversized store can never fail the profile write.
    const { gameData: syncableGameData } = buildSyncableGameData(gameData);
    if (syncableGameData) {
      userData.gameData = syncableGameData;
    }

    recordWrite();
    await setDoc(userRef, userData, { merge: true });

    // Save profile change history if there are changes
    if (changes.length > 0) {
      recordWrite();
      const changeRef = doc(collection(userRef, 'profileHistory'));
      await setDoc(changeRef, {
        changes: changes,
        changedAt: serverTimestamp(),
        previousValues: existingProfile,
        newValues: cleanProfile,
      });
    }

    // Update leaderboard only when rank-relevant values actually changed
    // (§11 — every document write counts against the $0 budget).
    if (shouldPublishLeaderboard(uid, cleanProfile)) {
      await updateLeaderboard(uid, cleanProfile);
    }

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

  // Read-budget gate (§10/§26): history refreshes are non-essential. When the
  // daily read budget is spent, return empty and let callers use local data.
  if (!canPerformRead(limitCount)) {
    console.warn('⏸️ Firestore read budget exhausted — skipping profile history fetch.');
    return [];
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const historyRef = collection(userRef, 'profileHistory');
    const q = query(historyRef, orderBy('changedAt', 'desc'), limit(limitCount));
    recordRead(limitCount); // bounded pagination (§9)
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
/**
 * Idempotency ledger (§13). Claims `completionEvents/{eventId}` exactly once:
 *   true  → this call claimed the event; process the reward
 *   false → the event was already processed (or could not be claimed) — skip
 *
 * Create-once semantics are enforced end-to-end: the security rules only allow
 * `create` on this collection (never `update`), so a duplicate claim fails and
 * is treated as "already processed".
 *
 * Callers opt in by passing a unique `eventId` (e.g. inside XP metadata).
 * Without an eventId, behavior is unchanged — deriving IDs automatically is
 * unsafe for repeatable rewards (e.g. daily quests).
 */
export async function claimCompletionEvent(eventId, payload = {}) {
  if (!eventId) return true; // no idempotency key → legacy behavior
  if (!isFirebaseConfigured() || !firestore) return true;

  const eventRef = doc(firestore, COLLECTIONS.COMPLETION_EVENTS, String(eventId));

  try {
    recordRead();
    const existing = await getDoc(eventRef);
    if (existing.exists()) {
      return false; // duplicate — this reward was already granted
    }
  } catch (err) {
    // Verification failed (e.g. offline with a cold cache). Proceed
    // optimistically: the create-once rules still block real duplicates.
    console.warn('⚠️ Could not verify completion event, proceeding:', err?.message || err);
  }

  if (!canPerformWrite(1)) {
    console.warn('⏸️ Firestore write budget exhausted — completion event deferred.');
    return false;
  }

  try {
    recordWrite();
    await setDoc(eventRef, {
      eventId: String(eventId),
      ...payload,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    // Most likely the event already exists (rules deny the overwrite).
    console.warn('⚠️ Completion event claim rejected (duplicate?):', err?.message || err);
    return false;
  }
}

export async function addXPTransaction(uid, amount, source, description, metadata = {}) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    return false;
  }

  // Idempotent processing (§13): only run when this event has never been
  // processed. metadata.eventId is optional; omitting it keeps legacy behavior.
  const eventId = metadata?.eventId ? String(metadata.eventId) : null;
  if (eventId) {
    const claimed = await claimCompletionEvent(eventId, {
      uid,
      kind: 'xp',
      amount: Number(amount) || 0,
      source: String(source || ''),
    });
    if (!claimed) {
      console.log(`⏭️ XP event ${eventId} already processed — skipping duplicate`);
      return true;
    }
  }

  if (!canPerformWrite(2)) {
    console.warn('⏸️ Firestore write budget exhausted — XP sync deferred (local XP is safe).');
    return false;
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    
    // Add XP transaction to history
    recordWrite();
    const transactionRef = doc(collection(userRef, 'xpHistory'));
    await setDoc(transactionRef, {
      amount: Number(amount),
      source: String(source),
      description: String(description),
      metadata: metadata,
      createdAt: serverTimestamp(),
    });

    // Update user's total XP
    recordWrite();
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

  // Read-budget gate (§10/§26): history refreshes are non-essential.
  if (!canPerformRead(limitCount)) {
    console.warn('⏸️ Firestore read budget exhausted — skipping XP history fetch.');
    return [];
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const xpRef = collection(userRef, 'xpHistory');
    const q = query(xpRef, orderBy('createdAt', 'desc'), limit(limitCount));
    recordRead(limitCount); // bounded pagination (§9)
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

  if (!canPerformWrite(1)) {
    console.warn('⏸️ Firestore write budget exhausted — achievement unlock deferred.');
    return false;
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const achievementRef = doc(collection(userRef, 'achievements'), achievementId);
    
    recordWrite();
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
export async function getAchievements(uid, limitCount = 200) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    return [];
  }

  // Read-budget gate (§10/§26).
  if (!canPerformRead(limitCount)) {
    console.warn('⏸️ Firestore read budget exhausted — skipping achievements fetch.');
    return [];
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const achievementsRef = collection(userRef, 'achievements');
    // Bounded read (§9): never fetch an entire collection in production.
    const boundedQuery = query(achievementsRef, limit(limitCount));
    recordRead(limitCount);
    const snapshot = await getDocs(boundedQuery);
    
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

  // Write-minimization (§11): read the unlocked set once, then only write
  // achievements that are genuinely new instead of re-writing all of them.
  const existingIds = new Set((await getAchievements(uid, 200)).map((a) => a.id));
  for (const achievement of achievements) {
    if (existingIds.has(achievement.id)) continue;
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

  // Idempotency (§13): supply assignmentData.eventId to make retries and
  // double-clicks safe — the completion is recorded at most once per event.
  const eventId = assignmentData?.eventId ? String(assignmentData.eventId) : null;
  if (eventId) {
    const claimed = await claimCompletionEvent(`${uid}:assignment:${eventId}`, {
      uid,
      kind: 'assignment',
      questId: assignmentData?.questId ?? null,
    });
    if (!claimed) {
      console.log(`⏭️ Assignment event ${eventId} already processed — skipping duplicate`);
      return true;
    }
  }

  if (!canPerformWrite(2)) {
    console.warn('⏸️ Firestore write budget exhausted — assignment sync deferred.');
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

    recordWrite();
    await setDoc(assignmentRef, assignmentRecord);

    // Update user stats
    recordWrite();
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

  // Read-budget gate (§10/§26): history refreshes are non-essential.
  if (!canPerformRead(limitCount)) {
    console.warn('⏸️ Firestore read budget exhausted — skipping assignment history fetch.');
    return [];
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const assignmentsRef = collection(userRef, 'assignments');
    const q = query(assignmentsRef, orderBy('completedAt', 'desc'), limit(limitCount));
    recordRead(limitCount); // bounded pagination (§9)
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

  if (!canPerformWrite(2)) {
    console.warn('⏸️ Firestore write budget exhausted — AI chat sync deferred.');
    return false;
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const chatRef = doc(collection(userRef, 'aiChats'));
    
    const chatRecord = {
      ...chatData,
      createdAt: serverTimestamp(),
    };

    recordWrite();
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

  // Read-budget gate (§10/§26): history refreshes are non-essential.
  if (!canPerformRead(limitCount)) {
    console.warn('⏸️ Firestore read budget exhausted — skipping AI chat history fetch.');
    return [];
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const chatsRef = collection(userRef, 'aiChats');
    const q = query(chatsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    recordRead(limitCount); // bounded pagination (§9)
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

  // Non-essential write (§11/§25): the activity feed is the first thing we
  // drop when the write budget is under pressure (degraded or exhausted).
  if (!budgetAllowsNonEssentialWrite()) {
    console.warn('⏸️ Write budget under pressure — activity feed entry skipped.');
    return false;
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const activityRef = doc(collection(userRef, 'activity'));
    
    const activityRecord = {
      ...activityData,
      createdAt: serverTimestamp(),
    };

    recordWrite();
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

  // Read-budget gate (§10/§26): history refreshes are non-essential.
  if (!canPerformRead(limitCount)) {
    console.warn('⏸️ Firestore read budget exhausted — skipping activity feed fetch.');
    return [];
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    const activityRef = collection(userRef, 'activity');
    const q = query(activityRef, orderBy('createdAt', 'desc'), limit(limitCount));
    recordRead(limitCount); // bounded pagination (§9)
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

  // Non-essential write (§11/§15): skip when rank-relevant values are
  // unchanged or when the write budget is under pressure. The leaderboard is
  // one distributed record per user (leaderboard/{uid}) — never a hot doc.
  if (!budgetAllowsNonEssentialWrite() || !shouldPublishLeaderboard(uid, profile)) {
    return true; // nothing new to publish — not an error
  }

  try {
    const leaderboardRef = doc(firestore, COLLECTIONS.LEADERBOARD, uid);
    
    recordWrite();
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

    markLeaderboardPublished(uid, profile);
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

  // Read-budget gate (§10): the leaderboard is non-essential — when the daily
  // read budget is spent, return empty and the page falls back to local data.
  if (!canPerformRead(limitCount)) {
    console.warn('⏸️ Firestore read budget exhausted — skipping leaderboard fetch.');
    return [];
  }

  try {
    const leaderboardRef = collection(firestore, COLLECTIONS.LEADERBOARD);
    const q = query(
      leaderboardRef,
      orderBy('total_xp', 'desc'),
      limit(limitCount)
    );
    recordRead(limitCount);
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

  // Read-budget gate (§10/§26): stats aggregation fans out into several
  // reads — skip entirely when the daily budget is exhausted.
  if (!canPerformRead()) {
    console.warn('⏸️ Firestore read budget exhausted — skipping user stats fetch.');
    return null;
  }

  try {
    const userRef = doc(firestore, COLLECTIONS.USERS, uid);
    recordRead();
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

  if (!canPerformWrite(2)) {
    console.warn('⏸️ Firestore write budget exhausted — deferring account initialization.');
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

    // Bounded game data (§21): never let an oversized store fail account setup.
    const { gameData: syncableGameData } = buildSyncableGameData(gameData);
    if (syncableGameData) {
      userData.gameData = syncableGameData;
    }

    recordWrite();
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

  if (!canPerformWrite(2)) {
    console.warn('⏸️ Firestore write budget exhausted — cloud sync deferred (local data is safe).');
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
      gamecoin: Number(store.currentUser?.gamecoin) || 0,
      acoin: Number(store.currentUser?.acoin) || 0,
      owned_items: Array.isArray(store.currentUser?.owned_items) ? store.currentUser.owned_items : [],
      equipped: (store.currentUser?.equipped && typeof store.currentUser.equipped === 'object') ? store.currentUser.equipped : {},
    };

    const userData = {
      profile: cleanProfile,
      updatedAt: serverTimestamp(),
    };

    // Bounded game data (§21): keep the user document safely below Firestore's
    // 1 MiB limit; the full store remains in localStorage.
    const { gameData: syncableGameData } = buildSyncableGameData(store.gameData);
    if (syncableGameData) {
      userData.gameData = syncableGameData;
    }

    recordWrite();
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
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return then.toLocaleDateString();
}