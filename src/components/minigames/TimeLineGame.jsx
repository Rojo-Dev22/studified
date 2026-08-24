// ─── Game 5/5 · Time-Line ──────────────────────────────────────────
// Chronological ordering: five scrambled milestones must be arranged
// oldest → newest on a vertical timeline.
// • PC: HTML5 drag-and-drop sorting plus up/down buttons + keyboard.
// • Mobile: prominent Move Up / Move Down touch buttons are primary;
//   drag handles stay desktop-only because native HTML5 dnd fights
//   mobile scroll gestures. Dragging sets touch-action to none so the
//   page never background-scrolls mid-drag.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, GripVertical, RotateCcw, Trophy, History, Lightbulb } from '@/components/ui/icons';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { awardCoins } from '@/lib/coins';
import { sfx, haptic, saveBestScore, getBestScore, isMobileTouch, spendForHint } from './gameShared';
import HintConfirmDialog from './HintConfirmDialog';

const EVENT_COUNT = 5;
const COIN_LADDER = [5, 8, 12, 18, 22, 30]; // index = exact positions hit
const HINT_COST = 10; // GameCoin per hint

const EVENTS = [
  { label: 'Printing press invented', year: 1440 },
  { label: 'Columbus reaches the Americas', year: 1492 },
  { label: 'Telescope patented', year: 1608 },
  { label: 'Newton publishes Principia', year: 1687 },
  { label: "Watt improves the steam engine", year: 1769 },
  { label: 'French Revolution begins', year: 1789 },
  { label: 'First photograph taken', year: 1826 },
  { label: 'First algorithm published (Lovelace)', year: 1843 },
  { label: 'Darwin publishes On the Origin of Species', year: 1859 },
  { label: 'Telephone invented', year: 1876 },
  { label: 'Light bulb patented', year: 1879 },
  { label: 'X-rays discovered', year: 1895 },
  { label: 'Periodic table created', year: 1869 },
  { label: 'First transatlantic radio signal', year: 1901 },
  { label: 'First powered flight', year: 1903 },
  { label: "Einstein's special relativity", year: 1905 },
  { label: 'Panama Canal opens', year: 1914 },
  { label: 'Television demonstrated', year: 1925 },
  { label: 'Penicillin discovered', year: 1928 },
  { label: 'DNA double helix discovered', year: 1953 },
  { label: 'First human in space', year: 1961 },
  { label: 'First heart transplant', year: 1967 },
  { label: 'Moon landing', year: 1969 },
  { label: 'World Wide Web proposed', year: 1989 },
  { label: 'Berlin Wall falls', year: 1988 },
  { label: 'Hubble Space Telescope launched', year: 1990 },
  { label: 'Human genome sequenced', year: 2003 },
  { label: 'First iPhone released', year: 2007 },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawEvents() {
  let picked = shuffle(EVENTS).slice(0, EVENT_COUNT);
  // Never start pre-solved — reshuffle until scrambled
  while ([...picked].sort((a, b) => a.year - b.year).every((e, i) => e === picked[i])) {
    picked = shuffle(EVENTS).slice(0, EVENT_COUNT);
  }
  return picked;
}
/* ═══════════════════ Component ═══════════════════ */

export default function TimeLineGame() {
  const dragIdx = useRef(null);
  const awardedRef = useRef(false);
  const touch = useRef(isMobileTouch());

  const [events, setEvents] = useState(drawEvents);
  const [dragging, setDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null); // { correct, matches }
  const [coins, setCoins] = useState(0);
  const [pinnedLabels, setPinnedLabels] = useState(() => new Set());
  const [hintOpen, setHintOpen] = useState(false);

  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const isPinned = useCallback((label) => pinnedLabels.has(label), [pinnedLabels]);

  const best = getBestScore('time-line');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => db.auth.me() });
  const queryClient = useQueryClient();

  /**
   * Step-wise move from `from` toward `to`. Pinned (hinted) cards act as
   * walls — movement stops when it would cross one.
   */
  const reorder = useCallback(
    (from, to) => {
      setEvents((prev) => {
        if (to < 0 || to >= prev.length || from === to) return prev;
        const step = from < to ? 1 : -1;
        const a = [...prev];
        let cur = from;
        while (cur !== to) {
          const nxt = cur + step;
          if (nxt < 0 || nxt >= a.length) break;
          if (pinnedLabels.has(a[nxt].label)) break; // locked card wall
          [a[cur], a[nxt]] = [a[nxt], a[cur]];
          cur = nxt;
        }
        if (cur === from) return prev;
        sfx.tap();
        haptic(8);
        return a;
      });
    },
    [pinnedLabels]
  );

  const move = useCallback((i, dir) => reorder(i, i + dir), [reorder]);

  const onDragStart = (e, i) => {
    if (submitted || isPinned(eventsRef.current[i].label)) {
      e.preventDefault();
      return;
    }
    dragIdx.current = i;
    setDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(i));
    } catch {
      /* older browsers */
    }
  };

  const onDragOver = (e, i) => {
    if (submitted || dragIdx.current == null) return;
    e.preventDefault(); // required to allow dropping
    const arr = eventsRef.current;
    if (isPinned(arr[i].label)) return; // can't drop onto a locked row
    let cur = dragIdx.current;
    if (cur === i) return;
    const step = cur < i ? 1 : -1;
    let dest = cur;
    while (dest !== i) {
      const nxt = dest + step;
      if (nxt < 0 || nxt >= arr.length || isPinned(arr[nxt].label)) break;
      dest = nxt;
    }
    if (dest !== cur) {
      reorder(cur, dest);
      dragIdx.current = dest;
    }
  };

  const onDragEnd = () => {
    dragIdx.current = null;
    setDragging(false);
  };

  const submit = useCallback(() => {
    if (submitted) return;
    const correct = [...events].sort((a, b) => a.year - b.year);
    const matches = events.filter((e, i) => e === correct[i]).length;
    setResult({ correct, matches });
    setSubmitted(true);
    const earned = COIN_LADDER[matches];
    setCoins(earned);
    saveBestScore('time-line', matches * 20);
    if (matches === EVENT_COUNT) {
      confetti({ particleCount: 110, spread: 70, origin: { y: 0.6 } });
      sfx.win();
      haptic(40);
    } else if (matches >= 3) sfx.correct();
    else sfx.lose();
    if (earned > 0 && !awardedRef.current) {
      awardedRef.current = true;
      awardCoins(db, user, 'gamecoin', earned)
        .then(() => queryClient.invalidateQueries({ queryKey: ['currentUser'] }))
        .catch(() => {});
    }
  }, [events, submitted, user, queryClient]);

  const playAgain = useCallback(() => {
    awardedRef.current = false;
    setEvents(drawEvents());
    setSubmitted(false);
    setResult(null);
    setCoins(0);
    setDragging(false);
    setPinnedLabels(new Set());
    setHintOpen(false);
    dragIdx.current = null;
    sfx.pop();
  }, []);

  /* ── Paid hint: pin the oldest remaining card into its true slot ── */

  const requestHint = useCallback(() => {
    if (submitted) return;
    const anyUnpinned = eventsRef.current.some((e) => !pinnedLabels.has(e.label));
    if (!anyUnpinned) {
      toast('Every card is already pinned!');
      return;
    }
    setHintOpen(true); // double-check with the player first
  }, [pinnedLabels, submitted]);

  const confirmHint = useCallback(async () => {
    setHintOpen(false);
    const ok = await spendForHint(db, user, HINT_COST);
    if (!ok) {
      toast.error('Not enough GameCoin for a hint');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    haptic(20);
    const arr = eventsRef.current;
    const unpinned = arr.filter((e) => !pinnedLabels.has(e.label));
    const oldest = [...unpinned].sort((a, b) => a.year - b.year)[0];
    const correctOrder = [...arr].sort((a, b) => a.year - b.year);
    const targetIdx = correctOrder.indexOf(oldest);
    const from = arr.indexOf(oldest);
    reorder(from, targetIdx); // respects other pinned walls
    dragIdx.current = null;
    setPinnedLabels((prev) => new Set([...prev, oldest.label]));
    sfx.correct();
  }, [pinnedLabels, queryClient, reorder, user]);
  return (
    <div className="w-full max-w-lg mx-auto select-none">
      {/* HUD */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 text-sm font-bold text-blue-300">
          <History className="w-4 h-4" /> Order the timeline
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Trophy className="w-3.5 h-3.5 text-amber-300" /> Best {best}
        </div>
      </div>

      {/* Timeline list — scroll locked while a drag is active */}
      <div className="relative" style={{ touchAction: dragging ? 'none' : 'auto' }}>
        <span className="absolute left-[15px] top-3 bottom-3 w-px bg-border pointer-events-none" />
        {events.map((e, i) => {
          const isCorrect = submitted && result && e === result.correct[i];
          const isDragged = dragging && dragIdx.current === i;
          const isPin = isPinned(e.label);
          return (
            <motion.div
              key={e.label}
              layout
              transition={{ layout: { type: 'spring', damping: 30, stiffness: 400 } }}
              draggable={!submitted && !touch.current && !isPin}
              onDragStart={(ev) => onDragStart(ev, i)}
              onDragOver={(ev) => onDragOver(ev, i)}
              onDragEnd={onDragEnd}
              className={`relative pl-9 mb-2 ${isDragged ? 'opacity-50' : ''}`}
            >
              <span className={`absolute left-[9px] top-1/2 -translate-y-1/2 w-[13px] h-[13px] rounded-full border-2 z-10 bg-background ${isCorrect ? 'border-emerald-500' : 'border-accent/70'}`} />
              <div
                className={`flex items-center gap-2 rounded-xl border p-2.5 sm:p-3 select-none
                  ${isPin ? 'border-amber-500/50 bg-amber-500/5'
                    : submitted
                      ? isCorrect ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-rose-500/60 bg-rose-500/5'
                      : 'border-border bg-card cursor-grab active:cursor-grabbing [@media(hover:hover)]:hover:border-accent/40'}`}
              >
                {isPin ? (
                  <span className="w-4 shrink-0 text-center text-[11px]" title="Pinned by a hint">🔒</span>
                ) : (
                  <GripVertical className={`w-4 h-4 shrink-0 ${touch.current ? 'hidden' : ''} text-muted-foreground/50`} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-foreground leading-snug">{e.label}</p>
                  {submitted && (
                    <p className={`text-[11px] font-bold mt-0.5 ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {e.year}
                      {!isCorrect && result && (
                        <span className="text-muted-foreground font-normal"> — belongs at #{result.correct.indexOf(e) + 1}</span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button type="button" aria-label="Move up" disabled={i === 0 || submitted || isPin} onClick={() => move(i, -1)} className="w-8 h-7 rounded-md border border-border bg-secondary/60 flex items-center justify-center disabled:opacity-30 enabled:hover:bg-accent/20 enabled:active:scale-95 transition-all">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" aria-label="Move down" disabled={i === events.length - 1 || submitted || isPin} onClick={() => move(i, 1)} className="w-8 h-7 rounded-md border border-border bg-secondary/60 flex items-center justify-center disabled:opacity-30 enabled:hover:bg-accent/20 enabled:active:scale-95 transition-all">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Submit / Hint / Result */}
      {!submitted ? (
        <>
          <Button variant="outline" onClick={requestHint} className="w-full mt-2 border-amber-500/40 text-amber-300 hover:bg-amber-500/10">
            <Lightbulb className="w-4 h-4 mr-2" /> Hint: pin the oldest card · {HINT_COST} 🪙
          </Button>
          <Button onClick={submit} size="lg" className="w-full mt-2 bg-accent text-accent-foreground hover:bg-accent/90">
            Lock In Timeline
          </Button>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-xl border border-border bg-card/60 p-4 text-center">
          <p className="text-lg font-black mb-0.5">
            {result.matches}/{EVENT_COUNT} in perfect position
          </p>
          <p className="text-xs text-muted-foreground mb-2">Oldest → newest: {result.correct.map((e) => e.year).join(' → ')}</p>
          {coins > 0 && <p className="text-amber-300 font-semibold mb-3">+{coins} GameCoin 🪙</p>}
          <Button onClick={playAgain} className="bg-accent text-accent-foreground">
            <RotateCcw className="w-4 h-4 mr-2" /> New Round
          </Button>
        </motion.div>
      )}

      <HintConfirmDialog
        open={hintOpen}
        onOpenChange={setHintOpen}
        cost={HINT_COST}
        title="Spend GameCoin on a hint?"
        description="The oldest remaining card will be moved into its correct spot and locked with a 🔒 — other cards can't jump over it."
        onConfirm={confirmHint}
      />

      <p className="mt-3 text-[10px] text-muted-foreground text-center">
        {touch.current ? 'Use the arrow buttons to reorder events' : 'Drag cards or use the arrows · oldest at the top'}
      </p>
    </div>
  );
}
