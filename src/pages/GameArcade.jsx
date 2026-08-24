// ─── Dedicated fullscreen arcade space ─────────────────────────────
// Target of /play/:gameId — launched into its own browser tab from the
// Mini Games hub. Chrome-free, themed per game, fully responsive.

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Gamepad2 } from '@/components/ui/icons';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import CoinWallet from '@/components/ui/CoinWallet';
import { Button } from '@/components/ui/button';
import { getGame } from '@/lib/gameRegistry';
import { getBestScore } from '@/components/minigames/gameShared';
import GameErrorBoundary from '@/components/minigames/GameErrorBoundary';
import { useAuth } from '@/lib/AuthContext';
import { flushSaveUserGameData } from '@/lib/userDataService';

export default function GameArcade() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const game = getGame(gameId);

  useEffect(() => {
    if (game) document.title = `${game.title} • Studified Arcade`;
    return () => {
      document.title = 'Studified';
    };
  }, [game]);

  // Keep the HUD best-score chip live while replaying in this tab
  const [best, setBest] = useState(() => (game ? getBestScore(game.id) : 0));

  useEffect(() => {
    if (!game) return undefined;
    let disposed = false;
    const refreshBest = () => {
      if (!disposed) setBest(getBestScore(game.id));
    };
    const handleVisibilityChange = () => {
      if (!document.hidden) refreshBest();
    };
    window.addEventListener('storage', refreshBest);
    window.addEventListener('focus', refreshBest);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      disposed = true;
      window.removeEventListener('storage', refreshBest);
      window.removeEventListener('focus', refreshBest);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [game]);

  const { firebaseUser } = useAuth();

  /** Return to the hub: flush any pending coin/XP saves to Firestore,
   *  then close the arcade tab when the browser allows it (tabs opened
   *  by the hub keep an opener link, making them closable), dropping
   *  the player onto their ORIGINAL hub tab where the refresh animation
   *  + balance re-sync fire automatically. If closing is blocked, fall
   *  back to routing THIS tab back to the hub. */
  const exit = async () => {
    try {
      if (firebaseUser && globalThis.__B44_DB__) {
        const uid = firebaseUser.uid;
        const store = globalThis.__B44_DB__.getStore();
        const p = store.currentUser || {};
        await flushSaveUserGameData(uid, store, {
          ...p,
          email: p.email || firebaseUser.email || '',
          full_name: p.full_name || 'Student',
          total_xp: p.total_xp ?? 0,
          quests_completed: p.quests_completed ?? 0,
          focus_hours: p.focus_hours ?? 0,
          streak_days: p.streak_days ?? 0,
          grade: p.grade ?? 10,
          gamecoin: p.gamecoin ?? 0,
          acoin: p.acoin ?? 0,
          owned_items: p.owned_items ?? [],
          equipped: p.equipped ?? {},
        });
      }
    } catch {
      /* never block the exit on a save hiccup */
    }
    window.close();
    setTimeout(() => {
      if (!window.closed) navigate('/minigames');
    }, 150);
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center p-6">
        <div className="text-center">
          <Gamepad2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h1 className="text-lg font-semibold text-foreground mb-1">Cabinet not found</h1>
          <p className="text-xs text-muted-foreground mb-4">That game doesn't exist in the arcade.</p>
          <Button onClick={() => navigate('/minigames')} className="bg-accent text-accent-foreground">
            Back to Mini Games
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatedBackground colors={game.bgColors} orbs={2} grid />
      <CoinWallet types={['gamecoin']} />

      {/* Arcade HUD */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-30 border-b border-border/60 bg-background/60 backdrop-blur-md"
      >
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={exit}
            aria-label="Exit game"
            className="w-9 h-9 rounded-lg border border-border bg-card/80 flex items-center justify-center hover:bg-accent/15 hover:border-accent/40 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`w-8 h-8 rounded-lg ${game.bgColor} flex items-center justify-center shrink-0`}>
              <game.icon className={`w-5 h-5 ${game.color}`} />
            </span>
            <div className="min-w-0 text-left">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">{game.title}</p>
              <p className="text-[10px] text-muted-foreground tracking-wide uppercase">{game.tagline} · Studified Arcade</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0" title="Your best on this device">
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span className="font-semibold text-foreground">{best > 0 ? best : '—'}</span>
          </div>
        </div>
      </motion.header>

      {/* Play space */}
      <main className="relative z-10 px-4 pt-6 pb-10">
        <motion.div key={game.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
          <GameErrorBoundary gameTitle={game.title}>
            <game.component />
          </GameErrorBoundary>
        </motion.div>

        <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-1 max-w-xl mx-auto">
          {game.tips.map((t) => (
            <span key={t} className="text-[10px] text-muted-foreground">
              · {t}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
