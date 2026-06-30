import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { motion } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';
import XPBar from '../components/ui/XPBar';
import GlassCard from '../components/ui/GlassCard';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import { getLevelFromXP, getTitleFromLevel, formatNumber } from '../lib/gameUtils';
import ActiveQuests from '../components/dashboard/ActiveQuests';
import StatsGrid from '../components/dashboard/StatsGrid';
import RecentActivity from '../components/dashboard/RecentActivity';

import { db } from '@/lib/db';


export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => db.auth.me(),
  });

  const totalXP = user?.total_xp || 0;
  const { level, currentXP, xpToNext } = getLevelFromXP(totalXP);
  const title = getTitleFromLevel(level);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 25 } }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatedBackground colors={['emerald']} orbs={2} grid={true} />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 p-5 md:p-8 max-w-5xl mx-auto space-y-6"
      >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <p className="text-xs text-muted-foreground mb-0.5 font-medium tracking-wide uppercase">{greeting}</p>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-1.5">
          {user?.full_name?.split(' ')[0] || 'Student'}{' '}
          <motion.span
            animate={{ rotate: [0, 18, -12, 18, 0] }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="inline-block origin-[70%_70%]"
          >
            👋
          </motion.span>
        </h1>
      </motion.div>

      {/* XP Card */}
      <motion.div variants={itemVariants}>
        <GlassCard hover={true} className="space-y-4 shadow-md hover:shadow-lg border-border/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Current standing</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{title}</p>
            </div>
            <div className="flex items-center gap-1.5 text-accent bg-accent/5 px-2 py-0.5 border border-accent/20 rounded-md">
              <Zap className="w-3.5 h-3.5 fill-accent" />
              <span className="text-xs font-bold tabular-nums tracking-wide">{formatNumber(totalXP)} XP</span>
            </div>
          </div>
          <XPBar current={currentXP} max={xpToNext} level={level} />
        </GlassCard>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants}>
        <StatsGrid user={user} level={level} />
      </motion.div>

      {/* Active Tasks & Activity */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ActiveQuests />
        <RecentActivity />
      </motion.div>
      </motion.div>
    </div>
  );
}
