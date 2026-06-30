import React from 'react';
import { motion } from 'framer-motion';

export default function XPBar({ current, max, level, showLabel = true }) {
  const percentage = Math.min((current / max) * 100, 100);

  const stripeStyle = {
    backgroundImage: 'linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent)',
    backgroundSize: '1rem 1rem',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-end mb-1.5">
          <span className="text-xs font-semibold text-foreground/90 tracking-wide uppercase">Level {level}</span>
          <span className="text-[11px] text-muted-foreground font-mono font-medium tabular-nums">{current} / {max} XP</span>
        </div>
      )}
      <div className="h-2.5 bg-secondary border border-border/60 rounded-full overflow-visible relative p-[1px]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="relative h-full rounded-full bg-accent flex justify-end items-center"
        >
          {/* Animated stripes overlay */}
          <div 
            className="absolute inset-0 rounded-full animate-progress-stripes opacity-40 mix-blend-overlay" 
            style={stripeStyle} 
          />
          
          {/* Edge glowing flare */}
          {percentage > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="absolute -right-[3px] w-3 h-3 bg-white rounded-full blur-[1px] shadow-[0_0_8px_rgba(16,185,129,1),0_0_15px_rgba(16,185,129,0.8)] z-10 flex-shrink-0"
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}