// ─── Game 3/5 · The Logic Tower ────────────────────────────────────
// Daily 5-floor deduction puzzle. Exactly one puzzle unlocks per UTC
// day, deterministically generated & brute-force verified to have a
// single unique solution (120 permutations checked — trivial cost).
// • localStorage renders solved state instantly, tracks streaks and
//   auto-saves the in-progress guess on every change.
// • Clock tampering sanity check: days can never go backwards.
// • Win → emoji grid copied via navigator.clipboard for shameless
//   group-chat bragging.

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Lightbulb, Flame, Share2, Trophy } from '@/components/ui/icons';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { db } from '@/lib/db';
import { awardCoins } from '@/lib/coins';
import { sfx, haptic, saveBestScore, getBestScore, getTowerStreak, recordTowerWin } from './gameShared';

const FLOORS = 5;
const MAX_ATTEMPTS = 6;
const WIN_COINS = 25;
const DAY_MS = 86400000;

/** Icon tag shown before every clue so meanings are obvious at a glance. */
const CLUE_ICONS = {
  above: '⬆️',
  directlyAbove: '⏫',
  adjacent: '↔️',
  onFloor: '📍',
  notFloor: '🚫',
};

const BANKS = [
  ['Dragon', 'Owl', 'Fox', 'Turtle', 'Raven'],
  ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'],
  ['Neuron', 'Electron', 'Photon', 'Proton', 'Neutron'],
  ['Pyramid', 'Castle', 'Tower', 'Temple', 'Palace'],
];

/* ── Deterministic daily generation ─────────────────────────────── */

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** UTC day index, hardened against backwards clock tampering. */
function currentDay() {
  let d = Math.floor(Date.now() / DAY_MS);
  try {
    const last = Number(localStorage.getItem('lt:lastDay')) || 0;
    if (last && d < last) d = last; // system clock rolled back — clamp
    else localStorage.setItem('lt:lastDay', String(d));
  } catch {
    /* storage unavailable */
  }
  return d;
}

function seededShuffle(arr, rnd) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const out = [];
  arr.forEach((x, i) => {
    permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).forEach((p) => out.push([x, ...p]));
  });
  return out;
}

function clueHolds(clue, perm) {
  // perm[floor] = item ; floor 0 = ground … floor 4 = penthouse
  const fa = perm.indexOf(clue.a);
  switch (clue.t) {
    case 'above':
      return perm.indexOf(clue.b) < fa;
    case 'directlyAbove':
      return fa === perm.indexOf(clue.b) + 1;
    case 'adjacent':
      return Math.abs(fa - perm.indexOf(clue.b)) === 1;
    case 'onFloor':
      return perm[clue.n] === clue.a;
    case 'notFloor':
      return perm[clue.n] !== clue.a;
    default:
      return true;
  }
}

function countSolutions(clues) {
  let n = 0;
  outer: for (const perm of permutations([0, 1, 2, 3, 4])) {
    for (const c of clues) if (!clueHolds(c, perm)) continue outer;
    if (++n > 1) return 2; // early exit — only uniqueness matters
  }
  return n;
}
/* ── Clue text & daily puzzle assembly ──────────────────────────── */

function clueText(c, names) {
  switch (c.t) {
    case 'above':
      return `${names[c.a]} lives somewhere above ${names[c.b]}.`;
    case 'directlyAbove':
      return `${names[c.a]} lives directly above ${names[c.b]}.`;
    case 'adjacent':
      return `${names[c.a]} lives directly beside ${names[c.b]}.`;
    case 'onFloor':
      return `${names[c.a]} lives on floor ${c.n + 1}.`;
    case 'notFloor':
      return `${names[c.a]} does NOT live on floor ${c.n + 1}.`;
    default:
      return '';
  }
}

