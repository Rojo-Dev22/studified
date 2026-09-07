/**
 * $0 Cost Firewall — application-level usage budgets.
 *
 * Architecture reference: "Studified — $0/Month Database & Scaling Architecture"
 * (Sections 6, 25, 26, 27, 28).
 *
 * What this implements:
 *  - The app tracks its own daily Firestore read/write/delete counters (plus
 *    Worker-request and AI-request counters) instead of waiting for provider
 *    dashboards to reveal exhausted quotas (§26).
 *  - Safety limits sit BELOW the provider free-tier limits (50k reads / 20k
 *    writes / 20k deletes per day on Firestore Spark) to leave headroom (§6).
 *  - Degradation ladder: 90% → warning / reduce traffic, 95% → stop background
 *    sync, 100% → read cached/local data only. All checks fail CLOSED.
 *  - Counters rotate on a daily window with a built-in safety margin: they
 *    reset on the first budget check after local midnight, never assuming the
 *    provider's exact reset second (§27).
 *  - Quota simulation (dev builds only) enables the §28 degradation tests
 *    without waiting for real traffic.
 *
 * Everything here is configuration, not truth: provider quotas change (§35),
 * so every limit is overridable via VITE_* environment variables.
 */

const STORAGE_KEY = 'studified_budget_v1';

const envNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

// @ts-ignore — Vite replaces the literal `import.meta.env` token at serve/build time (do NOT rewrite to (import.meta).env)
const envValue = (key) =>
  typeof import.meta !== 'undefined' ? import.meta.env?.[key] : undefined;

// ─── Safety limits (intentionally lower than provider limits) ────────
export const SAFE_LIMITS = {
  firestoreReadsDaily: envNumber(envValue('VITE_FIREBASE_READ_BUDGET'), 45000),
  firestoreWritesDaily: envNumber(envValue('VITE_FIREBASE_WRITE_BUDGET'), 18000),
  firestoreDeletesDaily: envNumber(envValue('VITE_FIREBASE_DELETE_BUDGET'), 18000),
  workerRequestsDaily: envNumber(envValue('VITE_WORKER_REQUEST_BUDGET'), 90000),
  aiRequestsDaily: envNumber(envValue('VITE_AI_DAILY_LIMIT'), 150),
};

// Map of counter kind → SAFE_LIMITS key.
const KIND_LIMITS = {
  reads: 'firestoreReadsDaily',
  writes: 'firestoreWritesDaily',
  deletes: 'firestoreDeletesDaily',
  workerRequests: 'workerRequestsDaily',
  aiRequests: 'aiRequestsDaily',
};

// Degradation thresholds (Section 6): 90% → warning, 95% → stop background
// sync, 100% → local-only. Configurable without changing application logic.
export const THRESHOLDS = { warning: 0.9, degraded: 0.95, exhausted: 1.0 };

export const BUDGET_STATES = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  DEGRADED: 'degraded',
  EXHAUSTED: 'exhausted',
};

const STATE_ORDER = [
  BUDGET_STATES.HEALTHY,
  BUDGET_STATES.WARNING,
  BUDGET_STATES.DEGRADED,
  BUDGET_STATES.EXHAUSTED,
];

// ─── Window + counter storage ────────────────────────────────────────

function todayWindowId() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function emptyCounters() {
  return { reads: 0, writes: 0, deletes: 0, workerRequests: 0, aiRequests: 0 };
}

function loadState() {
  const fresh = { windowId: todayWindowId(), counters: emptyCounters(), simulated: null };
  if (typeof localStorage === 'undefined') return fresh;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw);
    // Daily reset (§27): a stale window rotates on next access.
    if (parsed?.windowId === fresh.windowId && parsed.counters) {
      return {
        windowId: parsed.windowId,
        counters: { ...emptyCounters(), ...parsed.counters },
        simulated: parsed.simulated && typeof parsed.simulated === 'object' ? parsed.simulated : null,
      };
    }
  } catch {
    /* corrupted counters — start fresh; the fail-closed checks below still apply */
  }
  return fresh;
}

let state = loadState();
const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — counters stay in memory for this session */
  }
}

function rollWindowIfNeeded() {
  const today = todayWindowId();
  if (state.windowId !== today) {
    state = { windowId: today, counters: emptyCounters(), simulated: null };
    persist();
    notify();
  }
}

// ─── Ratio / state helpers ───────────────────────────────────────────

function limitFor(kind) {
  return SAFE_LIMITS[KIND_LIMITS[kind]] ?? 0;
}

function usedFor(kind) {
  rollWindowIfNeeded();
  const base = state.counters[kind] || 0;
  const simulated = state.simulated?.[kind];
  return typeof simulated === 'number' && simulated >= 0 ? Math.max(base, simulated) : base;
}

function ratioFor(kind) {
  const limit = limitFor(kind);
  if (limit <= 0) return 1; // a zero limit is always exhausted (fail closed)
  return usedFor(kind) / limit;
}

