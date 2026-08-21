import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import { gameCoinBalance, acoinBalance } from '@/lib/coins';
import { GameCoinIcon, ACoinIcon } from '@/components/ui/icons';

const META = {
  gamecoin: {
    icon: GameCoinIcon,
    label: 'GameCoin',
    color: 'text-amber-300',
    bg: 'bg-amber-500/10 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  acoin: {
    icon: ACoinIcon,
    label: 'ACoin',
    color: 'text-violet-300',
    bg: 'bg-violet-500/10 border-violet-500/30',
    dot: 'bg-violet-400',
  },
};

/**
 * Floating wallet HUD pinned to the top-center (nudged slightly right).
 * Pass `types` = ['gamecoin'] and/or ['acoin']; they sit side by side so they never overlap.
 */
export default function CoinWallet({ types = ['gamecoin'] }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => db.auth.me(),
  });

  const balance = (type) =>
    type === 'acoin' ? acoinBalance(user) : gameCoinBalance(user);

  return (
    <div className="fixed top-3 left-1/2 translate-x-[calc(-50%_+_24px)] z-30 flex flex-row gap-2">
      <AnimatePresence>
        {types.map((type, i) => {
          const m = META[type];
          if (!m) return null;
          const Icon = m.icon;
          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-full border backdrop-blur-md bg-background/70 shadow-lg ${m.bg}`}
              title={`${m.label} balance`}
            >
              <span className="relative flex-shrink-0">
                <Icon className={`w-4 h-4 ${m.color}`} />
                <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${m.dot}`} />
              </span>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {balance(type)}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
