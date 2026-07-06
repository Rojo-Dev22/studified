import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from './firebase';
import { saveUserProfile, addXPTransaction, saveAssignmentCompletion, saveAIChat, addActivity } from './cloudDatabase';

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

/** Persist full game store to localStorage (NO FIRESTORE) */
export function scheduleSaveUserGameData(uid, store, profile) {
  if (!uid) return;

  const prev = pendingSaves.get(uid);
  if (prev?.timer) clearTimeout(prev.timer);

  const timer = setTimeout(async () => {
    try {
      // Only sync to Firebase in background (localStorage already saved by persistStore)
      // No need to save to localStorage again - it was already saved immediately
      
      // Try Firebase in background (won't block if it fails)
      if (isFirebaseConfigured() && firestore) {
        try {
          await saveUserProfile(uid, profile, store.gameData);
        } catch (firebaseErr) {
          // Silently fail - localStorage is the primary storage
        }
      }
    } catch (err) {
      console.error('Save failed:', err);
    }
    pendingSaves.delete(uid);
  }, SAVE_DEBOUNCE_MS);

  pendingSaves.set(uid, { timer });
}

export async function flushSaveUserGameData(uid, store, profile) {
  const pending = pendingSaves.get(uid);
  if (pending?.timer) clearTimeout(pending.timer);
  pendingSaves.delete(uid);
  if (!uid) return;
  
  try {
    // Save to localStorage first (guaranteed to work)
    const storageKey = `studified_db_${uid}`;
    
    // Update currentUser with profile data
    const updatedCurrentUser = {
      ...store.currentUser,
      email: profile.email || store.currentUser?.email || '',
      full_name: profile.full_name || store.currentUser?.full_name || 'Student',
      caption: profile.caption || store.currentUser?.caption || '',
      specialities: profile.specialities || store.currentUser?.specialities || [],
      avatar: profile.avatar || store.currentUser?.avatar || '',
      interests: profile.interests || store.currentUser?.interests || [],
      location: profile.location || store.currentUser?.location || '',
      social_github: profile.social_github || store.currentUser?.social_github || '',
      social_twitter: profile.social_twitter || store.currentUser?.social_twitter || '',
      social_website: profile.social_website || store.currentUser?.social_website || '',
    };
    
    const dataToSave = {
      ...store,
      currentUser: updatedCurrentUser,
      profile: updatedCurrentUser, // Save profile separately for easy loading
    };
    
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    console.log('✅ Profile saved to localStorage successfully');
    
    // Try Firebase in background (won't block if it fails)
    if (isFirebaseConfigured() && firestore) {
      try {
        await saveUserProfile(uid, profile, store.gameData);
      } catch (firebaseErr) {
        // Silently fail - localStorage is the primary storage
      }
    }
  } catch (err) {
    console.error('Save failed:', err);
    throw err;
  }
}

/** Save user profile to Firebase (OPTIONAL - localStorage is PRIMARY) */
export async function saveUserProfileToFirebase(uid, profile, gameData = null) {
  if (!uid) {
    console.error('Missing uid');
    return false;
  }
  
  try {
    // Try Firebase in background (won't block if it fails)
    if (isFirebaseConfigured() && firestore) {
      try {
        await saveUserProfile(uid, profile, gameData);
        console.log('✅ Saved to Firebase');
      } catch (firebaseErr) {
        // Silently fail - localStorage is the primary storage
        console.log('⚠️ Firebase save failed');
      }
    }
    
    return true;
  } catch (err) {
    console.error('❌ Failed to save user profile:', err);
    return false;
  }
}

/** Fetch all users from localStorage for leaderboard (NO FIRESTORE NEEDED) */
export async function fetchAllUsersFromFirebase(limitCount = 50) {
  console.log('🔍 Fetching users from localStorage...');
  
  try {
    const allUsers = [];
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith('studified_db_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && data.currentUser) {
            allUsers.push({
              id: data.currentUser.id || key.replace('studified_db_', ''),
              email: String(data.currentUser.email || ''),
              full_name: String(data.currentUser.full_name || 'Anonymous'),
              total_xp: Number(data.currentUser.total_xp) || 0,
              quests_completed: Number(data.currentUser.quests_completed) || 0,
              focus_hours: Number(data.currentUser.focus_hours) || 0,
              streak_days: Number(data.currentUser.streak_days) || 0,
              grade: Number(data.currentUser.grade) || 10,
            });
          }
        } catch (e) {
          // Skip invalid entries
        }
      }
    });
    
    allUsers.sort((a, b) => b.total_xp - a.total_xp);
    console.log('✅ Returning', allUsers.length, 'users from localStorage');
    return allUsers.slice(0, limitCount);
  } catch (err) {
    console.error('Failed to fetch users:', err);
    return [];
  }
}