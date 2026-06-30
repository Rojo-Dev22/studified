import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Play, BookOpen, Scroll, Zap, GraduationCap, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import GlassCard from '../components/ui/GlassCard';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import RankBadge from '../components/ui/RankBadge';
import AssignmentPlayer from '../components/curriculum/AssignmentPlayer';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { awardXP } from '@/lib/xpRewards';
import { formatSubject, GRADES, CURRICULUM_FRAMEWORK } from '@/lib/subjects';
import { getGradeFilter, setGradeFilter } from '@/lib/ethiopianCurriculum';
import { db } from '@/lib/db';

const ASSIGNMENT_TYPES = ['daily', 'weekly'];
const QUEST_TYPES = ['story'];
const typeLabels = { daily: 'Daily', weekly: 'Weekly', story: 'Quest' };

export default function Quests() {
  const [tab, setTab] = useState('available');
  const [contentFilter, setContentFilter] = useState('all');
  const [grade, setGrade] = useState(getGradeFilter);
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => db.auth.me() });

  const { data: quests = [] } = useQuery({
    queryKey: ['quests', tab, user?.email],
    queryFn: async () => {
      if (tab === 'available') return db.entities.Quest.filter({ status: 'available' }, '-created_date', 80);
      if (tab === 'active') return db.entities.Quest.filter({ status: 'active', accepted_by: user?.email }, '-created_date', 30);
      return db.entities.Quest.filter({ status: 'completed', accepted_by: user?.email }, '-updated_date', 40);
    },
    enabled: !!user,
  });

  const filteredQuests = quests
    .filter((q) => q.builtin !== false)
    .filter((q) => !grade || q.grade === grade)
    .filter((q) => {
      if (contentFilter === 'assignments') return ASSIGNMENT_TYPES.includes(q.type);
      if (contentFilter === 'quests') return QUEST_TYPES.includes(q.type);
      return true;
    });

  useEffect(() => {
    if (tab !== 'active') return;
    const first = filteredQuests[0];
    if (first) setExpandedId(first.id);
  }, [tab, grade, contentFilter, quests.length]);

  const handleGradeChange = (v) => {
    const g = parseInt(v, 10);
    setGrade(g);
    setGradeFilter(g);
  };

  const acceptMutation = useMutation({
    mutationFn: (quest) =>
      db.entities.Quest.update(quest.id, {
        status: 'active',
        accepted_by: user.email,
        exercise_answers: {},
        exercise_submitted: false,
        exercise_passed: false,
        exercise_score: null,
      }),
    onSuccess: (quest) => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['activeQuests'] });
      setExpandedId(quest.id);
      toast.success('Read the lesson, then pass the verification quiz');
    },
  });

  const saveExerciseMutation = useMutation({
    mutationFn: ({ quest, data }) => db.entities.Quest.update(quest.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quests'] }),
  });

  const completeMutation = useMutation({
    mutationFn: async (quest) => {
      if (!quest.exercise_passed) throw new Error('Pass the verification quiz first');
      await db.entities.Quest.update(quest.id, { status: 'completed', accepted_by: user.email });
      await awardXP(db, user, quest.xp_reward, {
        quests_completed: (user.quests_completed || 0) + 1,
      });
      return quest;
    },
    onSuccess: (quest) => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['activeQuests'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['completedQuests'] });
      queryClient.invalidateQueries({ queryKey: ['recentSessions'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      setExpandedId(null);
      const label = QUEST_TYPES.includes(quest.type) ? 'Quest' : 'Assignment';
      toast.success(`${label} complete! +${quest.xp_reward} XP`, {
        icon: <Zap className="w-4 h-4 text-accent" />,
      });
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#ffffff'],
        disableForReducedMotion: true,
      });
    },
  });

  const difficultyLabel = { E: 'Beginner', D: 'Easy', C: 'Medium', B: 'Hard', A: 'Expert', S: 'Master' };

  const emptyMessage = {
    available: `No ${contentFilter === 'all' ? 'tasks' : contentFilter} for Grade ${grade} right now.`,
    active: 'No assignments in progress. Open one from Browse.',
    completed: 'Complete Ethiopian curriculum tasks to earn XP.',
  };

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <motion.div className="flex items-center gap-2.5 mb-1" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <motion.div animate={{ boxShadow: ['0 0 0 0 rgba(16,185,129,0.3)', '0 0 0 12px rgba(16,185,129,0)', '0 0 0 0 rgba(16,185,129,0)'] }} transition={{ duration: 3, repeat: Infinity }} className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
          </motion.div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">Assignments & Quests</h1>
        </motion.div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Built-in lessons aligned with the {CURRICULUM_FRAMEWORK}
        </p>
      </div>

      <GlassCard hover={false} className="mb-4 border-accent/20">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Grade</span>
            <Select value={String(grade)} onValueChange={handleGradeChange}>
              <SelectTrigger className="h-8 w-[100px] text-xs bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    Grade {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[10px] text-muted-foreground flex-1 min-w-[200px]">
            Each assignment includes an in-app quiz — pass it (75%+) to prove you completed the lesson.
          </p>
        </div>
      </GlassCard>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="bg-secondary h-8">
          <TabsTrigger value="available" className="text-xs h-6">Browse</TabsTrigger>
          <TabsTrigger value="active" className="text-xs h-6">In Progress</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs h-6">Done</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'available' && (
        <div className="flex gap-2 mb-4">
          {[
            { id: 'all', label: 'All' },
            { id: 'assignments', label: 'Assignments', icon: BookOpen },
            { id: 'quests', label: 'Quests', icon: Scroll },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setContentFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border transition-colors ${
                contentFilter === f.id
                  ? 'border-foreground/30 bg-secondary text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.icon && <f.icon className="w-3 h-3" />}
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {filteredQuests.length === 0 ? (
            <GlassCard hover={false}>
              <div className="flex items-center gap-3 py-4">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{emptyMessage[tab]}</p>
              </div>
            </GlassCard>
          ) : (
            filteredQuests.map((q, i) => {
              const expanded = expandedId === q.id;
              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <GlassCard hover={false} className="overflow-hidden">
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => setExpandedId(expanded ? null : q.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium leading-snug">{q.title}</p>
                          {q.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{q.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">
                              Grade {q.grade}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-medium">
                              {typeLabels[q.type] || q.type}
                            </span>
                            <RankBadge rank={q.difficulty} size="sm" />
                            <span className="text-[10px] text-muted-foreground">{formatSubject(q.category)}</span>
                            <span className="text-[10px] text-muted-foreground">{q.duration_minutes}min</span>
                            <span className="text-[10px] text-accent font-medium flex items-center gap-0.5">
                              <Zap className="w-2.5 h-2.5" />+{q.xp_reward} XP
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {expanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                          {tab === 'available' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                acceptMutation.mutate(q);
                              }}
                              disabled={acceptMutation.isPending}
                              className="h-7 text-xs border-border hover:bg-secondary"
                            >
                              <Play className="w-3 h-3 mr-1" /> Start
                            </Button>
                          )}
                          {tab === 'completed' && (
                            <CheckCircle2 className="w-4 h-4 text-accent" />
                          )}
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 pt-4 border-t border-border"
                        >
                          <AssignmentPlayer
                            quest={q}
                            interactive={tab === 'active'}
                            onSaveExercise={(quest, data) =>
                              saveExerciseMutation.mutate({ quest, data })
                            }
                            showActions={tab === 'active'}
                            onComplete={() => {
                              if (!q.exercise_passed) {
                                toast.error('Pass the verification quiz first');
                                return;
                              }
                              completeMutation.mutate(q);
                            }}
                            isPending={completeMutation.isPending || saveExerciseMutation.isPending}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
