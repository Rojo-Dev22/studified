import React from 'react';
import { Users, GraduationCap, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatSubject, formatGrade, CURRICULUM_FRAMEWORK } from '@/lib/subjects';
import CurriculumExerciseRunner from './CurriculumExerciseRunner';

export default function ChallengePlayer({
  raid,
  interactive = false,
  onSaveExercise,
  onJoin,
  onComplete,
  showActions = false,
  isJoined = false,
  isPending = false,
}) {
  const content = raid.content || {};
  const exercises = content.exercises || [];
  const passed = raid.exercise_passed === true;

  return (
    <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-card overflow-hidden">
      <div className="px-4 py-3 border-b border-blue-500/20">
        <div className="flex items-center gap-2 text-[10px] text-blue-400 font-medium uppercase tracking-wide mb-1">
          <GraduationCap className="w-3 h-3" />
          Group challenge — verified completion
        </div>
        <p className="text-xs text-muted-foreground">
          {formatGrade(raid.grade)} · {formatSubject(raid.subject)}
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

        {content.groupRules?.length > 0 && (
          <div className="rounded-lg bg-blue-500/5 border border-blue-500/15 p-3">
            <p className="text-[10px] font-medium text-blue-300 mb-1.5 flex items-center gap-1">
              <Users className="w-3 h-3" /> Group rules
            </p>
            <ul className="text-[10px] text-muted-foreground space-y-1">
              {content.groupRules.map((rule, i) => (
                <li key={i}>· {rule}</li>
              ))}
            </ul>
          </div>
        )}

        {content.activities?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-foreground mb-2">In-class group activities</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {content.activities.map((act) => (
                <li key={act.id} className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  {act.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {interactive && isJoined && (
          <div className="border-t border-blue-500/20 pt-4">
            <CurriculumExerciseRunner
              exercises={exercises}
              savedAnswers={raid.exercise_answers || {}}
              savedSubmitted={raid.exercise_submitted}
              savedPassed={raid.exercise_passed}
              savedScore={raid.exercise_score}
              theme="challenge"
              onSaveProgress={(data) => onSaveExercise?.(raid, data)}
            />
          </div>
        )}

        {interactive && !isJoined && (
          <p className="text-xs text-muted-foreground text-center py-2">Join to unlock the verification quiz.</p>
        )}

        <p className="text-[10px] text-muted-foreground/80">{CURRICULUM_FRAMEWORK}</p>

        {showActions && (
          <div className="flex gap-2">
            {onJoin && !isJoined && (
              <Button
                type="button"
                size="sm"
                onClick={onJoin}
                disabled={isPending}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-500"
              >
                Join challenge
              </Button>
            )}
            {onComplete && isJoined && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onComplete}
                disabled={isPending || !passed}
                className="h-8 text-xs border-blue-400/40"
              >
                {passed ? 'Complete challenge & earn XP' : 'Pass the quiz to finish'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
