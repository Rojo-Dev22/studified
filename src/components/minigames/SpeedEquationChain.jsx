// ─── Game 1/5 · Speed-Equation Chain ───────────────────────────────
// Math arcade drag-chaining on a 4×4 checkerboard grid.
// • Unified Pointer Events (pointerdown/move/up) power both desktop
//   click-drag selection and mobile finger swipes.
// • Consecutive same-kind picks are impossible by construction — the
//   checkerboard parity guarantees every orthogonal step alternates
//   number → operator → number.
// • Equations evaluate through a safe shunting-yard parser (<5ms).
// • Valid chains vaporize tiles, gravity-drop survivors, refill the
//   top, and bank +3 seconds on the 45s clock.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Timer, RotateCcw, Zap } from '@/components/ui/icons';
import { db } from '@/lib/db';
import { awardCoins } from '@/lib/coins';
import { sfx, haptic, saveBestScore, getBestScore } from './gameShared';

const SIZE = 4;
const CELLS = SIZE * SIZE;
const START_MS = 90000;
const BONUS_MS = 3000;
const OP_SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };
const PREC = { '+': 1, '-': 1, '*': 2, '/': 2 };

// Weighted pools: smaller numbers & friendlier operators dominate so
// everyday combinations (e.g. 3 + 4 × 2) stay front-and-centre.
const NUM_POOL = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8, 9];
const OP_POOL = ['+', '+', '+', '-', '-', '-', '*', '*', '/'];
const randNum = () => NUM_POOL[Math.floor(Math.random() * NUM_POOL.length)];
const randOp = () => OP_POOL[Math.floor(Math.random() * OP_POOL.length)];
const kindOf = (i) => ((Math.floor(i / SIZE) + (i % SIZE)) % 2 === 0 ? 'num' : 'op');
const rc = (i) => [Math.floor(i / SIZE), i % SIZE];
const adjacent = (a, b) => {
  const [r1, c1] = rc(a);
  const [r2, c2] = rc(b);
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
};

function makeCell(kind, idRef) {
  return { id: ++idRef.current, kind, v: kind === 'num' ? randNum() : randOp() };
}

function makeGrid(idRef) {
  return Array.from({ length: CELLS }, (_, i) => makeCell(kindOf(i), idRef));
}

/** Safe shunting-yard evaluation of an alternating num/op chain. */
function evalChain(chain) {
  const out = [];
  const ops = [];
  for (const c of chain) {
    if (c.kind === 'num') {
      out.push(c.v);
    } else {
      while (ops.length && PREC[ops[ops.length - 1]] >= PREC[c.v]) out.push(ops.pop());
      ops.push(c.v);
    }
  }
  while (ops.length) out.push(ops.pop());
  const st = [];
  for (const t of out) {
    if (typeof t === 'number') {
      st.push(t);
      continue;
    }
    const b = st.pop();
    const a = st.pop();
    if (a === undefined || b === undefined) return NaN;
    if (t === '/' && b === 0) return NaN; // division-by-zero guard
    st.push(t === '+' ? a + b : t === '-' ? a - b : t === '*' ? a * b : a / b);
  }
  return st.pop();
}

/**
 * Enumerate EVERY alternating num/op simple path (3–7 tiles) on the grid
 * and collect each reachable integer result in [2..99]. The daily target
 * is then chosen from this set, guaranteeing at least one real solution
 * exists every single round — even right after a refill.
 */
