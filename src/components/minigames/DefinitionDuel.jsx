// ─── Game 2/5 · Definition Duel ────────────────────────────────────
// Asynchronous word blitz. A target word sits up top while four
// definitions cascade down lanes.
// • PC: keys 1–4 map straight to lanes for high-speed keyboard play.
// • Mobile: each lane is one full-height tap zone (+15px hitbox slack).
// • Movement multiplies deltas by elapsed dt so 60Hz phones and 144Hz
//   monitors play at identical speed; cards ride CSS translateY only.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, RotateCcw, Zap, Timer } from '@/components/ui/icons';
import { db } from '@/lib/db';
import { awardCoins } from '@/lib/coins';
import { sfx, haptic, saveBestScore, getBestScore } from './gameShared';

const WORDS = [
  { w: 'Photosynthesis', d: 'Plants making food from light' },
  { w: 'Mitochondria', d: 'Powerhouse of the cell' },
  { w: 'Gravity', d: 'Attraction between two masses' },
  { w: 'Evaporation', d: 'Liquid turning into vapor' },
  { w: 'Noun', d: 'Person, place or thing' },
  { w: 'Verb', d: 'An action word' },
  { w: 'Adjective', d: 'Word describing a noun' },
  { w: 'Atom', d: 'Smallest unit of matter' },
  { w: 'Oxygen', d: 'Gas we breathe to live' },
  { w: 'Ellipse', d: 'A squashed circle shape' },
  { w: 'Velocity', d: 'Speed with a direction' },
  { w: 'Fraction', d: 'Part of a whole number' },
  { w: 'Ecosystem', d: 'Community of living things' },
  { w: 'Democracy', d: 'Rule by the people' },
  { w: 'Longitude', d: 'Distance east or west' },
  { w: 'Latitude', d: 'Distance north or south' },
  { w: 'Enzyme', d: 'Biological reaction catalyst' },
  { w: 'Photon', d: 'A particle of light' },
  { w: 'Isotope', d: 'Same element, different mass' },
  { w: 'Algorithm', d: 'Step-by-step problem solver' },
  { w: 'Metaphor', d: 'Comparison without like/as' },
  { w: 'Simile', d: 'Comparison using like/as' },
  { w: 'Voltage', d: 'Electric potential difference' },
  { w: 'Plateau', d: 'Raised flat stretch of land' },
  { w: 'Fossil', d: 'Preserved remains of life' },
  { w: 'Renaissance', d: 'Rebirth of art and learning' },
  { w: 'Hypothesis', d: 'Testable scientific prediction' },
  { w: 'Perimeter', d: 'Distance around a shape' },
  { w: 'Area', d: 'Space inside a shape' },
  { w: 'Volume', d: 'Space a solid occupies' },
  { w: 'Molecule', d: 'Two or more bonded atoms' },
  { w: 'Energy', d: 'Ability to do work' },
  { w: 'Friction', d: 'Force that resists motion' },
  { w: 'Magnet', d: 'Attracts iron objects' },
  { w: 'Vibration', d: 'Rapid back-and-forth motion' },
  { w: 'Circuit', d: 'Closed path for electricity' },
  { w: 'Predator', d: 'Animal that hunts others' },
  { w: 'Habitat', d: 'Natural home of a species' },
  { w: 'Larva', d: 'Young insect stage' },
  { w: 'Pollen', d: 'Powder that fertilizes plants' },
  { w: 'Germinate', d: 'When a seed starts growing' },
  { w: 'Adverb', d: 'Word describing a verb' },
  { w: 'Pronoun', d: 'Replaces a noun' },
  { w: 'Synonym', d: 'Word with similar meaning' },
  { w: 'Antonym', d: 'Word with opposite meaning' },
  { w: 'Plagiarism', d: 'Stealing someone’s work' },
  { w: 'Biography', d: 'Story of a real life' },
  { w: 'Fiction', d: 'Imaginative made-up story' },
  { w: 'Equator', d: 'Line circling Earth’s middle' },
  { w: 'Volcano', d: 'Mountain that erupts lava' },
  { w: 'Glacier', d: 'Slow-moving river of ice' },
  { w: 'Delta', d: 'Where river meets the sea' },
  { w: 'Monsoon', d: 'Seasonal heavy wind & rain' },
  { w: 'Avalanche', d: 'Rushing slide of snow' },
];

