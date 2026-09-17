import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Check } from '@/components/ui/icons';
import GlassCard from '@/components/ui/GlassCard';

/**
 * Grade selection — every supported grade is offered, but grades without real
 * question data in question_index.json are ghosted: visible, unclickable and
 * labelled "Not available right now" (they unlock automatically as soon as
 * data for them exists — nothing is hardcoded here).
 */
export default function GradePicker(/** @type {any} */ { grades = [], selected, onSelect }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-2">Choose a grade</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {grades.map((g, i) => {
          const active = selected === g.grade;
          return (
            <motion.div
              key={g.grade}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={g.available ? { y: -3 } : undefined}
              whileTap={g.available ? { scale: 0.96 } : undefined}
            >
              <GlassCard
                onClick={g.available ? () => onSelect(g.grade) : undefined}
                className={`p-3 ${g.available ? 'group' : 'opacity-50 grayscale cursor-not-allowed'} ${active ? 'border-accent/50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <GraduationCap
                    className={`w-5 h-5 transition-transform duration-200 ${
                      active
                        ? 'text-accent scale-110'
                        : g.available
                          ? 'text-muted-foreground group-hover:scale-110 group-hover:text-foreground/80'
                          : 'text-muted-foreground'
                    }`}
                  />
                  {active && <Check className="w-3.5 h-3.5 text-accent" />}
                </div>
                <p className="text-sm font-semibold text-foreground mt-1.5">Grade {g.grade}</p>
                <p className={`text-[10px] mt-0.5 ${g.available ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                  {g.available ? `${g.subjectCount} subjects` : 'Not available right now'}
                </p>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}