/** Deterministic, uniqueness-verified daily puzzle. */
function buildPuzzle(day) {
  const rnd = mulberry32(day ^ 0x51ab3f);
  const names = BANKS[day % BANKS.length];
  const solution = seededShuffle([0, 1, 2, 3, 4], rnd); // perm[floor] = item idx
  const floorOf = (it) => solution.indexOf(it);

  const relational = [];
  const facts = [];
  for (let a = 0; a < FLOORS; a++) {
    for (let b = 0; b < FLOORS; b++) {
      if (a === b) continue;
      const fa = floorOf(a);
      const fb = floorOf(b);
      if (fa > fb) relational.push({ t: 'above', a, b });
      if (Math.abs(fa - fb) === 1) {
        if (fa === fb + 1) relational.push({ t: 'directlyAbove', a, b });
        relational.push({ t: 'adjacent', a, b });
      }
    }
  }
  for (let it = 0; it < FLOORS; it++) {
    for (let f = 0; f < FLOORS; f++) {
      facts.push({ t: solution[f] === it ? 'onFloor' : 'notFloor', a: it, n: f });
    }
  }

  // Relational clues first (more fun), floor facts as the guarantee.
  const pool = [...seededShuffle(relational, rnd), ...seededShuffle(facts, rnd)];
  const clues = [];
  for (const c of pool) {
    clues.push(c);
    if (countSolutions(clues) === 1) break;
    clues.pop(); // redundant — skip it
  }
  return { names, solution, clues: clues.map((c) => ({ ...c, text: clueText(c, names) })) };
}

/* ── Persistence helpers ────────────────────────────────────────── */

const dayKey = (d) => `lt:puzzle-${d}`;

function loadDayState(d) {
  try {
    return JSON.parse(localStorage.getItem(dayKey(d)));
  } catch {
    return null;
  }
}