const LANES = 4;
const START_LIVES = 3;
const MATCH_MS = 90000; // whole duel lasts 90 seconds — hurry!
const BASE_SPEED = 90; // px/s — scaled by dt, identical on every display
const SPEED_PER_ROUND = 10;
const MAX_SPEED = 175;
const CARD_CLEARANCE = 112; // bottom offset where a card "lands"

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRound(round) {
  const pool = shuffle(WORDS).slice(0, 4);
  const defs = shuffle(pool.map((p) => p.d));
  return {
    word: pool[0].w,
    defs,
    correctLane: defs.indexOf(pool[0].d),
    speed: Math.min(BASE_SPEED + round * SPEED_PER_ROUND, MAX_SPEED),
  };
}
/* ═══════════════════ Component ═══════════════════ */

export default function DefinitionDuel() {
  const laneEls = useRef([]);
  const areaRef = useRef(null);
  const roundRef = useRef(null);
  const lanesRT = useRef([]); // per-lane runtime { y, speed, done }
  const phaseRef = useRef('idle');
  const livesRef = useRef(START_LIVES);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const roundNoRef = useRef(0);
  const rafRef = useRef(0);
  const timeoutRef = useRef(null);
  const awardedRef = useRef(false);

  const [roundNo, setRoundNo] = useState(0);
  const [rdata, setRdata] = useState(() => buildRound(0));
  const [phase, setPhase] = useState('idle'); // idle | falling | reveal | over
  const [lives, setLives] = useState(START_LIVES);
  const [score, setScore] = useState(0);
  const [fx, setFx] = useState({ picked: null, res: null, correct: null });
  const [coins, setCoins] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MATCH_MS);
  const timeRef = useRef(MATCH_MS);
  const best = getBestScore('definition-duel');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => db.auth.me() });
  const queryClient = useQueryClient();

  const paintLanes = useCallback(() => {
    lanesRT.current.forEach((L, i) => {
      const el = laneEls.current[i];
      if (!el) return;
      el.style.opacity = L.done ? '0.3' : '1';
      el.style.transform = `translateY(${L.y}px)`;
    });
  }, []);

  const finish = useCallback(() => {
    if (phaseRef.current === 'over') return; // idempotent (time-up vs lives)
    clearTimeout(timeoutRef.current); // cancel any pending round transition
    phaseRef.current = 'over';
    setPhase('over');
    const sc = scoreRef.current;
    const earned = Math.min(50, sc);
    setCoins(earned);
    saveBestScore('definition-duel', sc);
    if (sc > 0) sfx.win();
    else sfx.lose();
    if (earned > 0 && !awardedRef.current) {
      awardedRef.current = true;
      awardCoins(db, user, 'gamecoin', earned)
        .then(() => queryClient.invalidateQueries({ queryKey: ['currentUser'] }))
        .catch(() => {});
    }
  }, [user, queryClient]);

  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);

  const nextRound = useCallback(() => {
    roundNoRef.current += 1;
    const R = buildRound(roundNoRef.current);
    roundRef.current = R;
    lanesRT.current = Array.from({ length: LANES }, () => ({
      y: -110, // all four cards launch at exactly the same moment
      speed: R.speed,
      done: false,
    }));
    setRdata(R);
    setRoundNo(roundNoRef.current);
    setFx({ picked: null, res: null, correct: null });
    paintLanes();
    phaseRef.current = 'falling';
    setPhase('falling');
  }, [paintLanes]);

  /** Resolve a pick. `picked` = lane index, or -1 when the answer landed. */
  const resolve = useCallback(
    (picked) => {
      if (phaseRef.current !== 'falling') return;
      phaseRef.current = 'reveal';
      setPhase('reveal');
      const R = roundRef.current;
      const isGood = picked === R.correctLane;
      let nextLives = livesRef.current;
      if (isGood) {
        streakRef.current += 1;
        scoreRef.current += 10;
        setScore(scoreRef.current);
        sfx.correct();
        haptic(20);
      } else {
        streakRef.current = 0;
        nextLives -= 1;
        livesRef.current = nextLives;
        setLives(Math.max(0, nextLives));
        sfx.wrong();
        haptic(60);
      }
      setFx({
        picked: picked === -1 ? R.correctLane : picked,
        res: isGood ? 'good' : picked === -1 ? 'miss' : 'bad',
        correct: R.correctLane,
      });
      timeoutRef.current = setTimeout(() => {
        if (phaseRef.current !== 'reveal') return; // match already ended (time-up)
        if (nextLives <= 0) finishRef.current();
        else nextRound();
      }, 1050);
    },
    [nextRound]
  );

  const resolveRef = useRef(resolve);
  useEffect(() => {
    resolveRef.current = resolve;
  }, [resolve]);

  const start = useCallback(() => {
    clearTimeout(timeoutRef.current);
    cancelAnimationFrame(rafRef.current);
    roundNoRef.current = 0;
    livesRef.current = START_LIVES;
    scoreRef.current = 0;
    streakRef.current = 0;
    awardedRef.current = false;
    setLives(START_LIVES);
    setScore(0);
    setCoins(0);
    timeRef.current = MATCH_MS;
    setTimeLeft(MATCH_MS);
    setFx({ picked: null, res: null, correct: null });
    const R = buildRound(0);
    roundRef.current = R;
    setRdata(R);
    setRoundNo(0);
    lanesRT.current = Array.from({ length: LANES }, () => ({
      y: -110,
      speed: R.speed,
      done: false,
    }));
    paintLanes();
    phaseRef.current = 'falling';
    setPhase('falling');
  }, [paintLanes]);

  useEffect(() => {
    start();
    return () => {
      clearTimeout(timeoutRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [start]);

  // Global 90-second match clock — the whole duel is a race against it
  useEffect(() => {
    if (phase === 'over') return undefined;
    const iv = setInterval(() => {
      if (document.hidden) return;
      timeRef.current -= 100;
      if (timeRef.current <= 0) {
        timeRef.current = 0;
        setTimeLeft(0);
        finishRef.current();
      } else {
        setTimeLeft(timeRef.current);
      }
    }, 100);
    return () => clearInterval(iv);
  }, [phase]);

  // Frame-rate independent fall loop — deltas scaled by elapsed time
  useEffect(() => {
    if (phase !== 'falling') return undefined;
    let last = performance.now();
    const limit = (areaRef.current ? areaRef.current.clientHeight : 380) - CARD_CLEARANCE;
    const step = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      lanesRT.current.forEach((L, i) => {
        if (L.done) return;
        L.y += L.speed * dt;
        if (L.y >= limit) {
          L.y = limit;
          L.done = true;
          if (i === roundRef.current.correctLane) resolveRef.current(-1);
          else {
            const el = laneEls.current[i];
            if (el) el.style.opacity = '0.25';
          }
        }
      });
      paintLanes();
      if (phaseRef.current === 'falling') rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, roundNo, paintLanes]);

  // PC keyboard shortcuts 1–4 → lanes
  const pick = useCallback((i) => resolveRef.current(i), []);
  useEffect(() => {
    const h = (e) => {
      if (e.key >= '1' && e.key <= '4') pick(Number(e.key) - 1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [pick]);
  const cardCls = (i) => {
    const base = 'rounded-md border px-1 py-2.5 text-center text-[11px] leading-snug font-medium shadow-md';
    if (fx.res === 'good' && i === fx.picked) return `${base} border-emerald-400 bg-emerald-500 text-white`;
    if ((fx.res === 'bad' || fx.res === 'miss') && i === fx.picked) return `${base} border-rose-400 bg-rose-500 text-white`;
    if (fx.res && i === fx.correct) return `${base} border-amber-400 bg-card text-amber-200`;
    return `${base} bg-card border-border text-foreground`;
  };

  return (
    <div className="w-full max-w-xl mx-auto select-none">
      {/* HUD */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <Heart key={i} className={`w-4 h-4 ${i < lives ? 'text-rose-500' : 'text-muted-foreground/30'}`} />
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
          <Zap className="w-4 h-4 text-cyan-400" /> {score}
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 text-sm font-bold ${timeLeft <= 15000 ? 'text-rose-400' : 'text-muted-foreground'}`}>
            <Timer className="w-4 h-4" /> {Math.ceil(timeLeft / 1000)}s
          </div>
          <div className="text-[11px] text-muted-foreground">Round {roundNo + 1}</div>
        </div>
      </div>

      {/* Match clock bar */}
      <div className="h-1 rounded-full bg-secondary overflow-hidden mb-3 max-w-md mx-auto">
        <div
          className={`h-full rounded-full transition-all duration-150 ${timeLeft <= 15000 ? 'bg-rose-500' : 'bg-cyan-400'}`}
          style={{ width: `${Math.max(0, (timeLeft / MATCH_MS) * 100)}%` }}
        />
      </div>

      {/* Target word */}
      <div className="text-center mb-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Catch the definition of</p>
        <motion.h2 key={rdata.word} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-2xl sm:text-3xl font-black tracking-wide text-cyan-300">
          {rdata.word}
        </motion.h2>
      </div>

      {/* Falling lanes */}
      <div ref={areaRef} className="relative h-[min(54vh,420px)] min-h-[300px] flex gap-1.5 sm:gap-2 rounded-xl border border-border/50 bg-card/30 overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="relative flex-1">
            {/* Full-width tap zone (+15px slack handled by lane padding) */}
            <button type="button" aria-label={`Lane ${i + 1}`} onClick={() => pick(i)} disabled={phase !== 'falling'} className="absolute inset-0 z-10 w-full disabled:cursor-default" />
            <span className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-rose-500/25 to-transparent pointer-events-none" />
            {/* Falling card — plain wrapper gets JS translateY, motion layer handles shake */}
            <div ref={(el) => { laneEls.current[i] = el; }} className="absolute top-0 inset-x-1 will-change-transform">
              <motion.div animate={fx.res === 'bad' && fx.picked === i ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }} transition={{ duration: 0.35 }} className={cardCls(i)}>
                {rdata.defs[i]}
              </motion.div>
            </div>
            {/* Keyboard hint (pointer devices only) */}
            <span className="hidden [@media(hover:hover)]:flex items-center justify-center absolute bottom-1.5 inset-x-0 pointer-events-none">
              <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-background/80 border border-border text-muted-foreground">{i + 1}</kbd>
            </span>
          </div>
        ))}

        {/* Game over */}
        {phase === 'over' && (
          <div className="absolute inset-0 z-20 bg-background/90 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center p-6">
              <h2 className="text-2xl font-black mb-1">DUEL OVER</h2>
              <p className="text-sm text-muted-foreground mb-1">
                Score <span className="font-bold text-foreground">{score}</span>
              </p>
              {best > 0 && <p className="text-[11px] text-muted-foreground mb-2">Best: {best}</p>}
              {coins > 0 && <p className="text-amber-300 font-semibold mb-4">+{coins} GameCoin 🪙</p>}
              {coins === 0 && <div className="mb-4" />}
              <Button onClick={start} size="lg" className="bg-accent text-accent-foreground">
                <RotateCcw className="w-4 h-4 mr-2" /> Rematch
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground text-center">
        Keys 1–4 on desktop · tap the lane on mobile · beat the 90s clock — wrong picks & landed answers cost lives
      </p>
    </div>
  );
}
