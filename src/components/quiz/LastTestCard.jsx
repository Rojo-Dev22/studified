import React from 'react';
import { motion } from 'framer-motion';
import { History, Zap, Trophy } from '@/components/ui/icons';
import GlassCard from '@/components/ui/GlassCard';
import ReviewRow from '@/components/quiz/ReviewRow';

/**
 * "Last test" — the student's most recent attempt with every question they
 * missed, so they can see exactly where they lost marks (and read why).
 * Entries saved before mistakes were tracked only show the score summary.
 */
export default function LastTestCard(/** @type {any} */ { entry }) {
  if (!entry) return null;

  const tracked = Array.isArray(entry.missed);
  const missed = tracked ? entry.missed : [];
  const perfect = entry.percent === 100;
  const when = entry.savedAt
    ? new Date(entry.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : '';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
        <History className="w-3.5 h-3.5 text-muted-foreground" />
        Last test
        {when && <span className="text-[10px] font-normal text-muted-foreground">· {when}</span>}
      </h2>

      <GlassCard hover={false} className="border-accent/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-foreground truncate">
              {entry.subjectName} — {entry.topicName}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {entry.correct}/{entry.total} correct
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-foreground tabular-nums">{entry.percent}%</span>
            <span className="text-[10px] text-accent font-medium flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />+{entry.xpEarned}
            </span>
          </div>
        </div>
      </GlassCard>

      {perfect ? (
        <GlassCard hover={false} className="mt-2">
          <div className="flex items-center gap-2 py-1">
            <Trophy className="w-4 h-4 text-accent shrink-0" />
            <p className="text-xs text-foreground">Perfect score — nothing missed. Keep the streak going!</p>
          </div>
        </GlassCard>
      ) : tracked && missed.length > 0 ? (
        <div className="mt-2 space-y-2">
          <p className="text-[11px] text-muted-foreground">
            Where you missed — {missed.length} {missed.length === 1 ? 'question' : 'questions'} to revisit:
          </p>
          {missed.map((row, i) => (
            <ReviewRow key={`${i}-${row.text?.slice(0, 12) || i}`} row={{ ...row, index: i }} showTopic={entry.topicId === 'all'} />
          ))}
        </div>
      ) : !tracked ? (
        <p className="text-[10px] text-muted-foreground mt-1.5">
          Question-level review starts from your next attempt.
        </p>
      ) : null}
    </motion.div>
  );
}