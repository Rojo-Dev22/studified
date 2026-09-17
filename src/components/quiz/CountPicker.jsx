import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, Zap } from '@/components/ui/icons';
import { COUNT_CHOICES } from '@/lib/quiz/config';

/**
 * Question-count selection. The choices are derived from REAL availability:
 * fixed steps that fit, plus the exact available amount — never a hardcoded
 * count, and never more than actually usable.
 */
export default function CountPicker(/** @type {any} */ { available, selected, onSelect, onStart, isStarting = false }) {
  const choices = [...COUNT_CHOICES.filter((n) => n < available), available];
  const maxXP = (selected || 0) * 20; // upper bound (hard = 20 XP)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-foreground">How many questions?</h2>
        <span className="text-[10px] text-muted-foreground">{available} available</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {choices.map((n) => {
          const active = selected === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onSelect(n)}
              className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
                active
                  ? 'border-accent/50 bg-accent/10 text-accent'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <Button
        size="sm"
        onClick={onStart}
        disabled={!selected || isStarting}
        className="w-full h-9 mt-4 text-sm"
      >
        <Play className="w-3.5 h-3.5 mr-1.5" />
        {isStarting ? 'Preparing your quiz…' : 'Start quiz'}
      </Button>
      {selected > 0 && (
        <p className="text-[10px] text-muted-foreground mt-2 flex items-center justify-center gap-1">
          <Zap className="w-2.5 h-2.5 text-accent" />
          Up to {maxXP} XP — easy 10 · medium 15 · hard 20 per correct answer
        </p>
      )}
    </motion.div>
  );
}
