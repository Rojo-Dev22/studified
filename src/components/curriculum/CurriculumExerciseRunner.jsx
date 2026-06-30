import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCircle2, XCircle, Trophy, RotateCcw, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { scoreExercises, PASS_PERCENT } from '@/lib/curriculumExercises';

function OptionBtn({ option, checked, onToggle, disabled, reveal, isCorrect, isWrong, theme }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left text-sm transition-all
        ${reveal && isCorrect ? 'border-emerald-500/60 bg-emerald-500/10' : ''}
        ${reveal && isWrong ? 'border-rose-500/50 bg-rose-500/10' : ''}
        ${!reveal && checked ? (theme === 'challenge' ? 'border-blue-400/60 bg-blue-500/10' : 'border-accent/50 bg-accent/10') : ''}
        ${!reveal && !checked ? 'border-border hover:bg-card' : ''}
      `}
    >
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border
          ${checked ? (theme === 'challenge' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-accent border-accent text-accent-foreground') : 'border-muted-foreground/40'}
        `}
      >
        {checked && <Check className="w-3 h-3" strokeWidth={3} />}
      </span>
      <span className="flex-1 text-foreground/90">{option.text}</span>
      {reveal && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
      {reveal && isWrong && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
    </button>
  );
}

export default function CurriculumExerciseRunner({
  exercises = [],
  savedAnswers = {},
  savedSubmitted = false,
  savedPassed = false,
  savedScore = null,
  theme = 'assignment',
  onSaveProgress,
  readOnly = false,
}) {
  const [answers, setAnswers] = useState(savedAnswers);
  const [submitted, setSubmitted] = useState(savedSubmitted);
  const [index, setIndex] = useState(0);

  const score = useMemo(() => scoreExercises(exercises, answers), [exercises, answers]);
  const displayScore = submitted ? (savedScore || score) : score;
  const passed = submitted && (savedPassed ?? displayScore.passed);

  const current = exercises[index];
  const allAnswered = exercises.every((ex) => (answers[ex.id] || []).length > 0);

  const toggle = (ex, optionId) => {
    if (readOnly || submitted) return;
    setAnswers((prev) => {
      const cur = prev[ex.id] || [];
      const next = ex.multiSelect
        ? cur.includes(optionId)
          ? cur.filter((id) => id !== optionId)
          : [...cur, optionId]
        : [optionId];
      const updated = { ...prev, [ex.id]: next };
      onSaveProgress?.({ exercise_answers: updated, exercise_submitted: false });
      return updated;
    });
  };

  const handleSubmit = () => {
    if (!allAnswered || readOnly) return;
    const result = scoreExercises(exercises, answers);
    setSubmitted(true);
    onSaveProgress?.({
      exercise_answers: answers,
      exercise_submitted: true,
      exercise_passed: result.passed,
      exercise_score: { correct: result.correct, total: result.total, percent: result.percent },
    });
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setIndex(0);
    onSaveProgress?.({
      exercise_answers: {},
      exercise_submitted: false,
      exercise_passed: false,
      exercise_score: null,
    });
  };

  if (!exercises.length) {
    return (
      <p className="text-xs text-muted-foreground p-3 rounded-lg border border-border">
        No verification quiz for this item yet.
      </p>
    );
  }

  if (submitted) {
    return (
      <div className={`rounded-xl border p-4 ${theme === 'challenge' ? 'border-blue-500/25 bg-blue-500/5' : 'border-accent/25 bg-accent/5'}`}>
        <div className="text-center py-4">
          <Trophy className={`w-8 h-8 mx-auto mb-2 ${passed ? 'text-accent' : 'text-amber-400'}`} />
          <p className="text-2xl font-bold text-foreground">
            {displayScore.correct}/{displayScore.total}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {displayScore.percent}% — need {PASS_PERCENT}% to pass
          </p>
          <p className="text-sm mt-2 text-foreground">
            {passed ? 'You passed the verification quiz!' : 'Review the lesson and try again.'}
          </p>
        </div>
        <ul className="space-y-2 mt-3 max-h-48 overflow-y-auto">
          {exercises.map((ex, i) => {
            const sel = answers[ex.id] || [];
            const selKey = [...sel].sort().join(',');
            const key = [...ex.correct].sort().join(',');
            const ok = selKey === key;
            return (
              <li key={ex.id} className={`text-xs p-2 rounded border ${ok ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
                <span className="font-medium">{i + 1}. {ex.text}</span>
                {!ok && (
                  <p className="text-emerald-400/90 mt-0.5">
                    Correct: {ex.correct.map((id) => ex.options.find((o) => o.id === id)?.text).join(', ')}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        {!readOnly && !passed && (
          <Button type="button" variant="outline" size="sm" className="w-full mt-3 h-8 text-xs" onClick={handleRetry}>
            <RotateCcw className="w-3 h-3 mr-1" /> Retry quiz
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <ClipboardCheck className="w-3.5 h-3.5 text-accent" />
          Verification quiz ({index + 1}/{exercises.length})
        </p>
        <span className="text-[10px] text-muted-foreground">Answer all — then submit</span>
      </div>

      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className={`h-full ${theme === 'challenge' ? 'bg-blue-500' : 'bg-accent'}`}
          animate={{ width: `${((index + 1) / exercises.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        {current?.type === 'fill' ? (
          <motion.div key={current.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <p className="text-sm font-medium">{current.text}</p>
            <Input
              value={(answers[current.id]?.[0] || '')}
              onChange={(e) => {
                const v = e.target.value;
                setAnswers((prev) => {
                  const updated = { ...prev, [current.id]: [v] };
                  onSaveProgress?.({ exercise_answers: updated, exercise_submitted: false });
                  return updated;
                });
              }}
              placeholder="Type your answer"
              className="h-9 text-sm bg-secondary"
              disabled={readOnly}
            />
          </motion.div>
        ) : (
          <motion.div key={current.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
            <p className="text-sm font-medium text-foreground">{current.text}</p>
            {current.options?.map((opt) => {
              const checked = (answers[current.id] || []).includes(opt.id);
              return (
                <OptionBtn
                  key={opt.id}
                  option={opt}
                  checked={checked}
                  onToggle={() => toggle(current, opt.id)}
                  disabled={readOnly}
                  theme={theme}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Previous
        </Button>
        {index < exercises.length - 1 ? (
          <Button type="button" size="sm" className="h-8 text-xs" onClick={() => setIndex((i) => i + 1)}>
            Next
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className={`h-8 text-xs ${theme === 'challenge' ? 'bg-blue-600 hover:bg-blue-500' : ''}`}
            disabled={!allAnswered || readOnly}
            onClick={handleSubmit}
          >
            Submit answers
          </Button>
        )}
      </div>
      {!allAnswered && index === exercises.length - 1 && (
        <p className="text-[10px] text-center text-muted-foreground">Answer every question to submit</p>
      )}
    </div>
  );
}
