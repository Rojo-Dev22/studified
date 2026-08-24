// ─── Game 4/5 · The Quad-Grid ──────────────────────────────────────
// Category sorting: sixteen tiles hide four themed groups of four.
// Find them all with at most four mistakes.
// • Selection is capped at four tiles; submission checks membership
//   against category arrays (items are globally unique by design).
// • Wrong → horizontal shake + mistake counter. Right → smooth
//   slide-up reveal and the remaining tiles settle with spring layout
//   transitions (transform .3s cubic-bezier feel).

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trophy, Timer, Lightbulb } from '@/components/ui/icons';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { awardCoins } from '@/lib/coins';
import { sfx, haptic, saveBestScore, getBestScore, spendForHint } from './gameShared';
import HintConfirmDialog from './HintConfirmDialog';

const GAME_MS = 120000; // 2 minutes on the clock
const HINT_COST = 15; // GameCoin per hint

const GROUP_COLORS = [
  { bg: 'bg-emerald-500/15 border-emerald-500/40', text: 'text-emerald-300', chip: 'bg-emerald-500/25 border-emerald-400/50' },
  { bg: 'bg-amber-500/15 border-amber-500/40', text: 'text-amber-300', chip: 'bg-amber-500/25 border-amber-400/50' },
  { bg: 'bg-violet-500/15 border-violet-500/40', text: 'text-violet-300', chip: 'bg-violet-500/25 border-violet-400/50' },
  { bg: 'bg-blue-500/15 border-blue-500/40', text: 'text-blue-300', chip: 'bg-blue-500/25 border-blue-400/50' },
];

