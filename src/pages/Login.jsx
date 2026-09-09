import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import AuthForm from '@/components/auth/AuthForm';
import AquariumBackground from '@/components/hero/AquariumBackground';
import { useAuth } from '@/lib/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookOpen, Trophy, Sparkles, ArrowLeft, UserPlus, GraduationCap, Zap, Award, User } from '@/components/ui/icons';

/**
 * Dedicated Separate Login Page
 * Conforms to AXO_AAA_Scroll_Hero_Implementation_Spec.md §15 & §16:
 * - Separate page & route (/login)
 * - Preserves existing AuthForm functionality and Firebase integration
 * - Cohesive with aquarium design language
 * - Fully accessible with clear navigation back to the hero/landing page
 */

export default function Login() {
  const { isAuthenticated, dbReady, isLoadingAuth, authError } = useAuth();
  const [mode, setMode] = useState('login');

  if (isAuthenticated && dbReady && !isLoadingAuth) {
    return <Navigate to="/dashboard" replace />;
  }

  // Icons configuration based on mode
  const leftIcon = mode === 'login' ? BookOpen : UserPlus;
  const rightIcon = mode === 'login' ? Trophy : Sparkles;
  const leftIconColor = mode === 'login' ? 'text-accent' : 'text-[#52B788]';
  const rightIconColor = mode === 'login' ? 'text-[#52B788]' : 'text-accent';

  return (
    <div className="dark min-h-screen text-foreground relative flex flex-col justify-between overflow-x-hidden">
      {/* 2D Aquarium Atmosphere */}
      <AquariumBackground />

      {/* Top Navigation (scales down with the viewport) */}
      <header className="relative z-10 mx-2.5 sm:mx-5 md:mx-10 mt-2.5 sm:mt-5 flex items-center justify-between gap-2 px-3 sm:px-5 md:px-8 py-2 sm:py-3 md:py-3.5 rounded-xl sm:rounded-2xl border border-white/10 bg-background/40 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 group shrink-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md sm:rounded-lg bg-foreground flex items-center justify-center transition-transform group-hover:scale-105">
            <span className="text-background text-[10px] sm:text-[11px] md:text-xs font-bold">S</span>
          </div>
          <span className="text-sm sm:text-[15px] md:text-base font-semibold tracking-tight">Studified</span>
        </Link>

        <Link
          to="/"
          className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-muted-foreground hover:text-accent transition-colors py-1 px-2 sm:px-3 rounded-lg hover:bg-white/5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative w-full max-w-md"
        >
          {/* Subtle Ambient Aura Glow */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-accent/30 via-emerald-500/10 to-blue-500/20 blur-2xl opacity-60" />

          {/* Floating Icons surrounding the container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`left-${mode}`}
              initial={{ opacity: 0, scale: 0.5, rotate: mode === 'login' ? -180 : 180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: mode === 'login' ? 180 : -180 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              whileHover={{ scale: 1.15, y: -4 }}
              className={`absolute -left-5 -top-5 z-20 hidden md:flex w-11 h-11 rounded-xl border border-white/10 bg-background/50 backdrop-blur-md items-center justify-center shadow-lg ${leftIconColor} icon-bounce-left cursor-pointer`}
            >
              {React.createElement(leftIcon, { className: "w-5 h-5" })}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`right-${mode}`}
              initial={{ opacity: 0, scale: 0.5, rotate: mode === 'login' ? 180 : -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: mode === 'login' ? -180 : 180 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              whileHover={{ scale: 1.15, y: -4 }}
              className={`absolute -right-5 -bottom-4 z-20 hidden md:flex w-11 h-11 rounded-xl border border-white/10 bg-background/50 backdrop-blur-md items-center justify-center shadow-lg ${rightIconColor} icon-bounce-right cursor-pointer`}
            >
              {React.createElement(rightIcon, { className: "w-5 h-5" })}
            </motion.div>
          </AnimatePresence>

          {/* Authentication Container (coin with two faces) */}
          <motion.div
            className="relative"
            style={{ perspective: 1200 }}
          >
            {/* Coin body — fixed shape; faces carry backgrounds/borders */}
            <motion.div
              animate={{ rotateY: mode === 'login' ? 0 : 180 }}
              transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
              className="relative rounded-2xl border border-white/10 shadow-2xl"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front face — Login */}
              <div className="relative flex flex-col rounded-2xl border border-white/10 bg-background p-6 sm:p-8 shadow-2xl" style={{ backfaceVisibility: 'hidden' }}>
                <div className="mb-5 flex items-center justify-center gap-2.5">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-accent/40 to-accent/10 border border-accent/30 shadow-sm">
                    <BookOpen className="w-4.5 h-4.5 text-accent" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/80">Sign in</span>
                </div>

                <div className="mb-6 text-center">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Welcome back</h1>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Sign in to pick up where you left off with your lessons, quests, and study streak.
                  </p>
                </div>

                {authError?.message && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTitle>Authentication notice</AlertTitle>
                    <AlertDescription>{authError.message}</AlertDescription>
                  </Alert>
                )}

                {/* Preserved Authentic AuthForm */}
                <AuthForm mode={mode} onModeChange={setMode} />
              </div>

              {/* Back face — Signup */}
              <div
                className="absolute inset-0 flex flex-col rounded-2xl border border-white/10 bg-background p-6 sm:p-8 shadow-2xl"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="mb-5 flex items-center justify-center gap-2.5">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 shadow-sm">
                    <GraduationCap className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/80">Create account</span>
                </div>

                <div className="mb-6 text-center">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Join Studified</h1>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Sign up in seconds and get your own MoE lesson tracker, quests, and AXO study companion.
                  </p>
                </div>

                {authError?.message && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTitle>Authentication notice</AlertTitle>
                    <AlertDescription>{authError.message}</AlertDescription>
                  </Alert>
                )}

                {/* Preserved Authentic AuthForm */}
                <AuthForm mode={mode} onModeChange={setMode} />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-5 py-6 text-center text-[11px] text-muted-foreground">
        Studified · Ethiopian General Education Curriculum (MoE) · Grades 9–12
      </footer>
    </div>
  );
}
