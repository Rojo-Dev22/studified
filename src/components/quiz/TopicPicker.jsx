import React from 'react';
import { motion } from 'framer-motion';
import { Layers } from '@/components/ui/icons';

/**
 * Topic chips for the selected subject — driven entirely by topics.json
 * (plus per-topic availability from question_index.json). Includes the
 * "All Topics" choice, which draws from every valid Grade 9 topic of the
 * selected subject.
 */
export default function TopicPicker(/** @type {any} */ { topics = [], availability = {}, selected, onSelect }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-sm font-semibold text-foreground mb-2">Choose a topic</h2>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelect('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border transition-all hover:-translate-y-0.5 active:scale-95 ${
            selected === 'all'
              ? 'border-accent/50 bg-accent/10 text-accent'
              : 'border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="w-3 h-3" />
          All Topics
        </button>
        {topics.map((t) => {
          const count = availability[t.id] || 0;
          const active = selected === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              disabled={count === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
                active
                  ? 'border-accent/50 bg-accent/10 text-accent'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="max-w-[220px] truncate">{t.name}</span>
              <span className={`text-[10px] ${active ? 'text-accent/80' : 'text-muted-foreground/70'}`}>{count}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
