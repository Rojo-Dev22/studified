import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Trophy,
  RotateCcw,
  Sparkles,
  Circle,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function OptionRow({ option, checked, onToggle, disabled, reveal, isCorrect, isWrong }) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      whileTap={disabled ? {} : { scale: 0.99 }}
      className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200
        ${reveal && isCorrect ? 'border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : ''}
        ${reveal && isWrong ? 'border-rose-500/50 bg-rose-500/10' : ''}
        ${!reveal && checked ? 'border-amber-400/70 bg-amber-400/10 shadow-[0_0_16px_rgba(251,191,36,0.12)]' : ''}
        ${!reveal && !checked ? 'border-violet-500/25 bg-violet-950/40 hover:border-violet-400/40 hover:bg-violet-900/30' : ''}
        ${disabled && !reveal ? 'opacity-90' : ''}
      `}
    >
      <div
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors
          ${checked && !reveal ? 'border-amber-400 bg-amber-400 text-violet-950' : 'border-violet-400/50 bg-violet-950/80'}
          ${reveal && isCorrect ? 'border-emerald-400 bg-emerald-500 text-white' : ''}
          ${reveal && isWrong ? 'border-rose-400 bg-rose-500/80 text-white' : ''}
        `}
        aria-hidden
      >
        {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
      </div>
      <span className="text-sm text-violet-50/95 leading-relaxed flex-1">{option.text}</span>
      {reveal && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
      {reveal && isWrong && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
    </motion.button>
  );
}

export default function QuizArena({ quiz, onClose, topic, onGetStudyAdvice }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);
  const [studyAdvice, setStudyAdvice] = useState(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const questions = quiz?.questions ?? [];
  const total = questions.length;
  const current = questions[index];

  const progress = total ? ((finished ? total : index + 1) / total) * 100 : 0;

  const allAnswered = useMemo(
    () => questions.every((q) => {
      const sel = answers[q.id];
      return Array.isArray(sel) && sel.length > 0;
    }),
    [questions, answers]
  );

  const score = useMemo(() => {
    if (!finished) return null;
    let correct = 0;
    questions.forEach((q) => {
      const sel = [...(answers[q.id] || [])].sort().join(',');
      const key = [...q.correct].sort().join(',');
      if (sel === key) correct += 1;
    });
    return { correct, total: questions.length };
  }, [finished, questions, answers]);

  const wrongQuestions = useMemo(() => {
    if (!finished) return [];
    const wrong = [];
    questions.forEach((q) => {
      const sel = [...(answers[q.id] || [])].sort().join(',');
      const key = [...q.correct].sort().join(',');
      if (sel !== key) {
        wrong.push({
          text: q.text,
          correct: q.correct,
          options: q.options,
          selected: answers[q.id] || [],
        });
      }
    });
    return wrong;
  }, [finished, questions, answers]);

  const toggleOption = (question, optionId) => {
    if (finished) return;
    setAnswers((prev) => {
      const currentSel = prev[question.id] || [];
      if (question.multiSelect) {
        const next = currentSel.includes(optionId)
          ? currentSel.filter((id) => id !== optionId)
          : [...currentSel, optionId];
        return { ...prev, [question.id]: next };
      }
      return { ...prev, [question.id]: [optionId] };
    });
  };

  const handleFinish = () => {
    if (!allAnswered) return;
    setFinished(true);
    // Ask for study advice
    if (onGetStudyAdvice && topic) {
      setLoadingAdvice(true);
      onGetStudyAdvice(topic, score.correct, total, wrongQuestions)
        .then((advice) => {
          setStudyAdvice(advice);
          setLoadingAdvice(false);
        })
        .catch(() => { setLoadingAdvice(false); });
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setIndex(0);
    setFinished(false);
    setStudyAdvice(null);
  };

  const getGradeMessage = (correct, total) => {
    const pct = correct / total;
    if (pct >= 0.93) return { emoji: '🏆', title: `Grade: ${correct}/15 — Outstanding!`, msg: 'You have mastered this topic! You clearly understand the concepts deeply.' };
    if (pct >= 0.80) return { emoji: '🌟', title: `Grade: ${correct}/15 — Excellent!`, msg: 'Strong understanding! A few small areas to polish, but you are well on your way.' };
    if (pct >= 0.60) return { emoji: '📚', title: `Grade: ${correct}/15 — Good Effort!`, msg: 'You have a solid foundation but there are some key areas to review. Focus on the questions you missed.' };
    if (pct >= 0.40) return { emoji: '💪', title: `Grade: ${correct}/15 — Keep Going!`, msg: 'You are building understanding but need more review. Don\'t be discouraged — this shows exactly what to study.' };
    return { emoji: '🎯', title: `Grade: ${correct}/15 — Starting Point!`, msg: 'This topic needs more attention. Use the advice below to focus your studies. Every expert was once a beginner!' };
  };

  if (!total) {
    return (
      <div className="rounded-2xl border border-violet-500/30 bg-violet-950/50 p-6 text-center text-violet-200/80 text-sm">
        Could not load quiz questions. Try generating again.
      </div>
    );
  }

  return (
    <div className="quiz-arena relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 shadow-2xl shadow-violet-900/40">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-violet-500/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <div className="relative p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-amber-400/90 font-semibold">Quiz Arena</p>
            <h3 className="text-base font-semibold text-violet-50 mt-0.5">{quiz.title}</h3>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-violet-300/70 hover:text-violet-100 px-2 py-1 rounded-md hover:bg-violet-800/40"
            >
              Back to chat
            </button>
          )}
        </div>

        <div className="h-2 rounded-full bg-violet-900/80 overflow-hidden mb-1">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-[10px] text-violet-400/80 mb-5">
          {finished ? 'Results unlocked' : `Question ${index + 1} of ${total}`}
          {!finished && !allAnswered && ` · ${Object.keys(answers).filter((k) => answers[k]?.length).length}/${total} answered`}
        </p>

        <AnimatePresence mode="wait">
          {finished ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Score & Grade Section */}
              <div className="text-center py-6 rounded-xl bg-violet-900/40 border border-amber-400/20">
                <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                <p className="text-sm text-violet-200/60 mb-1">Your Score</p>
                <p className="text-4xl font-bold text-amber-300">
                  {score.correct}/15
                </p>
                <p className="text-xs text-violet-300/70 mt-1">
                  {Math.round((score.correct / score.total) * 100)}% correct
                </p>
              </div>

              {/* Grade Message */}
              <div className="rounded-xl bg-violet-900/30 border border-violet-500/20 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getGradeMessage(score.correct, score.total).emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-300">{getGradeMessage(score.correct, score.total).title}</p>
                    <p className="text-xs text-violet-200/80 mt-1">{getGradeMessage(score.correct, score.total).msg}</p>
                  </div>
                </div>
              </div>

              {/* Wrong Questions Review */}
              <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                {questions.map((q, qi) => {
                  const sel = answers[q.id] || [];
                  const selKey = [...sel].sort().join(',');
                  const key = [...q.correct].sort().join(',');
                  const ok = selKey === key;
                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl border p-3 ${ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        {ok ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <p className="text-xs font-medium text-violet-100">
                          {qi + 1}. {q.text}
                        </p>
                      </div>
                      <p className="text-[10px] text-violet-300/70 ml-6">
                        Your answer:{' '}
                        {sel.map((id) => q.options.find((o) => o.id === id)?.text).join(', ') || '—'}
                      </p>
                      {!ok && (
                        <p className="text-[10px] text-emerald-400/90 ml-6 mt-0.5">
                          Correct:{' '}
                          {q.correct.map((id) => q.options.find((o) => o.id === id)?.text).join(', ')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Personalized Study Advice Section */}
              {studyAdvice && (
                <div className="rounded-xl bg-gradient-to-r from-amber-500/10 to-violet-500/10 border border-amber-400/20 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                    <p className="text-sm font-semibold text-amber-300">Personalized Study Advice</p>
                  </div>
                  <div className="prose prose-invert prose-xs max-w-none text-xs text-violet-200/90 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{studyAdvice}</ReactMarkdown>
                  </div>
                </div>
              )}
              {loadingAdvice && (
                <div className="text-center py-3">
                  <p className="text-xs text-violet-400 animate-pulse">Analyzing your results for personalized advice...</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRetry}
                  className="flex-1 border-violet-500/40 bg-violet-900/30 text-violet-100 hover:bg-violet-800/50 h-10"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try again
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 text-sm font-bold">
                  {index + 1}
                </span>
                <p className="text-sm font-medium text-violet-50 leading-snug flex-1">{current.text}</p>
              </div>

              {current.multiSelect && (
                <p className="text-[10px] text-amber-400/80 mb-3 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Select all that apply
                </p>
              )}

              <div className="space-y-2.5 mb-5">
                {current.options.map((opt) => (
                  <OptionRow
                    key={opt.id}
                    option={opt}
                    checked={(answers[current.id] || []).includes(opt.id)}
                    onToggle={() => toggleOption(current, opt.id)}
                    disabled={false}
                    reveal={false}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={index === 0}
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  className="text-violet-300 hover:text-violet-100 hover:bg-violet-800/40 h-9"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>

                <div className="flex gap-1">
                  {questions.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIndex(i)}
                      className="p-1"
                      aria-label={`Go to question ${i + 1}`}
                    >
                      {(answers[questions[i].id] || []).length > 0 ? (
                        <CheckCircle2 className="w-3 h-3 text-amber-400/80" />
                      ) : (
                        <Circle
                          className={`w-3 h-3 ${i === index ? 'text-amber-400' : 'text-violet-600'}`}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {index < total - 1 ? (
                  <Button
                    type="button"
                    onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                    className="bg-amber-400 text-violet-950 hover:bg-amber-300 h-9 font-semibold"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleFinish}
                    disabled={!allAnswered}
                    className="bg-gradient-to-r from-amber-400 to-amber-300 text-violet-950 hover:opacity-90 h-9 font-semibold disabled:opacity-40"
                  >
                    Finish quiz
                  </Button>
                )}
              </div>

              {!allAnswered && index === total - 1 && (
                <p className="text-center text-[10px] text-violet-400/70 mt-3">
                  Answer every question before submitting — answers stay hidden until then.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}