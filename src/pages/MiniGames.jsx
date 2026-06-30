import React, { useState } from 'react';
import { Gamepad2, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import WordleGame from '@/components/minigames/WordleGame';
import MathSurvivalGame from '@/components/minigames/MathSurvivalGame';

const GAMES = [
  {
    id: 'wordle',
    title: 'Edu-Wordle',
    description: 'Guess the 5-letter educational term in 6 tries. Includes Biology, Physics, and English terms.',
    icon: Gamepad2,
    component: WordleGame,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10'
  },
  {
    id: 'math-survival',
    title: 'Math Survival',
    description: 'Hold off the incoming enemies by solving math and linear equations. Fast-paced action!',
    icon: Gamepad2,
    component: MathSurvivalGame,
    color: 'text-rose-400',
    bgColor: 'bg-rose-400/10'
  }
];

export default function MiniGames() {
  const [selectedGame, setSelectedGame] = useState(null);

  const activeGame = GAMES.find(g => g.id === selectedGame);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatedBackground colors={['emerald']} orbs={2} grid={true} />
      <div className="relative z-10 p-5 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Gamepad2 className="w-5 h-5 text-accent" />
          <h1 className="text-lg font-semibold text-foreground">Mini Games</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Take a break and learn through play! Select a game to launch it in a mini window.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GAMES.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard hover={true} className="flex flex-col h-full">
              <div className="p-4 flex flex-col h-full">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${game.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <game.icon className={`w-5 h-5 ${game.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{game.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{game.description}</p>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 flex justify-end">
                  <Button 
                    size="sm" 
                    className="bg-accent text-accent-foreground hover:bg-accent/90 h-8 text-xs"
                    onClick={() => setSelectedGame(game.id)}
                  >
                    <Play className="w-3 h-3 mr-1.5" /> Play Now
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!selectedGame} onOpenChange={(open) => { if (!open) setSelectedGame(null); }}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden bg-background border-border">
          <DialogHeader className="px-4 py-3 border-b border-border shrink-0">
            <DialogTitle className="text-base flex items-center gap-2">
              {activeGame && <activeGame.icon className="w-4 h-4 text-accent" />}
              {activeGame?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden relative">
            {activeGame && <activeGame.component onClose={() => setSelectedGame(null)} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}
