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

/** Persist full game store to Firestore (debounced). */
export function scheduleSaveUserGameData(uid, store, profile) {
  if (!isFirebaseConfigured() || !firestore || !uid) return;

  const prev = pendingSaves.get(uid);
  if (prev?.timer) clearTimeout(prev.timer);

  const timer = setTimeout(async () => {
    try {
      await setDoc(
        doc(firestore, 'users', uid),
        {
          profile: {
            email: profile.email,
            full_name: profile.full_name,
            caption: profile.caption || '',
            specialities: profile.specialities || [],
            avatar: profile.avatar || '',
            interests: profile.interests || [],
            location: profile.location || '',
            social_github: profile.social_github || '',
            social_twitter: profile.social_twitter || '',
            social_website: profile.social_website || '',
            total_xp: store.currentUser?.total_xp ?? 0,
            quests_completed: store.currentUser?.quests_completed ?? 0,
            focus_hours: store.currentUser?.focus_hours ?? 0,
            streak_days: store.currentUser?.streak_days ?? 0,
            grade: store.currentUser?.grade ?? 10,
          },
          gameData: {
            Quest: store.Quest,
            Raid: store.Raid,
            Guild: store.Guild,
            GuildMessage: store.GuildMessage,
            FocusSession: store.FocusSession,
            User: store.User,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
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
    const userRef = doc(firestore, 'users', uid);
    const updateData = {
      profile: {
        email: profile.email,
        full_name: profile.full_name,
        caption: profile.caption || '',
        specialities: profile.specialities || [],
        avatar: profile.avatar || '',
        interests: profile.interests || [],
        location: profile.location || '',
        social_github: profile.social_github || '',
        social_twitter: profile.social_twitter || '',
        social_website: profile.social_website || '',
        total_xp: store.currentUser?.total_xp ?? 0,
        quests_completed: store.currentUser?.quests_completed ?? 0,
        focus_hours: store.currentUser?.focus_hours ?? 0,
        streak_days: store.currentUser?.streak_days ?? 0,
        grade: store.currentUser?.grade ?? 10,
      },
      gameData: {
        Quest: store.Quest,
        Raid: store.Raid,
        Guild: store.Guild,
        GuildMessage: store.GuildMessage,
        FocusSession: store.FocusSession,
        User: store.User,
      },
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(userRef, updateData, { merge: true });
    console.log('Profile saved to Firebase successfully');
  } catch (err) {
    console.error('Firestore save failed:', err);
    throw err;
  }
}

/** Fetch all users from Firebase for leaderboard */
export async function fetchAllUsersFromFirebase(limitCount = 50) {
  if (!isFirebaseConfigured() || !firestore) return [];
  
  try {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, orderBy('profile.total_xp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const profile = data.profile || {};
      users.push({
        id: doc.id,
        email: profile.email || '',
        full_name: profile.full_name || 'Anonymous',
        avatar: profile.avatar || '',
        total_xp: profile.total_xp || 0,
        quests_completed: profile.quests_completed || 0,
        focus_hours: profile.focus_hours || 0,
        streak_days: profile.streak_days || 0,
        grade: profile.grade || 10,
        caption: profile.caption || '',
        specialities: profile.specialities || [],
        interests: profile.interests || [],
        location: profile.location || '',
        social_github: profile.social_github || '',
        social_twitter: profile.social_twitter || '',
        social_website: profile.social_website || '',
      });
    });
    
    return users;
  } catch (err) {
    console.error('Failed to fetch users from Firebase:', err);
    return [];
  }
}