function collectTargets(cells) {
  const values = new Set();
  const chain = [];
  const used = new Set();
  const posStack = [];

  const visit = () => {
    if (chain.length >= 3 && chain.length % 2 === 1) {
      const v = evalChain(chain);
      if (Number.isInteger(v) && v >= 2 && v <= 99) values.add(v);
    }
    if (chain.length >= 7) return;
    const pos = posStack[posStack.length - 1];
    for (let n = 0; n < CELLS; n++) {
      if (used.has(n) || !adjacent(pos, n)) continue;
      used.add(n);
      posStack.push(n);
      chain.push(cells[n]);
      visit();
      chain.pop();
      posStack.pop();
      used.delete(n);
    }
  };

  for (let i = 0; i < CELLS; i++) {
    if (kindOf(i) !== 'num') continue;
    used.add(i);
    posStack.push(i);
    chain.push(cells[i]);
    visit();
    chain.pop();
    posStack.pop();
    used.delete(i);
  }
  return [...values];
}

/** Pick a guaranteed-reachable target (integer 2..99), or null if none. */
function pickTarget(cells, exclude) {
  const all = collectTargets(cells);
  const pool = all.filter((v) => v !== exclude);
  const list = pool.length ? pool : all;
  return list.length ? list[Math.floor(Math.random() * list.length)] : null;
}

/** Vaporize cleared ids, drop survivors down each column, refill tops. */
function refill(prev, clearedSet, idRef) {
  const next = new Array(CELLS);
  for (let c = 0; c < SIZE; c++) {
    const survivors = [];
    for (let r = SIZE - 1; r >= 0; r--) {
      const idx = r * SIZE + c;
      if (!clearedSet.has(prev[idx].id)) survivors.push(prev[idx]);
    }
    for (let r = SIZE - 1; r >= 0; r--) {
      const idx = r * SIZE + c;
      next[idx] = survivors.length ? survivors.shift() : makeCell(kindOf(idx), idRef);
    }
  }
  return next;
}
/* ═══════════════════ Component ═══════════════════ */

