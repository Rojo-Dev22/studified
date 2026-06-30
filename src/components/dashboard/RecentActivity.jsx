import { db } from '@/lib/db';

import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { Clock } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function RecentActivity() {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['recentSessions'],
    queryFn: () => db.entities.FocusSession.list('-created_date', 5),
  });

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => db.auth.me() });

  const { data: completed = [] } = useQuery({
    queryKey: ['completedQuests', user?.email],
    queryFn: () => db.entities.Quest.filter({ status: 'completed', accepted_by: user?.email }, '-updated_date', 5),
    enabled: !!user?.email,
  });

  const activities = [
    ...sessions.map(s => ({
      text: s.subject ? `Studied ${s.subject}` : 'Focus session',
      sub: `${s.actual_minutes}min focused`,
      xp: s.xp_earned,
      date: s.created_date,
    })),
    ...completed.map(q => ({
      text: q.title,
      sub: 'Task completed',
      xp: q.xp_reward,
      date: q.updated_date,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div>
      <p className="text-sm font-medium text-foreground mb-3">Recent activity</p>
      <div className="space-y-2">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
        ) : activities.length === 0 ? (
          <GlassCard hover={false}>
            <div className="flex items-center gap-3 py-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nothing yet. Start studying!</p>
            </div>
          </GlassCard>
        ) : (
          activities.map((a, i) => (
            <GlassCard key={i} hover={false}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{a.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.sub} · {a.date ? format(new Date(a.date), 'MMM d') : ''}
                  </p>
                </div>
                {a.xp > 0 && <span className="text-xs text-accent font-medium flex-shrink-0">+{a.xp}</span>}
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}