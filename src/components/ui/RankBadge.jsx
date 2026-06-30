import React from 'react';
import { motion } from 'framer-motion';

const rankStyles = {
  E: 'text-muted-foreground bg-secondary border-transparent',
  D: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]',
  C: 'text-blue-400 bg-blue-500/5 border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.05)]',
  B: 'text-violet-400 bg-violet-500/5 border-violet-500/20 shadow-[0_0_8px_rgba(139,92,246,0.05)]',
  A: 'text-orange-400 bg-orange-500/10 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.1)]',
  S: 'text-red-400 bg-red-500/10 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.15)] font-bold',
};

const rankLabels = { E: 'Beginner', D: 'Easy', C: 'Medium', B: 'Hard', A: 'Expert', S: 'Master' };

export default function RankBadge({ rank, size = 'md', showLabel = false }) {
  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  const isHighTier = rank === 'S' || rank === 'A';

  const badgeContent = (
    <span 
      className={`inline-flex items-center font-semibold rounded-md border tracking-wider uppercase ${sizeClass} ${rankStyles[rank] || rankStyles.E}`}
    >
      {showLabel ? rankLabels[rank] : rank}
    </span>
  );

  if (isHighTier) {
    return (
      <motion.div
        className="inline-block"
        animate={rank === 'S' ? {
          scale: [1, 1.03, 1],
          boxShadow: [
            '0 0 4px rgba(239,68,68,0.1)',
            '0 0 10px rgba(239,68,68,0.25)',
            '0 0 4px rgba(239,68,68,0.1)'
          ]
        } : {
          scale: [1, 1.01, 1],
          boxShadow: [
            '0 0 4px rgba(249,115,22,0.05)',
            '0 0 8px rgba(249,115,22,0.15)',
            '0 0 4px rgba(249,115,22,0.05)'
          ]
        }}
        transition={{
          repeat: Infinity,
          duration: rank === 'S' ? 3 : 4,
          ease: 'easeInOut'
        }}
      >
        {badgeContent}
      </motion.div>
    );
  }

  return badgeContent;
}