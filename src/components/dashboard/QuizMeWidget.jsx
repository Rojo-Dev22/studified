import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PenWriting, ArrowRight, Zap } from '@/components/ui/icons';
import GlassCard from '../ui/GlassCard';
import { getQuizHistory } from '@/lib/quiz/history';

/** Dashboard card for Quiz Me — shows recent localStorage quiz results + CTA. */
export default function QuizMeWidget() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getQuizHistory());
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">Quiz Me</p>
        <Link to="/quiz-me" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          Practice now <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {history.length === 0 ? (
          <GlassCard hover={false}>
            <div className="flex items-center gap-3 py-2">
              <PenWriting className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground">No quizzes yet. Try a Grade 9 quiz in Quiz Me.</p>
            </div>
          </GlassCard>
        ) : (
          history.slice(0, 3).map((h) => (
            <GlassCard key={h.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{h.subjectName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {h.topicName} · {h.correct}/{h.total}
                  </p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-xs text-accent font-medium">{h.percent}%</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" />+{h.xpEarned} XP
                  </span>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
