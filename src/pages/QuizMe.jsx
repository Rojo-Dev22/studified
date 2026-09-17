import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { PenWriting, Zap, AlertCircle, History, ArrowRight, Check, ChevronRight } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import GradePicker from '@/components/quiz/GradePicker';
import SubjectPicker from '@/components/quiz/SubjectPicker';
import TopicPicker from '@/components/quiz/TopicPicker';
import CountPicker from '@/components/quiz/CountPicker';
import QuizRunner from '@/components/quiz/QuizRunner';
import QuizResults from '@/components/quiz/QuizResults';
import LastTestCard from '@/components/quiz/LastTestCard';
import { SUPPORTED_GRADES } from '@/lib/quiz/config';
import {
  loadSubjects,
  loadQuestionIndex,
  loadTopics,
  getUsableSubjects,
  getTopicsForGrade,
  getTopicAvailability,
  getSubjectAvailability,
  QuizDataError,
} from '@/lib/quiz/catalogService';
import { createQuizSession } from '@/lib/quiz/engine';
import { scoreSession, buildReview } from '@/lib/quiz/scoring';
import { getQuizHistory, saveQuizResult } from '@/lib/quiz/history';
import { getRecentQuestionIds, markQuestionsUsed } from '@/lib/quiz/recents';
import { awardXP } from '@/lib/xpRewards';
import { checkAchievements } from '@/lib/achievementChecker';
import { db } from '@/lib/db';
import { CURRICULUM_FRAMEWORK } from '@/lib/subjects';

const FRIENDLY_ERRORS = {
  FETCH_FAILED: 'Quiz data is unavailable right now — please try again.',
  MALFORMED: 'The quiz data files could not be read.',
  BANK_UNAVAILABLE: "This subject's question bank could not be loaded.",
  NO_VALID_QUESTIONS: 'No valid questions are available for this selection.',
  NO_QUESTIONS_FOR_TOPIC: 'No valid questions exist for this topic yet.',
  NO_TOPICS: 'No topics are registered for this subject yet.',
};

function friendlyQuizError(err) {
  return err instanceof QuizDataError ? FRIENDLY_ERRORS[err.code] || err.message : 'Something went wrong while starting the quiz.';
}

