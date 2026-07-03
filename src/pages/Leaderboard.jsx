import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import XPBar from '../components/ui/XPBar';
import AvatarDisplay from '../components/profile/AvatarDisplay';
import { getLevelFromXP, getTitleFromLevel, formatNumber } from '../lib/gameUtils';
import { fetchAllUsersFromFirebase } from '@/lib/userDataService';
import { useAuth } from '@/lib/AuthContext';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { db } from '@/lib/db';

export default function Leaderboard() {
  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => db.auth.me() });
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => fetchAllUsersFromFirebase(50),
    refetchInterval: 30000, // Refetch every 30 seconds to get latest data
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatedBackground colors={['emerald']} orbs={2} grid={true} />
      <div className="relative z-10 p-5 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Leaderboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Top students this week</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary/50 hover:bg-secondary text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh leaderboard"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {users.length === 1 && (
        <GlassCard hover={false} className="mb-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-foreground">Only your account is visible</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                To see ALL users from ALL devices, you must deploy Firebase security rules. 
                Check the FIREBASE_SETUP.md file in the project for instructions.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="space-y-2">
        {users.map((u, i) => {
          const { level, currentXP, xpToNext } = getLevelFromXP(u.total_xp || 0);
          const title = getTitleFromLevel(level);
          const isMe = u.email === currentUser?.email;

          return (
            <motion.div key={u.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 }}>
              <GlassCard hover={false} className={isMe ? 'border-foreground/20' : ''}>
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-sm flex-shrink-0">
                    {i < 3 ? medals[i] : <span className="text-xs text-muted-foreground tabular-nums">{i + 1}</span>}
                  </span>
                  <AvatarDisplay avatar={u.avatar} size={36} className="ring-1 ring-border/30" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-foreground font-medium truncate">
                        {u.full_name || 'Anonymous'}
                      </p>
                      {isMe && <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded flex-shrink-0">you</span>}
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{title}</span>
                    </div>
                    <div className="mt-1.5">
                      <XPBar current={currentXP} max={xpToNext} level={level} showLabel={false} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold tabular-nums text-foreground">{formatNumber(u.total_xp || 0)}</p>
                    <p className="text-[10px] text-muted-foreground">XP</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
        {users.length === 0 && !isLoading && (
          <GlassCard hover={false}>
            <p className="text-sm text-muted-foreground text-center py-4">No students ranked yet.</p>
          </GlassCard>
        )}
      </div>
    </div>
  </div>
  );
}
