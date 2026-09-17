/**
 * Headless stub for `@/lib/db` used by scripts/smoke-quiz.mjs (SSR render test).
 *
 * Mirrors the real module's export surface (getDb / initDbForUser / clearDb /
 * db) so Vite's dependency scanner resolves every import, without touching
 * Firebase or localStorage. Any property chain is callable:
 * db.auth.me(), db.entities.QuizSession.list(), etc.
 */
const makeStub = () =>
  new Proxy(function stub() {}, {
    get: (_target, prop) => {
      if (prop === 'then') return undefined; // never a thenable
      if (prop === 'toString' || prop === 'valueOf') return () => '';
      return makeStub();
    },
    apply: () => Promise.resolve({}),
  });

export const db = makeStub();

export function getDb() {
  return db;
}

export function initDbForUser() {
  return db;
}

export function clearDb() {}
