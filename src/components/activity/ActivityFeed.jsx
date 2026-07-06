import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, BookOpen, Flame, Trophy, Star, Target, Brain, 
  Clock, Award, Medal, Crown, Sparkles, MessageSquare,
  Calendar, TrendingUp
} from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { formatFirestoreDate, getTimeAgo } from '@/lib/cloudDatabase';

const ACTIVITY_ICONS = {
  quest_completed: BookOpen,
  quest_started: BookOpen,
  focus_session: Clock,
  achievement_unlocked: Trophy,
  ai_chat: MessageSquare,
  level_up: TrendingUp,
  streak_milestone: Flame,
  guild_joined: Award,
  xp_earned: Zap,
};

const ACTIVITY_COLORS = {
  quest_completed: 'text-emerald-400 bg-emerald-500/10',
  quest_started: 'text-blue-400 bg-blue-500/10',
  focus_session: 'text-violet-400 bg-violet-500/10',
  achievement_unlocked: 'text-amber-400 bg-amber-500/10',
  ai_chat: 'text-cyan-400 bg-cyan-500/10',
  level_up: 'text-purple-400 bg-purple-500/10',
  streak_milestone: 'text-orange-400 bg-orange-500/10',
  guild_joined: 'text-pink-400 bg-pink-500/10',
  xp_earned: 'text-yellow-400 bg-yellow-500/10',
};

export default function ActivityFeed({ activities = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <GlassCard hover={false} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/50" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary/50 rounded w-3/4" />
                  <div className="h-3 bg-secondary/50 rounded w-1/2" />
                </div>
              </div>
            </GlassCard>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <GlassCard hover={false} className="p-8 text-center">
        <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No activity yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Complete quests, focus sessions, and more to see your activity here
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {activities.map((activity, index) => {
          const Icon = ACTIVITY_ICONS[activity.type] || Zap;
          const colorClass = ACTIVITY_COLORS[activity.type] || 'text-gray-400 bg-gray-500/10';
          const timeAgo = getTimeAgo(activity.createdAt);
          
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ 
                delay: index * 0.03,
                type: 'spring',
                stiffness: 300,
                damping: 25 
              }}
            >
              <GlassCard hover={false} className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {activity.title}
                        </p>
                        {activity.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {timeAgo}
                      </span>
                    </div>

                    {/* Metadata badges */}
                    {activity.metadata && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {activity.metadata.xpEarned && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            <Zap className="w-3 h-3" />
                            +{activity.metadata.xpEarned} XP
                          </span>
                        )}
                        {activity.metadata.subject && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground border border-border/50">
                            <BookOpen className="w-3 h-3" />
                            {activity.metadata.subject}
                          </span>
                        )}
                        {activity.metadata.score && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Target className="w-3 h-3" />
                            {activity.metadata.score}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/**
 * Compact activity item for lists
 */
export function ActivityItem({ activity, compact = false }) {
  const Icon = ACTIVITY_ICONS[activity.type] || Zap;
  const colorClass = ACTIVITY_COLORS[activity.type] || 'text-gray-400 bg-gray-500/10';
  const timeAgo = getTimeAgo(activity.createdAt);

  if (compact) {
    return (
      <div className="flex items-center gap-2 py-1.5">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">
            {activity.title}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {timeAgo}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 py-2">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{activity.title}</p>
        {activity.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo}</p>
      </div>
    </div>
  );
}