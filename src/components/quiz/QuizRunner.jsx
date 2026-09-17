import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, X, Zap } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

/** Answer option — same visual language as CurriculumExerciseRunner. */
function OptionBtn(/** @type {any} */ { option, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-all
        ${selected ? 'border-accent/50 bg-accent/10' : 'border-border hover:bg-card'}`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border
          ${selected ? 'bg-accent border-accent' : 'border-muted-foreground/40'}`}
      >
        {selected && <span className="h-1.5 w-1.5 rounded-full bg-accent-foreground" />}
      </span>
      <span className="flex-1 text-foreground/90">{option.text}</span>
    </button>
  );
}

export default function QuizRunner(/** @type {any} */ { session, onExit, onFinish }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const questions = session.questions;
  const current = questions[index];
  const answeredAll = questions.every((q) => answers[q.sourceId]);
  const isLast = index === questions.length - 1;

  const select = (questionId, optionId) => setAnswers((prev) => ({ ...prev, [questionId]: optionId }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-accent" />
            {session.subjectName} — {session.topicName}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Question {index + 1} of {questions.length} · {Object.keys(answers).length} answered · up to {session.maxPossibleXP} XP
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Quit this quiz?</AlertDialogTitle>
              <AlertDialogDescription>
                Your progress in this quiz will be lost. You can start a new one at any time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep going</AlertDialogCancel>
              <AlertDialogAction onClick={onExit}>Quit quiz</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className="h-full bg-accent"
          animate={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.sourceId}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
          className="space-y-3"
        >
          {session.topicId === 'all' && (
            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
              {current.topicName}
            </span>
          )}
          <p className="text-sm font-medium text-foreground leading-relaxed">{current.text}</p>
          {current.options.map((opt) => (
            <OptionBtn
              key={opt.id}
              option={opt}
              selected={answers[current.sourceId] === opt.id}
              onSelect={() => select(current.sourceId, opt.id)}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="h-8 text-xs"
        >
          <ArrowLeft className="w-3 h-3 mr-1" /> Previous
        </Button>
        {!isLast ? (
          <Button
            size="sm"
            onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
            disabled={!answers[current.sourceId]}
            className="h-8 text-xs flex-1"
          >
            Next <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        ) : (
          <Button size="sm" onClick={() => onFinish(answers)} disabled={!answeredAll} className="h-8 text-xs flex-1">
            <Check className="w-3 h-3 mr-1" /> Finish quiz
          </Button>
        )}
      </div>
      {isLast && !answeredAll && (
        <p className="text-[10px] text-muted-foreground text-center">
          Answer every question to finish — use Previous to revisit any question.
        </p>
      )}
    </div>
  );
}