export default function SpeedEquationChain() {
  const idRef = useRef(0);
  const gridRef = useRef(null);
  const dragging = useRef(false);
  const lockRef = useRef(false);
  const selRef = useRef([]);
  const cellsRef = useRef(null);
  const targetRef = useRef(0);
  const timeRef = useRef(START_MS);
  const scoreRef = useRef(0);
  const awardedRef = useRef(false);

  const [cells, setCells] = useState(() => {
    const g = makeGrid(idRef);
    return g;
  });
  const [sel, setSel] = useState([]);
  const [target, setTarget] = useState(0);
  const [clearing, setClearing] = useState(() => new Set());
  const [timeMs, setTimeMs] = useState(START_MS);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [coins, setCoins] = useState(0);
  const [flash, setFlash] = useState(null); // 'ok' | 'bad' | null
  const best = getBestScore('speed-equation-chain');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => db.auth.me() });
  const queryClient = useQueryClient();

  useEffect(() => {
    cellsRef.current = cells;
  }, [cells]);

  // First-grid + restart bootstrap
  const initGame = useCallback(() => {
    let g = makeGrid(idRef);
    let t = pickTarget(g, -1);
    if (t == null) {
      // Ultra-rare: board has no solvable chain — reshuffle it wholesale
      g = makeGrid(idRef);
      t = pickTarget(g, -1);
    }
    cellsRef.current = g;
    setCells(g);
    selRef.current = [];
    setSel([]);
    lockRef.current = false;
    timeRef.current = START_MS;
    setTimeMs(START_MS);
    scoreRef.current = 0;
    setScore(0);
    awardedRef.current = false;
    setCoins(0);
    setClearing(new Set());
    setFlash(null);
    setOver(false);
    targetRef.current = t != null ? t : 10;
    setTarget(targetRef.current);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const finish = useCallback(() => {
    setOver(true);
    const sc = scoreRef.current;
    const earned = Math.min(60, sc * 4);
    setCoins(earned);
    saveBestScore('speed-equation-chain', sc);
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

  // Master clock — pauses while the tab is hidden
  useEffect(() => {
    if (over) return undefined;
    const iv = setInterval(() => {
      if (document.hidden) return;
      timeRef.current -= 100;
      if (timeRef.current <= 0) {
        timeRef.current = 0;
        setTimeMs(0);
        finishRef.current();
      } else {
        setTimeMs(timeRef.current);
      }
    }, 100);
    return () => clearInterval(iv);
  }, [over]);

  /** Validate & commit the finished drag chain. */
  const commit = useCallback((arr) => {
    if (!arr || arr.length === 0) return;
    if (arr.length < 3) {
      if (arr.length >= 1) sfx.pop();
      selRef.current = [];
      setSel([]);
      return;
    }
    const chain = arr.map((i) => cellsRef.current[i]);
    const value = evalChain(chain);
    if (!Number.isNaN(value) && Math.abs(value - targetRef.current) < 1e-9) {
      sfx.correct();
      haptic(25);
      setFlash('ok');
      scoreRef.current += 1;
      setScore(scoreRef.current);
      timeRef.current += BONUS_MS;
      setTimeMs(timeRef.current);
      const clearedSet = new Set(arr.map((i) => cellsRef.current[i].id));
      setClearing(clearedSet);
      selRef.current = [];
      setSel([]);
      lockRef.current = true;
      setTimeout(() => {
        let board = refill(cellsRef.current, clearedSet, idRef);
        let t = pickTarget(board, targetRef.current);
        if (t == null) {
          // Board dried up — deal a fresh one so play never stalls
          board = makeGrid(idRef);
          t = pickTarget(board, -1);
        }
        cellsRef.current = board;
        setCells(board);
        targetRef.current = t != null ? t : 10;
        setTarget(targetRef.current);
        setClearing(new Set());
        setFlash(null);
        lockRef.current = false;
      }, 260);
    } else {
      sfx.wrong();
      haptic(15);
      setFlash('bad');
      setTimeout(() => {
        setFlash(null);
        selRef.current = [];
        setSel([]);
      }, 340);
    }
  }, []);

  const idxFromPoint = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const cell = el && el.closest ? el.closest('[data-idx]') : null;
    return cell ? Number(cell.getAttribute('data-idx')) : null;
  };

  const onPointerDown = (e) => {
    if (lockRef.current || over) return;
    const idx = idxFromPoint(e.clientX, e.clientY);
    if (idx == null || kindOf(idx) !== 'num') return; // chains start on numbers
    e.preventDefault();
    try {
      gridRef.current?.setPointerCapture?.(e.pointerId);
    } catch {
      /* no-op */
    }
    dragging.current = true;
    selRef.current = [idx];
    setSel([idx]);
    sfx.tap();
  };

  const onPointerMove = (e) => {
    if (!dragging.current || lockRef.current || over) return;
    const idx = idxFromPoint(e.clientX, e.clientY);
    if (idx == null) return;
    const list = selRef.current;
    if (!list.length) {
      if (kindOf(idx) === 'num') {
        selRef.current = [idx];
        setSel([idx]);
        sfx.tap();
      }
      return;
    }
    const last = list[list.length - 1];
    if (idx === last) return;
    // Sliding back onto the previous tile undoes the last step
    if (list.length >= 2 && idx === list[list.length - 2]) {
      list.pop();
      selRef.current = [...list];
      setSel([...list]);
      sfx.tap();
      return;
    }
    if (!list.includes(idx) && adjacent(last, idx)) {
      list.push(idx);
      selRef.current = [...list];
      setSel([...list]);
      haptic(10);
      sfx.select();
    }
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    commit(selRef.current);
  };
  const seconds = Math.ceil(timeMs / 1000);
  const preview = sel.map((i) => {
    const c = cells[i];
    return c ? (c.kind === 'num' ? String(c.v) : OP_SYM[c.v]) : '';
  });
  const liveVal = sel.length >= 3 && sel.length % 2 === 1 ? evalChain(sel.map((i) => cells[i])) : null;

  return (
    <div className="w-full max-w-[480px] mx-auto select-none">
      {/* HUD */}
      <div className="flex items-end justify-between mb-2 px-1">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Target</p>
          <motion.p key={target} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl font-black text-amber-300 leading-none">
            {target}
          </motion.p>
        </div>
        <div className="flex items-center gap-1.5 text-base font-bold text-foreground">
          <Zap className="w-4 h-4 text-amber-400" /> {score}
        </div>
        <div className={`flex items-center gap-1 text-sm font-bold ${seconds <= 10 ? 'text-rose-400' : 'text-muted-foreground'}`}>
          <Timer className="w-4 h-4" /> {seconds}s
        </div>
      </div>

      {/* Time bar */}
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-150 ${seconds <= 10 ? 'bg-rose-500' : 'bg-accent'}`}
          style={{ width: `${Math.min(100, (timeMs / START_MS) * 100)}%` }}
        />
      </div>

      {/* Chain preview with live evaluation */}
      <div
        className={`h-9 mb-2 rounded-lg border flex items-center justify-center gap-1 px-2 text-sm font-mono transition-colors
        ${flash === 'ok' ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
          : flash === 'bad' ? 'border-rose-500/60 bg-rose-500/10 text-rose-300'
          : 'border-border bg-card/40 text-foreground'}`}
      >
        {sel.length === 0 ? (
          <span className="text-xs font-sans text-muted-foreground">Drag a path · start & end on a number</span>
        ) : (
          <>
            <span>{preview.join(' ')}</span>
            {liveVal != null && (
              <span className={flash === 'ok' ? '' : 'text-muted-foreground'}>
                &nbsp;= {Math.round(liveVal * 100) / 100}
              </span>
            )}
          </>
        )}
      </div>

      {/* Grid — unified pointer events for mouse drag & touch swipe */}
      <div
        ref={gridRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragging.current = false;
          selRef.current = [];
          setSel([]);
        }}
        onContextMenu={(e) => e.preventDefault()}
        className="relative grid grid-cols-4 gap-1.5 sm:gap-2 touch-none"
        style={{ touchAction: 'none' }}
      >
        {cells.map((cell, i) => {
          const isSel = sel.includes(i);
          const isClearing = clearing.has(cell.id);
          return (
            <motion.div
              key={cell.id}
              data-idx={i}
              animate={isClearing ? { scale: 0, opacity: 0, rotate: -14 } : { scale: isSel ? 1.05 : 1 }}
              transition={{ duration: 0.22 }}
              className={`aspect-square rounded-xl border flex items-center justify-center font-bold cursor-pointer transition-colors
                ${cell.kind === 'num'
                  ? 'bg-card border-border text-lg sm:text-xl [@media(hover:hover)]:hover:border-accent/50 [@media(hover:hover)]:hover:ring-2 [@media(hover:hover)]:hover:ring-accent/25'
                  : 'bg-secondary/70 border-border/60 text-base sm:text-lg text-muted-foreground'}
                ${isSel ? '!bg-accent/20 !border-accent ring-2 ring-accent' : ''}`}
            >
              {cell.kind === 'num' ? cell.v : OP_SYM[cell.v]}
            </motion.div>
          );
        })}

        {/* Game over overlay */}
        <AnimatePresence>
          {over && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute -inset-1 z-20 rounded-2xl bg-background/85 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center p-6">
                <h2 className="text-2xl font-black mb-1">TIME'S UP</h2>
                <p className="text-sm text-muted-foreground mb-1">
                  You chained <span className="font-bold text-foreground">{score}</span> equations
                </p>
                {best > 0 && <p className="text-[11px] text-muted-foreground mb-2">Best: {best}</p>}
                {coins > 0 && <p className="text-amber-300 font-semibold mb-4">+{coins} GameCoin 🪙</p>}
                <Button onClick={initGame} size="lg" className="bg-accent text-accent-foreground">
                  <RotateCcw className="w-4 h-4 mr-2" /> Play Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground text-center">
        Every solve vaporizes tiles, drops the stack & banks +3 seconds
      </p>
    </div>
  );
}
