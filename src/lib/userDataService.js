import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from './firebase';

const SAVE_DEBOUNCE_MS = 600;
const pendingSaves = new Map();

export function profileFromFirebaseUser(fbUser, displayName) {
  const name = displayName?.trim() || fbUser.displayName || fbUser.email?.split('@')[0] || 'Student';
  return {
    id: fbUser.uid,
    email: fbUser.email,
    full_name: name,
    caption: '',
    specialities: [],
    total_xp: 0,
    xp: 0,
    quests_completed: 0,
    focus_hours: 0,
    streak_days: 0,
    grade: 10,
    created_at: new Date().toISOString(),
  };
}

/** Load game store from Firestore for this user. */
export async function loadUserGameData(uid) {
  if (!isFirebaseConfigured() || !firestore) return null;
  try {
    const snap = await getDoc(doc(firestore, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    const gameData = data.gameData || {};
    const profile = data.profile || {};
    return {
      Quest: gameData.Quest || [],
      Raid: gameData.Raid || [],
      Guild: gameData.Guild || [],
      GuildMessage: gameData.GuildMessage || [],
      FocusSession: gameData.FocusSession || [],
      User: gameData.User || [],
      currentUser: {
        id: uid,
        email: profile.email || '',
        full_name: profile.full_name || 'Student',
        caption: profile.caption || '',
        specialities: profile.specialities || [],
        avatar: profile.avatar || '',
        interests: profile.interests || [],
        location: profile.location || '',
        social_github: profile.social_github || '',
        social_twitter: profile.social_twitter || '',
        social_website: profile.social_website || '',
        total_xp: profile.total_xp ?? 0,
        xp: profile.total_xp ?? 0,
        quests_completed: profile.quests_completed ?? 0,
        focus_hours: profile.focus_hours ?? 0,
        streak_days: profile.streak_days ?? 0,
        grade: profile.grade ?? 10,
      },
    };
  } catch (err) {
    console.error('Firestore load failed:', err);
    return null;
  }
}

/** Build a completely clean profile object with NO undefined values */
function buildCleanProfile(profile, store) {
  // Start with a completely clean object
  const clean = {
    email: '',
    full_name: 'Student',
    total_xp: 0,
    quests_completed: 0,
    focus_hours: 0,
    streak_days: 0,
    grade: 10,
  };

  // Only add values that are actually defined
  if (profile && typeof profile === 'object') {
    if (profile.email !== undefined && profile.email !== null) clean.email = String(profile.email);
    if (profile.full_name !== undefined && profile.full_name !== null) clean.full_name = String(profile.full_name);
    if (profile.total_xp !== undefined && profile.total_xp !== null) clean.total_xp = Number(profile.total_xp);
    if (profile.quests_completed !== undefined && profile.quests_completed !== null) clean.quests_completed = Number(profile.quests_completed);
    if (profile.focus_hours !== undefined && profile.focus_hours !== null) clean.focus_hours = Number(profile.focus_hours);
    if (profile.streak_days !== undefined && profile.streak_days !== null) clean.streak_days = Number(profile.streak_days);
    if (profile.grade !== undefined && profile.grade !== null) clean.grade = Number(profile.grade);
  }

  // Override with store values if available
  if (store && store.currentUser) {
    if (store.currentUser.total_xp !== undefined && store.currentUser.total_xp !== null) clean.total_xp = Number(store.currentUser.total_xp);
    if (store.currentUser.quests_completed !== undefined && store.currentUser.quests_completed !== null) clean.quests_completed = Number(store.currentUser.quests_completed);
    if (store.currentUser.focus_hours !== undefined && store.currentUser.focus_hours !== null) clean.focus_hours = Number(store.currentUser.focus_hours);
    if (store.currentUser.streak_days !== undefined && store.currentUser.streak_days !== null) clean.streak_days = Number(store.currentUser.streak_days);
    if (store.currentUser.grade !== undefined && store.currentUser.grade !== null) clean.grade = Number(store.currentUser.grade);
  }

  return clean;
}

/** Persist full game store to Firestore (debounced). */
export function scheduleSaveUserGameData(uid, store, profile) {
  if (!isFirebaseConfigured() || !firestore || !uid) return;

  const prev = pendingSaves.get(uid);
  if (prev?.timer) clearTimeout(prev.timer);

  const timer = setTimeout(async () => {
    try {
      const cleanProfile = buildCleanProfile(profile, store);
      const data = {
        profile: cleanProfile,
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(doc(firestore, 'users', uid), data, { merge: true });
    } catch (err) {
      console.error('Firestore save failed:', err);
    }
    pendingSaves.delete(uid);
  }, SAVE_DEBOUNCE_MS);

  pendingSaves.set(uid, { timer });
}

export async function flushSaveUserGameData(uid, store, profile) {
  const pending = pendingSaves.get(uid);
  if (pending?.timer) clearTimeout(pending.timer);
  pendingSaves.delete(uid);
  if (!isFirebaseConfigured() || !firestore || !uid) return;
  
  try {
    const cleanProfile = buildCleanProfile(profile, store);
    const data = {
      profile: cleanProfile,
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(doc(firestore, 'users', uid), data, { merge: true });
    console.log('✅ Profile saved to Firebase successfully');
  } catch (err) {
    console.error('❌ Firestore save failed:', err);
    throw err;
  }
}

/** Save user profile to Firebase (for new users) */
export async function saveUserProfileToFirebase(uid, profile, gameData = null) {
  if (!isFirebaseConfigured() || !firestore || !uid) {
    console.error('Firebase not configured or missing uid');
    return false;
  }
  
  try {
    const cleanProfile = buildCleanProfile(profile, null);
    const data = {
      profile: cleanProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only include gameData if it exists and has content
    if (gameData && gameData.Quest && gameData.Quest.length > 0) {
      data.gameData = {
        Quest: Array.isArray(gameData.Quest) ? gameData.Quest : [],
        Raid: Array.isArray(gameData.Raid) ? gameData.Raid : [],
        Guild: Array.isArray(gameData.Guild) ? gameData.Guild : [],
        GuildMessage: Array.isArray(gameData.GuildMessage) ? gameData.GuildMessage : [],
        FocusSession: Array.isArray(gameData.FocusSession) ? gameData.FocusSession : [],
        User: Array.isArray(gameData.User) ? gameData.User : [],
      };
    }
    
    await setDoc(doc(firestore, 'users', uid), data, { merge: true });
    console.log('✅ User profile saved to Firebase:', uid);
    return true;
  } catch (err) {
    console.error('❌ Failed to save user profile to Firebase:', err);
    throw err;
  }
}

/** Fetch all users from Firebase for leaderboard */
export async function fetchAllUsersFromFirebase(limitCount = 50) {
  if (!isFirebaseConfigured() || !firestore) {
    console.error('Firebase not configured');
    return [];
  }
  
  try {
    console.log('🔍 Fetching users from Firebase...');
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, orderBy('profile.total_xp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    console.log('📊 Found', querySnapshot.size, 'users in Firebase');
    
    const users = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const profile = data.profile || {};
      users.push({
        id: doc.id,
        email: String(profile.email || ''),
        full_name: String(profile.full_name || 'Anonymous'),
        total_xp: Number(profile.total_xp) || 0,
        quests_completed: Number(profile.quests_completed) || 0,
        focus_hours: Number(profile.focus_hours) || 0,
        streak_days: Number(profile.streak_days) || 0,
        grade: Number(profile.grade) || 10,
      });
    });
    
    console.log('✅ Returning', users.length, 'users for leaderboard');
    return users;
  } catch (err) {
    console.error('❌ Failed to fetch users from Firebase:', err);
    return [];
  }
}