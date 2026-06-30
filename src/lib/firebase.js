import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

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
export const firestore = app ? getFirestore(app) : null;
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
