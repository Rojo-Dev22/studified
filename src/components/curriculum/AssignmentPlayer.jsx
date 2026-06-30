import React from 'react';
import { GraduationCap, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatSubject, formatGrade, CURRICULUM_FRAMEWORK } from '@/lib/subjects';
import CurriculumExerciseRunner from './CurriculumExerciseRunner';

export default function AssignmentPlayer({
  quest,
  interactive = false,
  onSaveExercise,
  onStart,
  onComplete,
  showActions = false,
  isPending = false,
}) {
  const content = quest.content || {};
  const exercises = content.exercises || [];
  const passed = quest.exercise_passed === true;

  return (
    <div className="rounded-xl border border-border bg-secondary/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-card/80">
        <div className="flex items-center gap-2 text-[10px] text-accent font-medium uppercase tracking-wide mb-1">
          <GraduationCap className="w-3 h-3" />
          Ethiopian Curriculum — In-app lesson
        </div>
        <p className="text-xs text-muted-foreground">
          {formatGrade(quest.grade)} · {formatSubject(quest.subject)} · {quest.unit || content.unit}
        </p>
        {content.reference && (
          <p className="text-[10px] text-muted-foreground mt-1 flex items-start gap-1">
            <FileText className="w-3 h-3 shrink-0 mt-0.5" />
            {content.reference}
          </p>
        )}
      </div>

      <div className="p-4 space-y-4">
        {content.introduction && (
          <p className="text-sm text-foreground/90 leading-relaxed">{content.introduction}</p>
        )}

        {content.objectives?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-foreground mb-2">Learning objectives</p>
            <ul className="space-y-1.5">
              {content.objectives.map((obj, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-accent font-bold">{i + 1}.</span>
                  {obj}
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.keyTerms?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {content.keyTerms.map((term) => (
              <span
                key={term}
                className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20"
              >
                {term}
              </span>
            ))}
          </div>
        )}

        {interactive && (
          <div className="border-t border-border pt-4">
            <CurriculumExerciseRunner
              exercises={exercises}
              savedAnswers={quest.exercise_answers || {}}
              savedSubmitted={quest.exercise_submitted}
              savedPassed={quest.exercise_passed}
              savedScore={quest.exercise_score}
              theme="assignment"
              onSaveProgress={(data) => onSaveExercise?.(quest, data)}
              readOnly={false}
            />
          </div>
        )}

        <p className="text-[10px] text-muted-foreground/80 border-t border-border pt-3">
          {CURRICULUM_FRAMEWORK}. Complete the verification quiz ({Math.ceil((exercises.length || 1) * 0.75)}+ correct) to earn XP.
        </p>

        {showActions && (
          <div className="flex gap-2 pt-1">
            {onStart && (
              <Button size="sm" onClick={onStart} disabled={isPending} className="h-8 text-xs">
                Start assignment
              </Button>
            )}
            {onComplete && (
              <Button
                size="sm"
                variant="outline"
                onClick={onComplete}
                disabled={isPending || !passed}
                className="h-8 text-xs border-accent/40"
              >
                {passed ? 'Claim XP — assignment complete' : 'Pass the quiz above to finish'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
