import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured, missingFirebaseEnvKeys } from '@/lib/firebase';
import {
  profileFromFirebaseUser,
  loadUserGameData,
  flushSaveUserGameData,
  saveUserProfileToFirebase,
} from '@/lib/userDataService';
import { initDbForUser, clearDb, getDb } from '@/lib/db';
import { syncCurriculumToStore } from '@/lib/curriculumSync';
import { createInitialStoreForUser } from '@/lib/seedData';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  const setupUserDb = useCallback(async (fbUser) => {
    const authProfile = profileFromFirebaseUser(fbUser);
    
    // Try to load existing user data, but don't fail if it doesn't work
    let initialStore = null;
    try {
      initialStore = await loadUserGameData(fbUser.uid);
    } catch (loadErr) {
      console.warn('[Auth] Could not load user data, using defaults:', loadErr.message);
    }

    // Merge stored profile from Firestore with auth profile
    const storedProfile = initialStore?.profile || {};
    const profile = {
      ...authProfile,
      ...storedProfile,
      email: storedProfile.email || authProfile.email,
      full_name: storedProfile.full_name || authProfile.full_name,
    };

    // Build the initial store - use loaded data or create fresh defaults
    if (initialStore?.Quest?.length) {
      initialStore = syncCurriculumToStore({
        ...initialStore,
        currentUser: {
          ...profile,
          ...initialStore.currentUser,
          id: fbUser.uid,
          email: profile.email,
          full_name: profile.full_name,
        },
      });
    } else {
      initialStore = syncCurriculumToStore(createInitialStoreForUser(profile));
    }

    // Initialize the database for this user
    initDbForUser(fbUser.uid, profile, initialStore);
    const me = await getDb().auth.me();
    setUser(me);
    setDbReady(true);

    // Save user profile in background (non-blocking)
    if (fbUser.uid) {
      try {
        await saveUserProfileToFirebase(fbUser.uid, me, initialStore);
      } catch (err) {
        console.warn('[Auth] Background save failed:', err.message);
      }
    }

    return me;
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
      const missing = missingFirebaseEnvKeys();
      setIsLoadingAuth(false);
      setAuthChecked(true);
      setAuthError({
        type: 'firebase_not_configured',
        message: missing.length
          ? `Missing Firebase env vars: ${missing.join(', ')}`
          : 'Firebase is not configured',
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log('[Auth] State changed:', fbUser ? `User: ${fbUser.email}` : 'No user');
      setIsLoadingAuth(true);
      setAuthError(null);
      setDbReady(false);

      try {
        if (fbUser) {
          setFirebaseUser(fbUser);
          setIsAuthenticated(true);
          // Setup DB in background - don't block auth on data loading
          try {
            await setupUserDb(fbUser);
            console.log('[Auth] User data loaded successfully');
          } catch (dbErr) {
            console.warn('[Auth] Data load failed, using defaults:', dbErr.message);
            // Still let user in - they'll get default data
          }
        } else {
          clearDb();
          setFirebaseUser(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('[Auth] Auth state error:', err.code, err.message);
        setAuthError({ type: 'unknown', message: err.message || 'Failed to authenticate' });
        setIsAuthenticated(false);
      } finally {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    });

    return () => unsubscribe();
  }, [setupUserDb]);



  const logout = useCallback(async () => {
    try {
      if (globalThis.__B44_DB__ && firebaseUser) {
        const store = globalThis.__B44_DB__.getStore();
        const profile = store.currentUser || {};
        
        // Ensure profile has all required fields
        const completeProfile = {
          email: profile.email || firebaseUser.email || '',
          full_name: profile.full_name || 'Student',
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
          gamecoin: store.currentUser?.gamecoin ?? 0,
          acoin: store.currentUser?.acoin ?? 0,
          owned_items: store.currentUser?.owned_items ?? [],
          equipped: store.currentUser?.equipped ?? {},
        };
        
        await flushSaveUserGameData(firebaseUser.uid, store, completeProfile);
      }
    } catch (e) {
      console.error('Logout save error:', e);
    }
    clearDb();
    setDbReady(false);
    if (auth) await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  }, [firebaseUser]);

  const navigateToLogin = useCallback(() => {
    window.location.href = '/';
  }, []);

  const refreshUser = useCallback(async () => {
    if (!globalThis.__B44_DB__) return null;
    const me = await getDb().auth.me();
    setUser(me);
    return me;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated,
        isLoadingAuth,
        authError,
        authChecked,
        dbReady,
        isFirebaseConfigured: isFirebaseConfigured(),
        logout,
        navigateToLogin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
