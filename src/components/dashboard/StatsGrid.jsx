import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Timer, Flame, Star } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

export default function StatsGrid({ user, level }) {
  const stats = [
    {
      label: 'Tasks done',
      value: user?.quests_completed || 0,
      icon: BookOpen,
      iconColor: 'text-blue-400',
    },
    {
      label: 'Focus hrs',
      value: Number(user?.focus_hours || 0).toFixed(1),
      icon: Timer,
      iconColor: 'text-violet-400',
    },
    {
      label: 'Day streak',
      value: user?.streak_days || 0,
      icon: Flame,
      iconColor: 'text-red-400',
    },
    {
      label: 'Level',
      value: level,
      icon: Star,
      iconColor: 'text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, type: 'spring', stiffness: 260, damping: 25 }}
        >
          <GlassCard hover={true} className="flex flex-col gap-3 h-full cursor-default">
            <div className={`w-fit p-1.5 rounded-md bg-secondary/40 border border-border/40 ${s.iconColor}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground tabular-nums tracking-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">{s.label}</p>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}
