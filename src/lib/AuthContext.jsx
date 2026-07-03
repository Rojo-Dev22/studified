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
    const profile = profileFromFirebaseUser(fbUser);
    let initialStore = await loadUserGameData(fbUser.uid);

    if (initialStore?.Quest?.length) {
      initialStore = syncCurriculumToStore({
        ...initialStore,
        currentUser: {
          ...profile,
          ...initialStore.currentUser,
          id: fbUser.uid,
          email: profile.email,
          full_name: initialStore.currentUser?.full_name || profile.full_name,
        },
      });
    } else {
      initialStore = syncCurriculumToStore(createInitialStoreForUser(profile));
    }

    initDbForUser(fbUser.uid, profile, initialStore);
    const me = await getDb().auth.me();
    setUser(me);
    setDbReady(true);

    // Save user profile to localStorage (PRIMARY - always works)
    if (fbUser.uid) {
      try {
        console.log('💾 Saving user profile to localStorage...', fbUser.uid);
        const saveResult = await saveUserProfileToFirebase(fbUser.uid, me, initialStore);
        if (saveResult) {
          console.log('✅ User profile successfully saved');
        }
      } catch (err) {
        console.error('❌ Failed to save profile:', err);
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
      setIsLoadingAuth(true);
      setAuthError(null);
      setDbReady(false);

      try {
        if (fbUser) {
          setFirebaseUser(fbUser);
          await setupUserDb(fbUser);
          setIsAuthenticated(true);
        } else {
          clearDb();
          setFirebaseUser(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth setup failed:', err);
        setAuthError({ type: 'unknown', message: err.message || 'Failed to load your data' });
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