function stateForRatio(ratio) {
  if (ratio >= THRESHOLDS.exhausted) return BUDGET_STATES.EXHAUSTED;
  if (ratio >= THRESHOLDS.degraded) return BUDGET_STATES.DEGRADED;
  if (ratio >= THRESHOLDS.warning) return BUDGET_STATES.WARNING;
  return BUDGET_STATES.HEALTHY;
}

/** Current degradation state for a single budget kind. */
export function budgetStateFor(kind) {
  return stateForRatio(ratioFor(kind));
}

function worstState() {
  return STATE_ORDER[
    Math.max(...Object.keys(KIND_LIMITS).map((kind) => STATE_ORDER.indexOf(budgetStateFor(kind))))
  ];
}

function notify() {
  const snapshot = getBudgetState();
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
      /* listener errors must never break budget accounting */
    }
  });
}

function record(kind, count = 1) {
  rollWindowIfNeeded();
  const amount = Math.max(1, Number(count) || 1);
  const before = stateForRatio(ratioFor(kind));
  state.counters[kind] = (state.counters[kind] || 0) + amount;
  persist();
  const after = stateForRatio(ratioFor(kind));
  if (after !== before) notify();
  return state.counters[kind];
}

function canPerform(kind, count = 1) {
  const limit = limitFor(kind);
  if (limit <= 0) return false; // fail closed on unknown/zero limits
  return usedFor(kind) + Math.max(1, Number(count) || 1) <= limit;
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * May `count` billable Firestore reads happen now? Fail-closed: returns false
 * once the daily read safety budget is exhausted (100%).
 */
export const canPerformRead = (count = 1) => canPerform('reads', count);

/**
 * May `count` billable Firestore writes/deletes happen now? Fail-closed.
 */
export const canPerformWrite = (count = 1) => canPerform('writes', count);
export const canPerformDelete = (count = 1) => canPerform('deletes', count);

/** Trusted-command (Worker) budget — used by the future command API (§12). */
export const canPerformWorkerRequest = (count = 1) => canPerform('workerRequests', count);
export const recordWorkerRequest = (count = 1) => record('workerRequests', count);

/** Daily AI allowance (§17): hard cap, no paid fallback. */
export const canUseAI = () => canPerform('aiRequests', 1);

export const recordRead = (count = 1) => record('reads', count);
export const recordWrite = (count = 1) => record('writes', count);
export const recordDelete = (count = 1) => record('deletes', count);
export const recordAIRequest = (count = 1) => record('aiRequests', count);

/** Full snapshot for UI badges / debug panels. */
export function getBudgetState() {
  const perKind = {};
  for (const kind of Object.keys(KIND_LIMITS)) {
    perKind[kind] = {
      used: usedFor(kind),
      limit: limitFor(kind),
      ratio: ratioFor(kind),
      state: budgetStateFor(kind),
    };
  }
  return {
    state: worstState(),
    windowId: state.windowId,
    counters: { ...state.counters },
    simulated: state.simulated ? { ...state.simulated } : null,
    limits: { ...SAFE_LIMITS },
    perKind,
    canRead: canPerform('reads'),
    canWrite: canPerform('writes'),
    canDelete: canPerform('deletes'),
    canUseAI: canPerform('aiRequests'),
  };
}

/** ≥90% of any daily budget — reduce non-essential traffic (§6). */
export function shouldReduceTraffic() {
  return Object.keys(KIND_LIMITS).some((kind) => ratioFor(kind) >= THRESHOLDS.warning);
}

/** ≥95% — stop background/periodic synchronization (§6). */
export function shouldStopBackgroundSync() {
  return Object.keys(KIND_LIMITS).some((kind) => ratioFor(kind) >= THRESHOLDS.degraded);
}

/** ≥100% — local-only mode: cloud traffic pauses until reset (§25). */
export function isLocalOnlyMode() {
  return Object.keys(KIND_LIMITS).some((kind) => ratioFor(kind) >= THRESHOLDS.exhausted);
}

/** Subscribe to budget-state changes (fires when a threshold is crossed). */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Quota simulation (§28) — DEV BUILDS ONLY.
 * Pass absolute usage per kind, e.g. simulateQuota({ writes: 18000 }) reports
 * the write budget as fully used so degradation paths can be verified without
 * real traffic. Omit kinds to keep their real counters; call
 * clearQuotaSimulation() to restore normal behavior.
 */
export function simulateQuota(usage = {}) {
  // @ts-ignore — Vite replaces the literal `import.meta.env` token at serve/build time
  if (typeof import.meta !== 'undefined' && !import.meta.env?.DEV) {
    console.warn('simulateQuota is available in dev builds only');
    return;
  }
  const simulated = {};
  for (const kind of Object.keys(KIND_LIMITS)) {
    const value = Number(usage[kind]);
    simulated[kind] = Number.isFinite(value) && value >= 0 ? value : null;
  }
  state = { ...state, simulated };
  persist();
  notify();
}

/** Restore real counters after simulateQuota(). */
export function clearQuotaSimulation() {
  state = { ...state, simulated: null };
  persist();
  notify();
}