const SETS = [
  // ── Warm-ups: clean, classic categories ──
  [
    { name: 'Planets', items: ['Mars', 'Venus', 'Saturn', 'Neptune'] },
    { name: 'Shapes', items: ['Triangle', 'Circle', 'Square', 'Pentagon'] },
    { name: 'Parts of Speech', items: ['Noun', 'Verb', 'Adjective', 'Adverb'] },
    { name: 'States of Matter', items: ['Solid', 'Liquid', 'Gas', 'Plasma'] },
  ],
  [
    { name: 'Noble Gases', items: ['Helium', 'Neon', 'Argon', 'Xenon'] },
    { name: 'SI Units', items: ['Newton', 'Joule', 'Watt', 'Pascal'] },
    { name: 'World Capitals', items: ['Cairo', 'Tokyo', 'Paris', 'Lima'] },
    { name: 'Keyboard Keys', items: ['Shift', 'Tab', 'Escape', 'Control'] },
  ],
  // ── Sneaky: everyday words hiding wordplay links ──
  [
    { name: '___ Fly', items: ['Fire', 'Dragon', 'Butter', 'House'] },
    { name: '___ Mill', items: ['Wind', 'Paper', 'Pepper', 'Water'] },
    { name: 'Greek Letters', items: ['Alpha', 'Beta', 'Gamma', 'Delta'] },
    { name: 'Berries', items: ['Strawberry', 'Blueberry', 'Blackberry', 'Raspberry'] },
  ],
  [
    { name: '___ Ball', items: ['Foot', 'Base', 'Basket', 'Snow'] },
    { name: 'Chess Pieces', items: ['Pawn', 'Rook', 'Bishop', 'Knight'] },
    { name: 'Card Games', items: ['Poker', 'Bridge', 'Solitaire', 'Uno'] },
    { name: 'DNA Bases', items: ['Adenine', 'Thymine', 'Guanine', 'Cytosine'] },
  ],
  [
    { name: '___ Fish', items: ['Star', 'Gold', 'Jelly', 'Sword'] },
    { name: 'Prime Numbers', items: ['Two', 'Three', 'Five', 'Seven'] },
    { name: 'Cloud Types', items: ['Cirrus', 'Cumulus', 'Stratus', 'Nimbus'] },
    { name: 'Currencies', items: ['Yen', 'Rupee', 'Rand', 'Peso'] },
  ],
  // ── Trickier: knowledge with near-miss distractors ──
  [
    { name: 'Trig Functions', items: ['Sine', 'Cosine', 'Tangent', 'Secant'] },
    { name: 'Punctuation', items: ['Comma', 'Period', 'Colon', 'Semicolon'] },
    { name: 'Lab Equipment', items: ['Beaker', 'Flask', 'Funnel', 'Goggles'] },
    { name: 'Rivers', items: ['Nile', 'Amazon', 'Yangtze', 'Danube'] },
  ],
  [
    { name: 'EM Spectrum Waves', items: ['Radio', 'Infrared', 'Visible', 'Ultraviolet'] },
    { name: 'Forces', items: ['Friction', 'Gravity', 'Tension', 'Magnetism'] },
    { name: 'Music Dynamics', items: ['Piano', 'Forte', 'Crescendo', 'Diminuendo'] },
    { name: 'Optics Devices', items: ['Prism', 'Lens', 'Mirror', 'Telescope'] },
  ],
  [
    { name: 'Cell Division Phases', items: ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'] },
    { name: 'Weather Instruments', items: ['Barometer', 'Thermometer', 'Anemometer', 'Hygrometer'] },
    { name: 'Geologic Periods', items: ['Jurassic', 'Triassic', 'Cretaceous', 'Permian'] },
    { name: 'Metal Elements', items: ['Gold', 'Silver', 'Copper', 'Cobalt'] },
  ],
  [
    { name: 'Programming Concepts', items: ['Loop', 'Array', 'Boolean', 'Recursion'] },
    { name: 'Body Systems', items: ['Digestive', 'Nervous', 'Respiratory', 'Circulatory'] },
    { name: 'Poetry Forms', items: ['Sonnet', 'Haiku', 'Limerick', 'Ode'] },
    { name: 'Algebra Terms', items: ['Variable', 'Constant', 'Coefficient', 'Expression'] },
  ],
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Flatten a set into 16 unique tiles. Uniqueness is guaranteed because
 *  every category contributes exactly its own four items. */
function buildDeck(setIdx) {
  const tiles = [];
  let id = 0;
  SETS[setIdx].forEach((cat, ci) => {
    cat.items.forEach((txt) => tiles.push({ id: ++id, txt, cat: ci }));
  });
  return shuffle(tiles);
}
/* ═══════════════════ Component ═══════════════════ */

export default function QuadGrid() {
  const lastSetRef = useRef(-1);
  const animLock = useRef(false);
  const awardedRef = useRef(false);

  const [setIdx, setSetIdx] = useState(() => {
    const i = Math.floor(Math.random() * SETS.length);
    lastSetRef.current = i;
    return i;
  });
  const [tiles, setTiles] = useState(() => buildDeck(lastSetRef.current));
  const [selected, setSelected] = useState([]);
  const [shakingIds, setShakingIds] = useState(() => new Set());
  const [solved, setSolved] = useState([]); // [{ ci, name, items }] in solve order
  const [mistakesLeft, setMistakesLeft] = useState(4);
  const [status, setStatus] = useState('playing'); // playing | won | lost
  const [coins, setCoins] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_MS);
  const timeRef = useRef(GAME_MS);
  const [hintTiles, setHintTiles] = useState(() => new Set());
  const [hintOpen, setHintOpen] = useState(false);
  const [lostReason, setLostReason] = useState('mistakes'); // mistakes | time

  const best = getBestScore('quad-grid');
  const cats = SETS[setIdx];

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => db.auth.me() });
  const queryClient = useQueryClient();

  /** Award coins once per finished run. */
  const payOut = useCallback(
    (earned, scoreVal) => {
      setCoins(earned);
      saveBestScore('quad-grid', scoreVal);
      if (earned > 0 && !awardedRef.current) {
        awardedRef.current = true;
        awardCoins(db, user, 'gamecoin', earned)
          .then(() => queryClient.invalidateQueries({ queryKey: ['currentUser'] }))
          .catch(() => {});
      }
    },
    [user, queryClient]
  );

  const toggleTile = useCallback(
    (id) => {
      if (animLock.current || status !== 'playing') return;
      setSelected((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (prev.length >= 4) return prev; // hard cap of four selections
        sfx.tap();
        haptic(8);
        return [...prev, id];
      });
    },
    [status]
  );

  /** Reveal every remaining group — used for both loss reasons. */
  const revealAll = useCallback(
    (reason) => {
      setStatus('lost');
      setLostReason(reason);
      sfx.lose();
      setSolved((prev) => {
        const rest = cats
          .map((c, ci) => ({ ci, name: c.name, items: c.items }))
          .filter((g) => !prev.some((p) => p.ci === g.ci));
        return [...prev, ...rest];
      });
      setTiles([]);
      setSelected([]);
      setHintTiles(new Set());
      payOut(5, 0); // small consolation payout
    },
    [cats, payOut]
  );

  const finishLost = useCallback(() => revealAll('mistakes'), [revealAll]);

  /** Timeout → same reveal, different headline. */
  const handleTimeout = useCallback(() => revealAll('time'), [revealAll]);

  /* ── Paid hints ─────────────────────────────────────────────────── */

  const requestHint = useCallback(() => {
    if (status !== 'playing') return;
    const anyUnsolved = cats.some((_, ci) => !solved.some((g) => g.ci === ci));
    if (!anyUnsolved || tiles.length < 2) return;
    setHintOpen(true); // double-check before spending coins
  }, [cats, solved, tiles.length, status]);

  const confirmHint = useCallback(async () => {
    setHintOpen(false);
    const ok = await spendForHint(db, user, HINT_COST);
    if (!ok) {
      toast.error('Not enough GameCoin for a hint');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    haptic(15);
    sfx.pop();
    const unsolvedCis = cats.map((_, ci) => ci).filter((ci) => !solved.some((g) => g.ci === ci));
    const ci = unsolvedCis[Math.floor(Math.random() * unsolvedCis.length)];
    const candidates = tiles.filter((t) => t.cat === ci);
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const pair = shuffled.slice(0, Math.min(2, shuffled.length));
    setHintTiles(new Set(pair.map((t) => t.id)));
    setTimeout(() => setHintTiles(new Set()), 4000); // glow for 4 seconds
  }, [cats, solved, tiles, user, queryClient]);

  const submit = useCallback(() => {
    if (animLock.current || status !== 'playing' || selected.length !== 4) return;
    const pickedTexts = selected.map((id) => tiles.find((t) => t.id === id)?.txt);
    const hitCi = cats.findIndex((c) => pickedTexts.every((txt) => txt != null && c.items.includes(txt)));

    if (hitCi !== -1) {
      animLock.current = true;
      sfx.correct();
      haptic(25);
      const group = { ci: hitCi, name: cats[hitCi].name, items: cats[hitCi].items };
      setSolved((prev) => [...prev, group]);
      const clearedIds = new Set(selected);
      setTimeout(() => {
        setTiles(tiles.filter((t) => !clearedIds.has(t.id)));
        setSelected([]);
        animLock.current = false;
        if (solved.length + 1 === 4) {
          setStatus('won');
          confetti({ particleCount: 130, spread: 75, origin: { y: 0.6 } });
          sfx.win();
          setHintTiles(new Set());
          const earned = 15 + mistakesLeft * 5; // 15–35 GameCoin by mistakes left
          payOut(earned, earned);
        }
      }, 380);
    } else {
      sfx.wrong();
      haptic(60);
      setShakingIds(new Set(selected));
      const nextMistakes = mistakesLeft - 1;
      setTimeout(() => {
        setShakingIds(new Set());
        setSelected([]);
      }, 450);
      if (nextMistakes <= 0) {
        setMistakesLeft(0);
        setTimeout(finishLost, 500);
      } else {
        setMistakesLeft(nextMistakes);
      }
    }
  }, [selected, tiles, cats, status, mistakesLeft, solved.length, finishLost, payOut]);

  const playAgain = useCallback(() => {
    let next = Math.floor(Math.random() * SETS.length);
    while (next === lastSetRef.current) next = Math.floor(Math.random() * SETS.length);
    lastSetRef.current = next;
    awardedRef.current = false;
    animLock.current = false;
    setSetIdx(next);
    setTiles(buildDeck(next));
    setSelected([]);
    setSolved([]);
    setMistakesLeft(4);
    setStatus('playing');
    setCoins(0);
    timeRef.current = GAME_MS;
    setTimeLeft(GAME_MS);
    setHintTiles(new Set());
    setHintOpen(false);
    setLostReason('mistakes');
    sfx.pop();
  }, []);

  // 2-minute countdown — running out reveals the whole grid
  useEffect(() => {
    if (status !== 'playing') return undefined;
    const iv = setInterval(() => {
      if (document.hidden) return;
      timeRef.current -= 250;
      if (timeRef.current <= 0) {
        timeRef.current = 0;
        setTimeLeft(0);
        handleTimeout();
      } else {
        setTimeLeft(timeRef.current);
      }
    }, 250);
    return () => clearInterval(iv);
  }, [status, handleTimeout]);
  const mistakesDots = (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <span key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i < mistakesLeft ? 'bg-rose-500' : 'bg-secondary border border-border'}`} />
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-lg mx-auto select-none">
      {/* HUD */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Mistakes left</span>
          {mistakesDots}
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 text-xs font-bold ${timeLeft <= 20000 ? 'text-rose-400' : 'text-muted-foreground'}`}>
            <Timer className="w-3.5 h-3.5" /> {Math.ceil(timeLeft / 1000)}s
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Trophy className="w-3.5 h-3.5 text-amber-300" /> Best {best}
          </div>
        </div>
      </div>

      {/* Clock bar */}
      <div className="h-1 rounded-full bg-secondary overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-200 ${timeLeft <= 20000 ? 'bg-rose-500' : 'bg-accent'}`}
          style={{ width: `${Math.max(0, (timeLeft / GAME_MS) * 100)}%` }}
        />
      </div>

      {/* Solved groups slide up top */}
      <AnimatePresence initial={false}>
        {solved.map((g) => (
          <motion.div
            key={g.ci}
            layout
            initial={{ opacity: 0, y: -14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35 }}
            className={`rounded-lg border px-3 py-2 mb-2 ${GROUP_COLORS[g.ci].bg}`}
          >
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${GROUP_COLORS[g.ci].text}`}>{g.name}</span>
              <span className="text-[10px] text-muted-foreground">{g.items.join(' · ')}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Grid */}
      <div className="relative">
        <motion.div layout className="grid grid-cols-4 gap-2 sm:gap-2.5">
          <AnimatePresence>
            {tiles.map((t) => {
              const isSel = selected.includes(t.id);
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  layout
                  onClick={() => toggleTile(t.id)}
                  exit={{ opacity: 0, y: -30, scale: 0.8 }}
                  animate={shakingIds.has(t.id) ? { x: [0, -9, 9, -6, 6, 0] } : { x: 0 }}
                  transition={{
                    layout: { type: 'spring', damping: 28, stiffness: 350 },
                    duration: 0.4,
                  }}
                  className={`min-h-[56px] sm:min-h-[64px] rounded-xl border p-1.5 flex items-center justify-center text-center text-xs sm:text-sm font-semibold break-words leading-tight cursor-pointer
                    ${hintTiles.has(t.id) ? '!border-amber-400 ring-2 ring-amber-300 !bg-amber-400/20 animate-pulse' : ''}
                    ${isSel ? 'border-accent ring-2 ring-accent bg-accent/15 text-accent' : hintTiles.has(t.id) ? '' : 'bg-card border-border text-foreground [@media(hover:hover)]:hover:border-border/60 [@media(hover:hover)]:hover:bg-card/80'}`}
                >
                  {t.txt}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Result overlay */}
        {status !== 'playing' && (
          <div className="absolute inset-0 z-20 rounded-xl bg-background/90 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center p-6">
              <h2 className={`text-2xl font-black mb-1 ${status === 'won' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {status === 'won' ? 'QUAD COMPLETE!' : lostReason === 'time' ? "TIME'S UP!" : 'OUT OF MISTAKES'}
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                {status === 'won'
                  ? `Solved with ${mistakesLeft} mistakes to spare`
                  : lostReason === 'time'
                    ? 'The clock beat you this round'
                    : 'The grid got you this time'}
              </p>
              {coins > 0 && <p className="text-amber-300 font-semibold mb-4">+{coins} GameCoin 🪙</p>}
              <Button onClick={playAgain} size="lg" className="bg-accent text-accent-foreground">
                <RotateCcw className="w-4 h-4 mr-2" /> New Puzzle
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between gap-3">
        {mistakesDots}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={status !== 'playing'}
            onClick={requestHint}
            className="h-9 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
          >
            <Lightbulb className="w-3.5 h-3.5 mr-1" /> Hint · {HINT_COST} 🪙
          </Button>
          <Button variant="ghost" size="sm" disabled={selected.length === 0 || status !== 'playing'} onClick={() => setSelected([])} className="h-9 text-xs">
            Clear
          </Button>
          <Button size="sm" disabled={selected.length !== 4 || status !== 'playing'} onClick={submit} className="h-9 bg-accent text-accent-foreground hover:bg-accent/90">
            Submit Group ({selected.length}/4)
          </Button>
        </div>
      </div>

      <HintConfirmDialog
        open={hintOpen}
        onOpenChange={setHintOpen}
        cost={HINT_COST}
        title="Spend GameCoin on a hint?"
        description="Two tiles that belong to the same secret group will glow amber for a few seconds."
        onConfirm={confirmHint}
      />

      <p className="mt-3 text-[10px] text-muted-foreground text-center">
        Four hidden themes · pick exactly four tiles · hints cost GameCoin — spend wisely!
      </p>
    </div>
  );
}
