import { initLocalDb } from './localDb';

export function getDb() {
  if (!globalThis.__B44_DB__) {
    throw new Error('Database not initialized — sign in first');
  }
  return globalThis.__B44_DB__;
}

export function initDbForUser(uid, profile, initialStore = null) {
  return initLocalDb(uid, profile, initialStore);
}

export function clearDb() {
  globalThis.__B44_DB__ = null;
}

/** Proxy so imports always use the live DB after login. */
export const db = new Proxy(
  {},
  {
    get(_, prop) {
      const real = getDb();
      if (prop === 'getStore') {
        return real.getStore;
      }
      const value = real[prop];
      if (typeof value === 'function') {
        return value.bind(real);
      }
      return value;
    },
  }
);
