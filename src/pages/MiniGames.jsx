import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Gamepad2, Play, Trophy, ExternalLink, Sparkles, Flame, Loader2 } from '@/components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { Button } from '@/components/ui/button';
import CoinWallet from '@/components/ui/CoinWallet';
import { GAME_REGISTRY } from '@/lib/gameRegistry';
import { getBestScore, getTowerStreak } from '@/components/minigames/gameShared';
import { db } from '@/lib/db';

export default function MiniGames() {
  const queryClient = useQueryClient();
  const lastHiddenAt = useRef(0);

  /** Launch a game into its own dedicated fullscreen arcade tab.
   *  Deliberately WITHOUT 'noopener': keeping the opener link lets the
   *  arcade tab close itself back into this one (exit button), and lets
   *  this hub catch visibilitychange to play its refresh animation.
   *  If popups are blocked (win === null) → open in THIS tab instead. */
  const launch = useCallback((game) => {
    const win = window.open(`/play/${game.id}`, '_blank');
    if (!win) window.location.assign(`/play/${game.id}`);
  }, []);

  // ── Live best scores & Logic-Tower streak ──────────────────────────
  // Games run in their own tabs, so the hub learns about new high
  // scores through `storage` events and re-syncs coins/streak whenever
  // you come back to this tab.
  const readScores = useCallback(
    () => Object.fromEntries(GAME_REGISTRY.map((g) => [g.id, getBestScore(g.id)])),
    []
  );
  const [scores, setScores] = useState(readScores);
  const [streak, setStreak] = useState(getTowerStreak);
  const [refreshing, setRefreshing] = useState(false);

  /** Pull the latest balance another tab persisted into shared
   *  localStorage into this tab's live DB, then refetch the wallet. */
  const syncUserFromSharedStorage = useCallback(() => {
    try {
      db.refreshCurrentUserFromStorage();
    } catch {
      /* db not initialised yet */
    }
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
  }, [queryClient]);

  useEffect(() => {
    const refreshLocal = () => {
      setScores(readScores());
      setStreak(getTowerStreak());
    };
    const onVisibility = () => {
      if (document.hidden) {
        lastHiddenAt.current = Date.now();
        return;
      }
      refreshLocal();
      // Returning from a game tab → pull its persisted balance & refetch
      syncUserFromSharedStorage();
      if (lastHiddenAt.current && Date.now() - lastHiddenAt.current > 1500) {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 700);
      }
      lastHiddenAt.current = 0;
    };
    // Another tab wrote to the shared DB (coins/xp awarded mid-game) —
    // silently adopt it so balances are always current.
    const onDbStorage = () => {
      refreshLocal();
      syncUserFromSharedStorage();
    };
    window.addEventListener('storage', onDbStorage);
    window.addEventListener('focus', refreshLocal);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('storage', onDbStorage);
      window.removeEventListener('focus', refreshLocal);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [readScores, queryClient, syncUserFromSharedStorage]);

  // ── Arrival sync sweep ────────────────────────────────────────────
  // Whenever the hub mounts (including the same-tab fallback path when
  // a popup was blocked), play the refresh animation and re-sync coins
  // & best scores so returning from a game always feels alive.
  useEffect(() => {
    syncUserFromSharedStorage();
    setScores(readScores());
    setStreak(getTowerStreak());
    setRefreshing(true);
    const t = setTimeout(() => setRefreshing(false), 700);
    return () => clearTimeout(t);
  }, [syncUserFromSharedStorage, readScores]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatedBackground colors={['emerald']} orbs={2} grid={true} />
      {/* Games section shows GameCoin */}
      <CoinWallet types={['gamecoin']} />

      {/* Return-from-arcade refresh overlay */}
      <AnimatePresence>
        {refreshing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, -14, 12, -8, 8, 0], scale: [1, 1.08, 1] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center"
              >
                <Gamepad2 className="w-7 h-7 text-accent" />
              </motion.div>
              <p className="text-sm font-semibold text-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-accent" /> Refreshing your loot…
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Syncing coins &amp; best scores</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 p-5 md:p-8 max-w-5xl mx-auto">
        {/* Header + Logic-Tower streak reminder */}
        <div className="mb-6 flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Gamepad2 className="w-5 h-5 text-accent" />
              <h1 className="text-lg font-semibold text-foreground">Mini Games</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
              Five bite-sized brain trainers. Each launches into its own fullscreen arcade tab — zero distractions,
              desktop &amp; mobile tuned.
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 text-xs bg-orange-500/10 border border-orange-500/25 text-orange-300 px-2.5 py-1.5 rounded-lg shrink-0"
            title="Play The Logic Tower every day to grow this streak"
          >
            <Flame className="w-4 h-4" />
            <span className="font-bold">{streak.cur}</span>
            <span className="text-muted-foreground">day{streak.cur === 1 ? '' : 's'} Logic streak</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAME_REGISTRY.map((game, i) => {
            const best = scores[game.id] || 0;
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="h-full"
              >
                <GlassCard hover className="flex flex-col h-full" onClick={() => launch(game)}>
                  <div className="p-4 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-11 h-11 rounded-xl ${game.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <game.icon className={`w-6 h-6 ${game.color}`} />
                      </div>
                      <span className="text-[9px] uppercase tracking-wider px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                        {game.tagline}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-foreground">{game.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{game.description}</p>

                    {/* How to play — right on the card */}
                    <ol className="mt-2.5 space-y-1">
                      {game.tips.map((tip, ti) => (
                        <li key={tip} className="flex gap-1.5 text-[10px] leading-snug text-muted-foreground">
                          <span className="text-accent font-bold shrink-0">{ti + 1}.</span>
                          {tip}
                        </li>
                      ))}
                    </ol>

                    <span className="mt-2 self-start text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">
                      {game.controls}
                    </span>

                    <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground" title="Your best on this device — updates the moment a game tab saves one">
                        <Trophy className="w-3.5 h-3.5 text-amber-300" />
                        Best <span className="font-semibold text-foreground ml-0.5">{best > 0 ? best : '—'}</span>
                      </div>
                      {/* pointer-events-none: card click owns the launch */}
                      <Button size="sm" tabIndex={-1} className="pointer-events-none bg-accent text-accent-foreground hover:bg-accent/90 h-8 text-xs">
                        <Play className="w-3 h-3 mr-1.5" /> Launch
                        <ExternalLink className="w-3 h-3 ml-1.5 opacity-70" />
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-6 text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1.5 flex-wrap">
          <Sparkles className="w-3 h-3 shrink-0" />
          Games open in a new tab · best scores &amp; coin balance refresh here the moment you come back.
        </p>
      </div>
    </div>
  );
}
