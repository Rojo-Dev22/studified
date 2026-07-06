import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Lock, Unlock, AlertCircle, Flame, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GlassCard from '../components/ui/GlassCard';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { awardXP } from '@/lib/xpRewards';
import { checkAchievements } from '@/lib/achievementChecker';
import { db } from '@/lib/db';


const Sparks = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-accent rounded-full blur-[0.5px]"
          initial={{ 
            x: Math.random() * 120 - 60, 
            y: 80, 
            opacity: 0,
            scale: 0.5 
          }}
          animate={{ 
            y: -120, 
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.3, 0.3]
          }}
          transition={{ 
            duration: Math.random() * 2 + 2.5, 
            repeat: Infinity, 
            delay: i * 0.45,
            ease: 'easeOut'
          }}
          style={{ left: '50%', top: '50%' }}
        />
      ))}
    </div>
  );
};

export default function Focus() {
  const queryClient = useQueryClient();
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => db.auth.me() });

  const [duration, setDuration] = useState(25);
  const [subject, setSubject] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [focusLocked, setFocusLocked] = useState(true);
  const [distractions, setDistractions] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const intervalRef = useRef(null);
  const elapsedRef = useRef(0);
  const movementWindowRef = useRef([]);
  const lastMouseRef = useRef(null);
  const endingRef = useRef(false);
  const stopSessionRef = useRef(null);

  useEffect(() => {
    if (!isRunning || !focusLocked) return;
    const handleVisibility = () => {
      if (document.hidden) {
        setIsPaused(true);
        setDistractions(d => d + 1);
        toast.warning('Tab switched — timer paused.');
      } else {
        setIsPaused(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isRunning, focusLocked]);

  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(intervalRef.current); handleComplete(); return 0; }
          return t - 1;
        });
        elapsedRef.current += 1;
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused]);

  const startSession = useCallback(async () => {
    const session = await db.entities.FocusSession.create({
      duration_minutes: duration, subject: subject || 'General study', status: 'active',
    });
    setSessionId(session.id);
    setTimeLeft(duration * 60);
    setIsRunning(true);
    setIsPaused(false);
    setDistractions(0);
    elapsedRef.current = 0;
    movementWindowRef.current = [];
    lastMouseRef.current = null;
    endingRef.current = false;
  }, [duration, subject]);

  const handleComplete = useCallback(async () => {
    setIsRunning(false);
    const actualMinutes = Math.round(elapsedRef.current / 60);
    const xpEarned = Math.floor(actualMinutes * 4);
    if (sessionId) {
      await db.entities.FocusSession.update(sessionId, { status: 'completed', actual_minutes: actualMinutes, xp_earned: xpEarned, distraction_count: distractions });
    }
    if (user && xpEarned > 0) {
      await awardXP(
        db, 
        user, 
        xpEarned, 
        {
          focus_hours: (user.focus_hours || 0) + (actualMinutes / 60),
        },
        'focus_session',
        `Focused for ${actualMinutes} minutes on ${subject || 'General study'}`,
        { sessionId, subject: subject || 'General study', duration: actualMinutes, distractions }
      );

      // Check achievements
      if (user?.id || user?.uid) {
        const uid = user.id || user.uid;
        const userStats = {
          ...user,
          focus_hours: (user.focus_hours || 0) + (actualMinutes / 60),
          focus_sessions: (user.focus_sessions || 0) + 1,
        };
        await checkAchievements(uid, userStats);
      }
    }
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    queryClient.invalidateQueries({ queryKey: ['recentSessions'] });
    toast.success(`Session complete! +${xpEarned} XP`);

    // Confetti shower
    confetti({
      particleCount: 160,
      spread: 90,
      origin: { y: 0.65 },
      colors: ['#10b981', '#34d399', '#6ee7b7', '#3b82f6', '#8b5cf6', '#ffffff'],
      disableForReducedMotion: true
    });
  }, [sessionId, distractions, user, queryClient, subject]);

  const stopSession = useCallback(async (reason) => {
    if (endingRef.current) return;
    endingRef.current = true;
    setIsRunning(false);
    clearInterval(intervalRef.current);
    const actualMinutes = Math.round(elapsedRef.current / 60);
    const xpEarned = Math.floor(actualMinutes * 2);
    if (sessionId) {
      await db.entities.FocusSession.update(sessionId, {
        status: reason === 'movement' ? 'failed' : 'abandoned',
        actual_minutes: actualMinutes,
        xp_earned: xpEarned,
        distraction_count: distractions,
      });
    }
    if (user && xpEarned > 0) {
      await awardXP(
        db, 
        user, 
        xpEarned, 
        {},
        'focus_session',
        `Partial focus session: ${actualMinutes} minutes on ${subject || 'General study'}`,
        { sessionId, subject: subject || 'General study', duration: actualMinutes, distractions, reason }
      );
    }
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    queryClient.invalidateQueries({ queryKey: ['recentSessions'] });
    if (reason === 'movement') {
      toast.error('Too much cursor movement — focus session ended.');
    } else {
      toast('Session ended. Partial XP saved.');
    }
    setTimeLeft(0);
    setSessionId(null);
    movementWindowRef.current = [];
    lastMouseRef.current = null;
    endingRef.current = false;
  }, [sessionId, distractions, user, queryClient, subject]);

  stopSessionRef.current = stopSession;

  useEffect(() => {
    if (!isRunning || isPaused) {
      movementWindowRef.current = [];
      lastMouseRef.current = null;
      return;
    }

    const WINDOW_MS = 5000;
    const THRESHOLD_PX = 900;

    const onMouseMove = (e) => {
      if (endingRef.current) return;
      const now = Date.now();
      if (!lastMouseRef.current) {
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        return;
      }
      const delta = Math.hypot(e.clientX - lastMouseRef.current.x, e.clientY - lastMouseRef.current.y);
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      movementWindowRef.current.push({ t: now, delta });
      movementWindowRef.current = movementWindowRef.current.filter((m) => now - m.t <= WINDOW_MS);
      const total = movementWindowRef.current.reduce((sum, m) => sum + m.delta, 0);
      if (total >= THRESHOLD_PX) {
        stopSessionRef.current?.('movement');
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [isRunning, isPaused]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalSeconds = duration * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) : 0;
  const circumference = 2 * Math.PI * 88;

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatedBackground colors={['emerald']} orbs={2} grid={true} />
      <div className="relative z-10 p-5 md:p-8 max-w-md mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2.5 mb-6">
          <motion.div
            animate={{ boxShadow: ['0 0 0 0 rgba(16,185,129,0.3)', '0 0 0 12px rgba(16,185,129,0)', '0 0 0 0 rgba(16,185,129,0)'] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center"
          >
            <Flame className="w-4 h-4 text-emerald-400" />
          </motion.div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Focus Timer</h1>
            <p className="text-[10px] text-muted-foreground font-medium tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400/60" />
              Pomodoro sessions with XP rewards
            </p>
          </div>
        </motion.div>

      {/* Timer Display Area */}
      <div className="flex flex-col items-center mb-6 relative">
        {/* Breathing aura visualizer */}
        {isRunning && !isPaused && (
          <motion.div
            className="absolute w-56 h-56 rounded-full bg-accent/15 blur-3xl pointer-events-none"
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.35, 0.75, 0.35],
            }}
            transition={{
              duration: 8, // 8-second breathing cycle
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        <div className="relative w-52 h-52 mb-5 flex items-center justify-center">
          {/* Animated floating particles inside timer area */}
          {isRunning && !isPaused && <Sparks />}

          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
            <defs>
              <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Background track circle */}
            <circle cx="100" cy="100" r="88" fill="none" stroke="hsl(var(--secondary))" strokeWidth="4.5" />
            
            {/* Active glowing ring */}
            <circle
              cx="100" cy="100" r="88"
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              filter={isRunning && !isPaused ? 'url(#glow-filter)' : undefined}
              className="transition-all duration-1000"
            />
          </svg>
          
          <div className="relative z-10 flex flex-col items-center justify-center select-none">
            <motion.span 
              className="text-4xl font-bold tabular-nums text-foreground tracking-tight"
              animate={isRunning && !isPaused ? { scale: [1, 1.025, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </motion.span>
            
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1.5">
              {isRunning ? (isPaused ? 'paused' : `${distractions} switch${distractions !== 1 ? 'es' : ''}`) : 'ready'}
            </span>
          </div>
        </div>

        {/* iPhone-style Time Picker */}
        {!isRunning && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="flex items-center gap-3 bg-secondary/60 border border-border/80 rounded-2xl p-3 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setDuration(prev => Math.max(15, prev - 5))}
                className="w-10 h-10 rounded-full bg-background/80 border border-border hover:border-accent/40 hover:bg-accent/5 flex items-center justify-center transition-all active:scale-95"
              >
                <ChevronDown className="w-5 h-5 text-foreground" />
              </button>
              
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="text-3xl font-bold tabular-nums text-foreground">{duration}</span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">minutes</span>
              </div>
              
              <button
                type="button"
                onClick={() => setDuration(prev => Math.min(120, prev + 5))}
                className="w-10 h-10 rounded-full bg-background/80 border border-border hover:border-accent/40 hover:bg-accent/5 flex items-center justify-center transition-all active:scale-95"
              >
                <ChevronUp className="w-5 h-5 text-foreground" />
              </button>
            </div>
            
            {/* Quick time presets */}
            <div className="flex gap-2 mt-2.5 justify-center">
              {[15, 30, 45, 60, 90, 120].map(time => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setDuration(time)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    duration === time
                      ? 'bg-accent/20 text-accent border border-accent/40 shadow-sm'
                      : 'bg-secondary/40 text-muted-foreground border border-border hover:text-foreground hover:border-border/80'
                  }`}
                >
                  {time >= 60 ? `${time / 60}h` : `${time}m`}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Paused Warning Alert */}
        <AnimatePresence>
          {isPaused && isRunning && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/80 border border-border/80 backdrop-blur-md rounded-lg px-3 py-2 mb-4"
            >
              <AlertCircle className="w-3.5 h-3.5 text-accent" />
              Tab switched — return to resume
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control panel */}
      {!isRunning ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard hover={false} className="space-y-4 shadow-md border-border/80">
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block mb-1.5">What are you studying?</label>
              <Input 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Calculus, History essay..." 
                className="bg-secondary/60 border-border text-sm h-9 px-3 rounded-md focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all" 
              />
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFocusLocked(!focusLocked)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-all duration-300 font-medium
                  ${focusLocked 
                    ? 'border-accent/40 bg-accent/5 text-accent shadow-[0_0_10px_rgba(16,185,129,0.05)]' 
                    : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'}`}
              >
                {focusLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                Focus lock {focusLocked ? 'on' : 'off'}
              </motion.button>
              
              <Button onClick={startSession} className="bg-foreground text-background hover:bg-foreground/90 h-9 text-sm px-6 font-semibold shadow-md">
                <Play className="w-3.5 h-3.5 mr-1.5 fill-background" /> Start
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      ) : (
        <div className="flex justify-center gap-3">
          <Button onClick={() => setIsPaused(!isPaused)} variant="outline" className="border-border/80 h-9 text-sm px-5 bg-card hover:bg-secondary transition-colors">
            {isPaused ? <Play className="w-3.5 h-3.5 mr-1.5" /> : <Pause className="w-3.5 h-3.5 mr-1.5" />}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button onClick={() => stopSession()} variant="outline" className="border-border/80 h-9 text-sm px-5 text-muted-foreground hover:text-foreground bg-card hover:bg-secondary transition-colors">
            <Square className="w-3.5 h-3.5 mr-1.5" /> Stop
          </Button>
        </div>
      )}
      </div>
    </div>
  );
}