function persistDayState(d, s) {
  try {
    localStorage.setItem(dayKey(d), JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

async function copyText(t) {
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = t;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

/* ═══════════════════ Component ═══════════════════ */

export default function LogicTower() {
  const [day] = useState(currentDay);
  const puzzle = useMemo(() => buildPuzzle(day), [day]);
  const names = puzzle.names;

  const [placement, setPlacement] = useState(() => Array(FLOORS).fill(null));
  const [selected, setSelected] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [status, setStatus] = useState('playing'); // playing | won | lost
  const [streak, setStreak] = useState(getTowerStreak);
  const awardedRef = useRef(false);
  const best = getBestScore('logic-tower');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => db.auth.me() });
  const queryClient = useQueryClient();

  // Restore today's saved progress instantly (offline-first)
  useEffect(() => {
    const saved = loadDayState(day);
    if (!saved) return;
    setAttempts(saved.attempts || []);
    if (saved.won) {
      setStatus('won');
      awardedRef.current = true; // never double-pay on reload
    } else if (saved.lost) {
      setStatus('lost');
    }
    try {
      const p = JSON.parse(localStorage.getItem(`lt:sel-${day}`));
      if (Array.isArray(p) && p.length === FLOORS) setPlacement(p);
    } catch {
      /* ignore */
    }
  }, [day]);

  // Auto-save the in-progress guess on every change
  useEffect(() => {
    if (status !== 'playing') return;
    try {
      localStorage.setItem(`lt:sel-${day}`, JSON.stringify(placement));
    } catch {
      /* ignore */
    }
  }, [placement, day, status]);

  const tray = [0, 1, 2, 3, 4].filter((it) => !placement.includes(it));
  const canSubmit = placement.every((v) => v != null);
  const latestMarks = attempts.length ? attempts[attempts.length - 1].m : null;
  /* ── Interactions ──────────────────────────────────────────────── */

  const tapCreature = useCallback((it) => {
    if (status !== 'playing') return;
    setSelected((cur) => {
      sfx.tap();
      haptic(8);
      return cur === it ? null : it;
    });
  }, [status]);

  const tapFloor = useCallback(
    (f) => {
      if (status !== 'playing') return;
      if (selected != null) {
        setPlacement((prev) => {
          const next = [...prev];
          next[f] = selected;
          return next;
        });
        setSelected(null);
        sfx.pop();
        haptic(12);
      } else {
        setPlacement((prev) => {
          if (prev[f] == null) return prev;
          const next = [...prev];
          next[f] = null;
          return next;
        });
        sfx.tap();
      }
    },
    [selected, status]
  );

  const persistEnd = useCallback(
    (attemptsList, outcome) => {
      persistDayState(day, { attempts: attemptsList, won: outcome === 'won', lost: outcome === 'lost' });
    },
    [day]
  );

  const awardWin = useCallback(() => {
    if (awardedRef.current) return;
    awardedRef.current = true;
    saveBestScore('logic-tower', best + 1);
    awardCoins(db, user, 'gamecoin', WIN_COINS)
      .then(() => queryClient.invalidateQueries({ queryKey: ['currentUser'] }))
      .catch(() => {});
  }, [best, user, queryClient]);

  const submitGuess = useCallback(() => {
    if (!canSubmit || status !== 'playing') return;
    const m = placement.map((it, f) => {
      if (puzzle.solution[f] === it) return 'g';
      return puzzle.solution.includes(it) ? 'y' : 'x';
    });
    const att = [...attempts, { p: [...placement], m }];
    setAttempts(att);
    setPlacement(Array(FLOORS).fill(null));
    setSelected(null);

    if (m.every((x) => x === 'g')) {
      setStatus('won');
      setStreak(recordTowerWin(day));
      persistEnd(att, 'won');
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.55 } });
      sfx.win();
      haptic([30, 40, 30]);
      awardWin();
    } else if (att.length >= MAX_ATTEMPTS) {
      setStatus('lost');
      persistEnd(att, 'lost');
      sfx.lose();
    } else {
      sfx.wrong();
      haptic(50);
      // keep autosave in sync with cleared board
      try {
        localStorage.setItem(`lt:sel-${day}`, JSON.stringify(Array(FLOORS).fill(null)));
      } catch {
        /* ignore */
      }
    }
  }, [attempts, canSubmit, day, placement, puzzle, status, persistEnd, awardWin]);

  const giveUp = useCallback(() => {
    if (status !== 'playing') return;
    setStatus('lost');
    persistEnd(attempts, 'lost');
    sfx.lose();
  }, [attempts, persistEnd, status]);

  const share = useCallback(async () => {
    const emoji = { g: '🟩', y: '🟨', x: '⬛' };
    const lines = [`🔮 Studified Logic Tower #${day % 1000}`];
    attempts.forEach((a) => lines.push(a.m.map((c) => emoji[c]).join('')));
    if (status === 'won') lines.push(`🔥 Streak ${streak.cur}`);
    else if (status === 'lost') lines.push('💀 Failed today — try tomorrow!');
    const ok = await copyText(lines.join('\n'));
    if (ok) toast.success('Result copied to clipboard');
    else toast.error('Could not access clipboard');
  }, [attempts, day, status, streak]);
  const emojiMap = { g: '🟩', y: '🟨', x: '⬛' };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Daily header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Daily Puzzle</p>
          <p className="text-sm font-bold text-violet-300">#{day % 1000}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="font-bold text-foreground">{streak.cur}</span> · best {streak.best}
          </div>
          {status === 'playing' && attempts.length > 0 && (
            <Button variant="ghost" size="sm" onClick={giveUp} className="h-7 text-[11px] text-muted-foreground hover:text-rose-300">
              Give up
            </Button>
          )}
        </div>
      </div>

      {/* How to play — always visible so nobody is lost */}
      <div className="mb-4 rounded-xl border border-violet-500/25 bg-violet-500/5 p-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-violet-300 mb-1.5">How to play</p>
        <ol className="text-[11px] text-muted-foreground space-y-1">
          <li>1️⃣ Five residents live in this tower. Use the clues to work out who lives on which floor — Floor 1 is the bottom, Floor 5 the top.</li>
          <li>2️⃣ Tap a resident chip below the tower, then tap a floor to place them. Tap a placed resident again to pick them back up.</li>
          <li>3️⃣ Hit <span className="text-foreground font-semibold">Submit Guess</span>: 🟩 right creature &amp; floor · 🟨 right creature, wrong floor.</li>
          <li>4️⃣ You get <span className="text-foreground font-semibold">6 attempts</span>. Crack it to grow your 🔥 streak — one new puzzle every day!</li>
        </ol>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          <span>⬆️ somewhere above</span>
          <span>⏫ directly above</span>
          <span>↔️ directly beside</span>
          <span>📍 lives on floor N</span>
          <span>🚫 NOT on floor N</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        {/* ── The Tower ── */}
        <div className={`rounded-xl border bg-card/40 p-3 sm:p-4 ${status === 'won' ? 'border-emerald-500/40' : status === 'lost' ? 'border-rose-500/40' : 'border-border'}`}>
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
              <span key={i} className={`w-2 h-2 rounded-full ${i < attempts.length ? 'bg-accent' : 'bg-secondary border border-border'}`} />
            ))}
          </div>

          {[...Array(FLOORS)].map((_, idx) => {
            const f = FLOORS - 1 - idx; // render penthouse first
            const occ = placement[f];
            const shown = status === 'playing' ? occ : puzzle.solution[f];
            const mark = latestMarks ? latestMarks[f] : null;
            return (
              <div key={f} className="flex items-center gap-2 mb-2 last:mb-1">
                <span className="w-14 text-right text-[10px] font-mono text-muted-foreground shrink-0">
                  F{f + 1}{f === FLOORS - 1 ? ' · top' : f === 0 ? ' · bottom' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => tapFloor(f)}
                  disabled={status !== 'playing'}
                  className={`flex-1 h-12 rounded-lg border flex items-center px-3 transition-all
                    ${occ == null && status === 'playing'
                      ? 'border-dashed border-border/70 bg-transparent cursor-pointer [@media(hover:hover)]:hover:border-accent/50'
                      : mark === 'g' ? '!border-emerald-500 !bg-emerald-500/15 cursor-default'
                      : mark === 'y' ? '!border-amber-500 !bg-amber-500/10 cursor-default'
                      : 'border-border bg-card cursor-pointer'}`}
                >
                  {shown != null ? (
                    <span className={`text-xs sm:text-sm font-bold ${mark === 'g' || status === 'won' ? 'text-emerald-300' : mark === 'y' ? 'text-amber-300' : 'text-foreground'}`}>
                      {names[shown]}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">{selected != null ? '↓ place here' : 'empty floor'}</span>
                  )}
                </button>
              </div>
            );
          })}
          {/* Residents tray */}
          <div className="mt-3 pt-3 border-t border-border/60">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 text-center">Residents</p>
            <div className="flex flex-wrap justify-center gap-2 min-h-[34px]">
              {[0, 1, 2, 3, 4].map((it) => {
                const placedSomewhere = placement.includes(it);
                if (status === 'playing' && placedSomewhere) return null;
                return (
                  <button
                    key={it}
                    type="button"
                    onClick={() => tapCreature(it)}
                    disabled={status !== 'playing'}
                    className={`h-8 px-3 rounded-full border text-xs font-semibold transition-all
                      ${selected === it
                        ? 'border-accent ring-2 ring-accent bg-accent/20 text-accent scale-105'
                        : 'bg-card border-border text-foreground disabled:opacity-50 enabled:hover:border-accent/40 enabled:active:scale-95'}`}
                  >
                    {names[it]}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-center text-[10px] text-accent font-medium">
              {selected != null
                ? `Now tap a floor to place ${names[selected]}`
                : canSubmit
                  ? 'All residents placed — ready to submit!'
                  : 'Tap a resident chip to begin placing'}
            </p>
          </div>
        </div>

        {/* ── Clues · history · actions ── */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card/40 p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Clues</span>
            </div>
            <ul className="space-y-1.5">
              {puzzle.clues.map((c, i) => (
                <li key={i} className="text-xs text-foreground/90 flex gap-2 leading-relaxed">
                  <span className="text-accent font-bold shrink-0">{i + 1}.</span>
                  <span className="shrink-0" title="Clue type">{CLUE_ICONS[c.t] || '💡'}</span>
                  {c.text}
                </li>
              ))}
            </ul>
          </div>

          {attempts.length > 0 && (
            <div className="rounded-xl border border-border bg-card/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Guesses</p>
              <div className="space-y-1.5">
                {attempts.map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-4 font-mono">{i + 1}</span>
                    <span className="tracking-widest">{a.m.map((c) => emojiMap[c]).join('')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === 'playing' ? (
            <Button onClick={submitGuess} disabled={!canSubmit} size="lg" className="w-full bg-accent text-accent-foreground">
              Submit Guess · Attempt {Math.min(attempts.length + 1, MAX_ATTEMPTS)} of {MAX_ATTEMPTS}
            </Button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border p-4 text-center ${status === 'won' ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-rose-500/50 bg-rose-500/10'}`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Trophy className={`w-5 h-5 ${status === 'won' ? 'text-emerald-400' : 'text-rose-400'}`} />
                <p className={`font-black ${status === 'won' ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {status === 'won' ? 'TOWER SOLVED!' : 'TOWER STANDS'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                {status === 'won'
                  ? `Cracked it in ${attempts.length} ${attempts.length === 1 ? 'guess' : 'guesses'} · streak ${streak.cur}`
                  : 'The true arrangement is revealed on the tower'}
              </p>
              {status === 'won' && <p className="text-amber-300 font-semibold mb-2">+{WIN_COINS} GameCoin 🪙</p>}
              <Button size="sm" onClick={share} className="mt-1 bg-accent text-accent-foreground">
                <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share result
              </Button>
              <p className="text-[10px] text-muted-foreground mt-2.5">A fresh tower unlocks tomorrow (UTC)</p>
            </motion.div>
          )}
        </div>
      </div>

      <p className="mt-4 text-[10px] text-muted-foreground text-center">
        Tap a resident then a floor to place them · tap an occupied floor to remove · 🟩 right spot · 🟨 wrong spot
      </p>
    </div>
  );
}
