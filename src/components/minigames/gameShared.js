// ─── Shared mini-game utilities ────────────────────────────────────
// Low-latency synthesized SFX (Web Audio API — zero asset loading),
// mobile haptics, and local best-score persistence shared by every
// game in the Studified mini-game suite.

const BEST_KEY = 'studified:minigame:best';
const MUTE_KEY = 'studified:minigame:muted';

let ctx = null;

function audioCtx() {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, dur = 0.09, type = 'sine', vol = 0.12, delay = 0) {
  if (isMuted()) return;
  const ac = audioCtx();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(Math.max(vol, 0.001), t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  tap: () => tone(520, 0.05, 'sine', 0.06),
  select: () => tone(660, 0.06, 'triangle', 0.08),
  pop: () => tone(340, 0.07, 'square', 0.07),
  tick: () => tone(920, 0.03, 'sine', 0.05),
  correct: () => {
    tone(620, 0.09, 'triangle', 0.12);
    tone(880, 0.12, 'triangle', 0.12, 0.07);
  },
  wrong: () => {
    tone(200, 0.16, 'sawtooth', 0.1);
    tone(150, 0.2, 'sawtooth', 0.08, 0.06);
  },
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'triangle', 0.12, i * 0.11));
  },
  lose: () => {
    [330, 262, 196].forEach((f, i) => tone(f, 0.18, 'sawtooth', 0.09, i * 0.14));
  },
};

/** Conditional haptic tick (no-op on desktop / unsupported browsers). */
export function haptic(ms = 10) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {
    /* unsupported */
  }
}

/** True on touch-first devices (used to tailor hints & hit targets). */
export function isMobileTouch() {
  if (typeof window === 'undefined') return false;
  return (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
}

export function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Toggle global game SFX mute. Returns the new muted state. */
export function toggleMuted() {
  try {
    const next = !isMuted();
    localStorage.setItem(MUTE_KEY, next ? '1' : '0');
    return next;
  } catch {
    return false;
  }
}

export function getBestScore(gameId) {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY))?.[gameId] || 0;
  } catch {
    return 0;
  }
}

/** Persist score only when it beats the stored best. */
export function saveBestScore(gameId, score) {
  try {
    const all = JSON.parse(localStorage.getItem(BEST_KEY)) || {};
    if (score > (all[gameId] || 0)) {
      all[gameId] = score;
      localStorage.setItem(BEST_KEY, JSON.stringify(all));
    }
  } catch {
    /* storage unavailable */
  }
}

/* ─── Logic Tower streak (shared with hub + dashboard badges) ─────── */

const STREAK_KEY = 'lt:streak';

export function getTowerStreak() {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY)) || { last: 0, cur: 0, best: 0 };
  } catch {
    return { last: 0, cur: 0, best: 0 };
  }
}

/** Register a win for `day` (UTC day index). Returns the updated streak. */
export function recordTowerWin(day) {
  const s = getTowerStreak();
  if (s.last === day) return s; // already counted today
  const cur = s.last === day - 1 ? s.cur + 1 : 1;
  const next = { last: day, cur, best: Math.max(cur, s.best || 0) };
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

/* ─── Paid hints ──────────────────────────────────────────────────── */

/**
 * Deduct `cost` GameCoin for a hint. Resolves true when the balance
 * covered it (coins already deducted); false when funds are insufficient.
 * The caller owns toasts + query invalidation.
 */
export async function spendForHint(db, user, cost) {
  try {
    const { spendCoins } = await import('@/lib/coins');
    return await spendCoins(db, user, 'gamecoin', cost);
  } catch {
    return false;
  }
}