export default function QuizMe() {
  const queryClient = useQueryClient();

  const [grade, setGrade] = useState(null);
  const [step, setStep] = useState(0); // 0 grade · 1 subject · 2 topic · 3 count
  const [subjectId, setSubjectId] = useState(null);
  const [topicId, setTopicId] = useState(null);
  const [count, setCount] = useState(null);
  const [view, setView] = useState('setup'); // setup | quiz | results
  const [starting, setStarting] = useState(false);
  const [session, setSession] = useState(null);
  const [outcomes, setOutcomes] = useState(null);
  const [history, setHistory] = useState(() => getQuizHistory());

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => db.auth.me() });
  const subjectsQ = useQuery({ queryKey: ['quizme', 'subjects'], queryFn: loadSubjects });
  const indexQ = useQuery({ queryKey: ['quizme', 'index'], queryFn: loadQuestionIndex });
  const topicsQ = useQuery({ queryKey: ['quizme', 'topics'], queryFn: loadTopics, enabled: !!subjectId });

  /* Grade choices come from SUPPORTED_GRADES; availability comes from the index —
     grades without real question data stay visible but ghosted and unclickable. */
  const gradeOptions = useMemo(
    () =>
      SUPPORTED_GRADES.map((g) => {
        const entry = indexQ.data?.grades?.[String(g)];
        const subjectIds = entry ? Object.keys(entry) : [];
        const available = subjectIds.some((id) => (entry[id]?.totalQuestions || 0) > 0);
        return { grade: g, available, subjectCount: available ? subjectIds.length : 0 };
      }),
    [indexQ.data],
  );

  /* Subjects come from subjects.json, filtered to the chosen grade + real index data. */
  const usableSubjects = useMemo(
    () =>
      (grade == null ? [] : getUsableSubjects({ subjectsData: subjectsQ.data, indexData: indexQ.data, grade })).map((s) => ({
        ...s,
        count: getSubjectAvailability(indexQ.data, grade, s.id),
      })),
    [subjectsQ.data, indexQ.data, grade],
  );

  const selectedSubject = usableSubjects.find((s) => s.id === subjectId) || null;
  const topics = subjectId && topicsQ.data ? getTopicsForGrade(topicsQ.data, grade, subjectId) : [];
  const availability = indexQ.data && subjectId ? getTopicAvailability(indexQ.data, grade, subjectId) : {};
  const totalAvailable = indexQ.data && subjectId ? getSubjectAvailability(indexQ.data, grade, subjectId) : 0;
  const selectedTopicAvailability = topicId === 'all' ? totalAvailable : availability[topicId] || 0;

  useEffect(() => {
    if (view === 'setup') setHistory(getQuizHistory());
  }, [view]);

  /* Wizard navigation — previous selections are kept when revisiting a step. */
  const pickGrade = (g) => setGrade(g);
  const pickSubject = (id) => {
    setSubjectId(id);
    setTopicId(null);
    setCount(null);
  };
  const pickTopic = (id) => {
    setTopicId(id);
    setCount(null);
  };
  /* Going back to a previous step clears only the choices made after it. */
  const jumpTo = (target) => {
    if (target <= 0) {
      setSubjectId(null);
      setTopicId(null);
      setCount(null);
    } else if (target <= 1) {
      setTopicId(null);
      setCount(null);
    } else if (target <= 2) {
      setCount(null);
    }
    setStep(target);
  };

  const startQuiz = async () => {
    if (grade == null || !selectedSubject || topicId == null || !count) return;
    setStarting(true);
    try {
      /* Avoid repeating recently-seen questions — the engine prefers fresh ones
         and only recycles (oldest-seen first) when the unseen pool runs dry. */
      const recentIds = getRecentQuestionIds(grade, selectedSubject.id);
      /* The engine re-validates the actual bank — real content always wins. */
      const s = await createQuizSession({ subject: selectedSubject, grade, topicId, requestedCount: count, recentIds });
      markQuestionsUsed(grade, selectedSubject.id, s.questions.map((q) => q.sourceId));
      if (s.count < count) toast.info(`Only ${s.count} valid questions are available — starting with ${s.count}.`);
      setSession(s);
      setView('quiz');
    } catch (err) {
      console.warn('[quiz] start failed:', err);
      toast.error(friendlyQuizError(err));
    } finally {
      setStarting(false);
    }
  };

  const finishQuiz = async (answers) => {
    if (!session) return;
    const results = scoreSession(session, answers);
    const review = buildReview(session, answers);
    setOutcomes({ results, review });
    setView('results');
    /* Save the missed questions too — they power the "Last test" mistakes view. */
    saveQuizResult(session, results, review);
    await awardQuizXP(session, results, user);
    toast.success(`Quiz complete! +${results.xpEarned} XP`, { icon: <Zap className="w-4 h-4 text-accent" /> });
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
  };

  const retryQuiz = () => startQuiz(); // same subject/topic/count, freshly shuffled
  const newQuiz = () => {
    setGrade(null);
    setSubjectId(null);
    setTopicId(null);
    setCount(null);
    setSession(null);
    setOutcomes(null);
    setStep(0);
    setView('setup');
  };
  const exitQuiz = () => {
    setSession(null);
    setView('setup');
    // Quitting mid-quiz returns to the count step when the setup is complete.
    setStep(grade != null && subjectId && topicId != null ? 3 : 0);
  };


  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto">
      {/* Page header — same pattern as the rest of the app */}
      <div className="mb-6">
        <motion.div className="flex items-center gap-2.5 mb-1" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <motion.div
            animate={{ boxShadow: ['0 0 0 0 rgba(16,185,129,0.3)', '0 0 0 12px rgba(16,185,129,0)', '0 0 0 0 rgba(16,185,129,0)'] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center"
          >
            <PenWriting className="w-4 h-4 text-emerald-400" />
          </motion.div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">Quiz Me</h1>
        </motion.div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Quiz bank aligned with the {CURRICULUM_FRAMEWORK}
        </p>
      </div>

      {view === 'quiz' && session && (
        <GlassCard hover={false} className="border-accent/20">
          <QuizRunner session={session} onExit={exitQuiz} onFinish={finishQuiz} />
        </GlassCard>
      )}

      {view === 'results' && session && outcomes && (
        <QuizResults
          session={session}
          results={outcomes.results}
          review={outcomes.review}
          showTopic={session.topicId === 'all'}
          onRetry={retryQuiz}
          onNewQuiz={newQuiz}
        />
      )}

      {view === 'setup' && (
        <SetupView
          subjectsQ={subjectsQ}
          indexQ={indexQ}
          topicsQ={topicsQ}
          gradeOptions={gradeOptions}
          grade={grade}
          step={step}
          usableSubjects={usableSubjects}
          subjectId={subjectId}
          topics={topics}
          topicId={topicId}
          availability={availability}
          count={count}
          starting={starting}
          selectedAvailability={selectedTopicAvailability}
          history={history}
          lastTest={history[0] || null}
          onPickGrade={pickGrade}
          onPickSubject={pickSubject}
          onPickTopic={pickTopic}
          onPickCount={setCount}
          onStart={startQuiz}
          onContinue={() => setStep((s) => Math.min(3, s + 1))}
          onJump={jumpTo}
          onRetryData={() => {
            subjectsQ.refetch();
            indexQ.refetch();
          }}
          onRetryTopics={() => topicsQ.refetch()}
        />
      )}
    </div>
  );
}

/* ── Setup wizard — one choice at a time: Grade → Subject → Topic → Questions ── */

const STEP_LABELS = ['Grade', 'Subject', 'Topic', 'Questions'];

