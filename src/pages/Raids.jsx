import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Users, Clock, CheckCircle2, GraduationCap, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import GlassCard from '../components/ui/GlassCard';
import RankBadge from '../components/ui/RankBadge';
import ChallengePlayer from '../components/curriculum/ChallengePlayer';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { awardXP } from '@/lib/xpRewards';
import { formatSubject, GRADES, CURRICULUM_FRAMEWORK } from '@/lib/subjects';
import { getGradeFilter, setGradeFilter } from '@/lib/ethiopianCurriculum';
import { db } from '@/lib/db';

export default function Raids() {
  const [grade, setGrade] = useState(getGradeFilter);
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => db.auth.me() });
  const { data: raids = [] } = useQuery({
    queryKey: ['raids'],
    queryFn: () => db.entities.Raid.list('-created_date', 30),
  });

  const filteredRaids = raids.filter((r) => r.builtin !== false && (!grade || r.grade === grade));

  const handleGradeChange = (v) => {
    const g = parseInt(v, 10);
    setGrade(g);
    setGradeFilter(g);
  };

  const joinMutation = useMutation({
    mutationFn: async (raid) => {
      const participants = raid.participant_emails || [];
      if (participants.length >= (raid.max_participants || 5)) throw new Error('Challenge is full');
      if (participants.includes(user.email)) return raid;
      return db.entities.Raid.update(raid.id, {
        participant_emails: [...participants, user.email],
        exercise_answers: {},
        exercise_submitted: false,
        exercise_passed: false,
        exercise_score: null,
      });
    },
    onSuccess: (raid) => {
      queryClient.invalidateQueries({ queryKey: ['raids'] });
      setExpandedId(raid.id);
      toast.success('Joined — pass the verification quiz when ready');
    },
    onError: (err) => toast.error(err.message),
  });

  const saveExerciseMutation = useMutation({
    mutationFn: ({ raid, data }) => db.entities.Raid.update(raid.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['raids'] }),
  });

  const completeMutation = useMutation({
    mutationFn: async (raid) => {
      if (!raid.exercise_passed) throw new Error('Pass the verification quiz first');
      await db.entities.Raid.update(raid.id, { status: 'completed' });
      await awardXP(db, user, raid.xp_reward);
      return raid;
    },
    onSuccess: (raid) => {
      queryClient.invalidateQueries({ queryKey: ['raids'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      setExpandedId(null);
      toast.success(`Challenge complete! +${raid.xp_reward} XP`);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#8b5cf6', '#10b981', '#ffffff'],
        disableForReducedMotion: true,
      });
    },
  });

  const statusColors = {
    recruiting: 'text-accent bg-accent/10',
    active: 'text-blue-400 bg-blue-400/10',
    completed: 'text-muted-foreground bg-secondary',
    failed: 'text-destructive bg-destructive/10',
  };

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-semibold text-foreground">Challenges</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Group study challenges from the {CURRICULUM_FRAMEWORK}
        </p>
      </div>

      <GlassCard hover={false} className="mb-4 border-blue-500/20">
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
            Join a challenge, pass the in-app verification quiz (75%+), then earn bonus XP.
          </p>
        </div>
      </GlassCard>

      <div className="space-y-3">
        {filteredRaids.length === 0 ? (
          <GlassCard hover={false}>
            <p className="text-sm text-muted-foreground text-center py-4">
              No challenges for Grade {grade}. Try another grade level.
            </p>
          </GlassCard>
        ) : (
          filteredRaids.map((r, i) => {
            const isJoined = (r.participant_emails || []).includes(user?.email);
            const participantCount = (r.participant_emails || []).length;
            const expanded = expandedId === r.id;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <GlassCard hover={false}>
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setExpandedId(expanded ? null : r.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">{r.title}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusColors[r.status]}`}>
                            {r.status}
                          </span>
                        </div>
                        {r.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground flex-wrap">
                          <span className="text-accent/90 font-medium">Grade {r.grade}</span>
                          <RankBadge rank={r.difficulty} size="sm" />
                          <span>{formatSubject(r.subject)}</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {participantCount}/{r.max_participants || 5}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {r.duration_minutes}min
                          </span>
                          <span className="text-accent flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" />+{r.xp_reward} XP
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {expanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                        {r.status === 'recruiting' && !isJoined && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              joinMutation.mutate(r);
                            }}
                            disabled={joinMutation.isPending}
                            className="h-7 text-xs"
                          >
                            Join
                          </Button>
                        )}
                        {isJoined && r.status === 'completed' && (
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
                        <ChallengePlayer
                          raid={r}
                          interactive
                          isJoined={isJoined}
                          onSaveExercise={(raid, data) =>
                            saveExerciseMutation.mutate({ raid, data })
                          }
                          showActions
                          onJoin={() => joinMutation.mutate(r)}
                          onComplete={() => {
                            if (!r.exercise_passed) {
                              toast.error('Pass the verification quiz first');
                              return;
                            }
                            completeMutation.mutate(r);
                          }}
                          isPending={
                            joinMutation.isPending ||
                            completeMutation.isPending ||
                            saveExerciseMutation.isPending
                          }
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
