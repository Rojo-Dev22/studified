import React from 'react';
import { CheckCircle2, XCircle, Lightbulb, Zap } from '@/components/ui/icons';

/**
 * One question-review row — shared by the results screen and the "Last test"
 * card, so the mistakes view looks identical everywhere.
 *
 * Row shape: { index?, text, topicName, difficulty, xp?, pickedText,
 *              correctText, isCorrect, isUnanswered, explanation }
 */
export default function ReviewRow(/** @type {any} */ { row, showTopic = false }) {
  return (
    <div className={`rounded-lg border p-3 ${row.isCorrect ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
      <div className="flex items-start gap-2">
        {row.isCorrect ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-foreground leading-snug">
            {typeof row.index === 'number' ? `${row.index + 1}. ` : ''}
            {row.text}
          </p>
          {row.topicName && showTopic && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{row.topicName}</p>
          )}
          <div className="mt-1.5 space-y-0.5">
            <p className="text-[11px] text-muted-foreground">
              Your answer:{' '}
              <span className={row.isCorrect ? 'text-emerald-400' : row.isUnanswered ? 'text-amber-400' : 'text-rose-400'}>
                {row.pickedText || 'Not answered'}
              </span>
            </p>
            {!row.isCorrect && (
              <p className="text-[11px] text-emerald-400/90">
                Correct: <span className="font-medium">{row.correctText}</span>
              </p>
            )}
          </div>
          <div className="mt-2 rounded-md bg-accent/5 border border-accent/15 p-2 flex items-start gap-1.5">
            <Lightbulb className="w-3 h-3 text-accent shrink-0 mt-0.5" />
            <p className="text-[11px] text-foreground/80 leading-relaxed">{row.explanation}</p>
          </div>
        </div>
        <span className="text-[10px] text-accent font-medium shrink-0 flex items-center gap-0.5">
          <Zap className="w-2.5 h-2.5" />
          {row.isCorrect ? `+${row.xp}` : '0'}
        </span>
      </div>
    </div>
  );
}