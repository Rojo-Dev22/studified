import { db } from '@/lib/db';

import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { Skeleton } from '@/components/ui/skeleton';
import { formatSubject } from '@/lib/subjects';

export default function ActiveQuests() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => db.auth.me() });

  const { data: quests = [], isLoading } = useQuery({
    queryKey: ['activeQuests'],
    queryFn: () => db.entities.Quest.filter({ status: 'active', accepted_by: user?.email }, '-created_date', 5),
    enabled: !!user?.email,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">In progress</p>
        <Link to="/quests" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
        ) : quests.length === 0 ? (
          <GlassCard hover={false}>
            <div className="flex items-center gap-3 py-2">
              <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground">No tasks in progress. Pick one from Assignments.</p>
            </div>
          </GlassCard>
        ) : (
          quests.map((q) => (
            <GlassCard key={q.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{q.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatSubject(q.category)} · {q.duration_minutes}min</p>
                </div>
                <span className="text-xs text-accent font-medium flex-shrink-0">+{q.xp_reward} XP</span>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}