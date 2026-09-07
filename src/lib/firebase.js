import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// @ts-ignore — Vite replaces the literal `import.meta.env` token at serve/build time (do NOT rewrite to (import.meta).env)
const rawEnv = typeof import.meta !== 'undefined' ? import.meta.env : {};
const cleanEnv = (value) => {
  if (!value) return undefined;
  return value.trim().replace(/^['"](.+)['"]$/, '$1');
};
const firebaseConfig = {
  apiKey: cleanEnv(rawEnv?.VITE_FIREBASE_API_KEY),
  authDomain: cleanEnv(rawEnv?.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnv(rawEnv?.VITE_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(rawEnv?.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(rawEnv?.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(rawEnv?.VITE_FIREBASE_APP_ID),
  measurementId: cleanEnv(rawEnv?.VITE_FIREBASE_MEASUREMENT_ID),
};

export const missingFirebaseEnvKeys = () => {
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID',
  ];
  return required.filter((k) => !cleanEnv(rawEnv?.[k]));
};

const isConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;

// Firestore with a persistent multi-tab local cache (architecture §18):
// instant reads from IndexedDB, offline support, and fewer billable reads.
// Browsers without IndexedDB (or where the cache cannot start) fall back to
// the default cache so the app keeps working everywhere.
let firestoreInstance = null;
if (app) {
  try {
    if (typeof indexedDB !== 'undefined') {
      firestoreInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } else {
      firestoreInstance = getFirestore(app);
    }
  } catch (err) {
    console.warn('Persistent Firestore cache unavailable, using default cache:', err);
    firestoreInstance = getFirestore(app);
  }
}

export const firestore = firestoreInstance;
export const firebaseApp = app;
export const isFirebaseConfigured = () => isConfigured;

async function initAnalytics() {
  if (!app || typeof window === 'undefined' || !firebaseConfig.measurementId) {
    return null;
  }

  try {
    if (await isSupported()) {
      return getAnalytics(app);
    }
  } catch (error) {
    console.warn('Firebase analytics initialization skipped:', error);
  }

  return null;
}

export const analyticsPromise = initAnalytics();
