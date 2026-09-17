import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Zap, Play } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import ReviewRow from '@/components/quiz/ReviewRow';

/** Celebration — same emerald palette the app uses on quest completion. */
function celebrate() {
  confetti({
    particleCount: 140,
    spread: 80,
    origin: { y: 0.6 },
    colors: ['#10b981', '#34d399', '#6ee7b7', '#ffffff'],
    disableForReducedMotion: true,
  });
}

export default function QuizResults(/** @type {any} */ { session, results, review = [], showTopic = false, onRetry, onNewQuiz }) {
  useEffect(() => {
    if (results.percent >= 75) celebrate();
  }, [results]);

  return (
    <div className="space-y-4">
      {/* Score card */}
      <GlassCard hover={false} className="border-accent/20">
        <div className="flex flex-col items-center text-center py-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 flex items-center justify-center"
          >
            <Trophy className={`w-6 h-6 ${results.percent >= 75 ? 'text-accent' : 'text-amber-400'}`} />
          </motion.div>
          <p className="text-3xl font-bold text-foreground mt-3 tabular-nums">{results.percent}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {results.correct} of {results.total} correct
            {results.unanswered > 0 && ` · ${results.unanswered} unanswered`}
          </p>
          <div className="flex items-center gap-1.5 mt-3 text-accent bg-accent/5 px-2.5 py-1 border border-accent/20 rounded-md">
            <Zap className="w-3.5 h-3.5 fill-accent" />
            <span className="text-xs font-bold tabular-nums">+{results.xpEarned} XP earned</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2.5">
            {session.subjectName} · {session.topicName} · Grade {session.grade}
          </p>
        </div>
      </GlassCard>

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onRetry} className="h-9 text-xs flex-1">
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Try again
        </Button>
        <Button size="sm" onClick={onNewQuiz} className="h-9 text-xs flex-1">
          <Play className="w-3.5 h-3.5 mr-1.5" /> New quiz
        </Button>
      </div>

      {/* Review */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Review answers</h3>
        <div className="space-y-2">
          {review.map((row) => (
            <ReviewRow key={row.sourceId} row={{ ...row, showTopic }} />
          ))}
        </div>
      </div>
    </div>
  );
}