/** Progress chips — completed steps stay clickable so students can re-choose. */
function StepBar(/** @type {any} */ { current, onJump }) {
  return (
    <div className="flex items-center gap-1 flex-wrap mb-4">
      {STEP_LABELS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
            <button
              type="button"
              disabled={i > current}
              onClick={() => done && onJump(i)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                active
                  ? 'border-accent/50 bg-accent/10 text-accent'
                  : done
                    ? 'border-border text-muted-foreground hover:text-foreground cursor-pointer'
                    : 'border-border/50 text-muted-foreground/40 cursor-default'
              }`}
            >
              {done && <Check className="w-3 h-3 text-accent" />}
              {label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/** Pops in once a choice is made — carries the student to the next step. */
function ContinueButton(/** @type {any} */ { onClick, label = 'Continue' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.18 }}
    >
      <Button size="sm" onClick={onClick} className="w-full h-9 text-sm">
        {label} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
      </Button>
    </motion.div>
  );
}

/** Setup flow: choose a grade → select a subject → choose a topic → pick a count → start. */
function SetupView(/** @type {any} */ {
  subjectsQ,
  indexQ,
  topicsQ,
  gradeOptions,
  grade,
  step,
  usableSubjects,
  subjectId,
  topics,
  topicId,
  availability,
  count,
  starting,
  selectedAvailability,
  history,
  lastTest,
  onPickGrade,
  onPickSubject,
  onPickTopic,
  onPickCount,
  onStart,
  onContinue,
  onJump,
  onRetryData,
  onRetryTopics,
}) {
  return (
    <>
      <StepBar current={step} onJump={onJump} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
          className="space-y-3"
        >
          {subjectsQ.error || indexQ.error ? (
            <GlassCard hover={false}>
              <div className="flex items-center gap-3 py-3">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{friendlyQuizError(subjectsQ.error || indexQ.error)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Check that /quiz_data/subjects.json and question_index.json are available.
                  </p>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onRetryData}>
                  Retry
                </Button>
              </div>
            </GlassCard>
          ) : (
            step === 0 ? (
              <>
                {indexQ.isLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Array(4).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-[88px] rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <GradePicker grades={gradeOptions} selected={grade} onSelect={onPickGrade} />
                )}
                <AnimatePresence>{grade != null && <ContinueButton key="grade-continue" onClick={onContinue} />}</AnimatePresence>
              </>
            ) : step === 1 ? (
              <>
                {subjectsQ.isLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Array(6).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-[76px] rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <SubjectPicker subjects={usableSubjects} selectedId={subjectId} onSelect={onPickSubject} />
                )}
                <AnimatePresence>{subjectId && <ContinueButton key="subject-continue" onClick={onContinue} />}</AnimatePresence>
              </>
            ) : step === 2 ? (
              <>
                {topicsQ.isLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {Array(6).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-24 rounded-md" />
                    ))}
                  </div>
                ) : topicsQ.error ? (
                  <GlassCard hover={false}>
                    <div className="flex items-center gap-3 py-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <p className="text-sm text-foreground flex-1">{friendlyQuizError(topicsQ.error)}</p>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onRetryTopics}>
                        Retry
                      </Button>
                    </div>
                  </GlassCard>
                ) : (
                  <TopicPicker topics={topics} availability={availability} selected={topicId} onSelect={onPickTopic} />
                )}
                <AnimatePresence>{topicId != null && <ContinueButton key="topic-continue" onClick={onContinue} />}</AnimatePresence>
              </>
            ) : (
              <CountPicker
                available={selectedAvailability}
                selected={count}
                onSelect={onPickCount}
                onStart={onStart}
                isStarting={starting}
              />
            )
          )}
        </motion.div>
      </AnimatePresence>

      {/* Last test — score + every question the student missed */}
      {lastTest && <LastTestCard entry={lastTest} />}

      {/* Recent results (localStorage history) */}
      {history.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-muted-foreground" /> Recent quizzes
          </h2>
          <div className="space-y-2">
            {history.slice(0, 3).map((h) => (
              <GlassCard key={h.id} className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-foreground truncate">
                      {h.subjectName} — {h.topicName}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {h.correct}/{h.total} correct
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-foreground tabular-nums">{h.percent}%</span>
                    <span className="text-[10px] text-accent font-medium flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" />+{h.xpEarned}
                    </span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </motion.div>
      )}
    </>
  );
}


/** XP + achievements — the same award pipeline as assignment completion. */
async function awardQuizXP(session, results, user) {
  try {
    const nextQuizzes = (user?.quizzes_completed || 0) + 1;
    const updatedXP = await awardXP(
      db,
      user,
      results.xpEarned,
      { quizzes_completed: nextQuizzes },
      'quiz_completion',
      `Quiz Me: ${session.subjectName} — ${session.topicName} (${results.percent}%)`,
      { subject: session.subjectId, topic: session.topicId, score: results.percent },
    );
    const uid = user?.id || user?.uid;
    if (uid) {
      await checkAchievements(uid, {
        ...user,
        total_xp: updatedXP,
        quizzes_completed: nextQuizzes,
        perfect_score: results.percent === 100,
      });
    }
  } catch (err) {
    console.warn('[quiz] XP award failed (non-critical):', err);
  }
}

