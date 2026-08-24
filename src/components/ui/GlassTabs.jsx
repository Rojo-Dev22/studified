import React, { useId } from 'react';
import { motion } from 'framer-motion';

/**
 * GlassTabs — a segmented control in the spirit of the ThemeToggle pill
 * slider: a frosted-glass track with a translucent "knob" that slides
 * between options with the same spring physics, plus a soft gloss
 * highlight for a glassmorphism finish.
 *
 * Props:
 *   options : [{ id, label, icon? }]           — segment definitions
 *   value   : string                            — active option id
 *   onChange: (id) => void                      — selection handler
 *   size    : 'sm' | 'md'                       — compact vs comfortable
 *   className: extra classes for the track
 */
export default function GlassTabs({ options, value, onChange, size = 'md', className = '' }) {
  const knobId = useId();
  return (
    <div
      role="tablist"
      className={`relative flex items-center rounded-full p-1 border border-border/60 bg-secondary/40 backdrop-blur-xl shadow-inner ${className}`}
      style={{ WebkitBackdropFilter: 'blur(24px)' }}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        const Icon = opt.icon;
        return (
          <motion.button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(opt.id)}
            whileTap={{ scale: 0.96 }}
            className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 rounded-full font-semibold transition-colors duration-200 whitespace-nowrap ${
              size === 'sm' ? 'py-1.5 px-2 text-[11px]' : 'py-2 px-3 text-xs'
            } ${active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'}`}
          >
            {/* Sliding glass knob — shared layoutId makes it glide between options */}
            {active && (
              <motion.span
                layoutId={`glasstabs-knob-${knobId}`}
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 to-white/10 dark:from-white/15 dark:to-white/5 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.35)]"
                style={{ WebkitBackdropFilter: 'blur(20px)' }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {Icon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
              {opt.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
