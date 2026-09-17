import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Dna, Flask, Atom, MathFunction, ChartLine, World, History, Scale, Layers, BookOpen } from '@/components/ui/icons';

/** Subject icons come from the app's shared Tabler icon set. */
const SUBJECT_ICONS = {
  biology: Dna,
  chemistry: Flask,
  physics: Atom,
  mathematics: MathFunction,
  economics: ChartLine,
  geography: World,
  history: History,
  citizenship: Scale,
};

export default function SubjectPicker(/** @type {any} */ { subjects = [], selectedId, onSelect }) {
  if (!subjects.length) {
    return (
      <GlassCard hover={false}>
        <div className="flex items-center gap-3 py-2">
          <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            No quiz subjects are available yet. Ask your teacher to add Grade 9 question banks.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-2">Select a subject</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {subjects.map((s, i) => {
          const Icon = SUBJECT_ICONS[s.id] || Layers;
          const active = s.id === selectedId;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.96 }}
            >
              <GlassCard onClick={() => onSelect(s.id)} className={`p-3 group ${active ? 'border-accent/50 bg-accent/5' : ''}`}>
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    active
                      ? 'text-accent scale-110'
                      : 'text-muted-foreground group-hover:scale-125 group-hover:text-foreground/80'
                  }`}
                />
                <p className="text-xs font-medium text-foreground mt-1.5 truncate">{s.name}</p>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
