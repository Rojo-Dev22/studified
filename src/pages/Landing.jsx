import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Zap,
  Sparkles,
  Timer,
  Trophy,
  ChevronRight,
  Users,
  CheckCircle2,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import AxolotlFullBody, { AXO_STATES } from '@/components/axo/AxolotlFullBody';
import AquariumBackground from '@/components/hero/AquariumBackground';

/**
 * Scroll-Driven 2D Axolotl Hero & Aquarium Journey
 * Built strictly to AXO_AAA_Scroll_Hero_Implementation_Spec.md:
 * - 2D Axolotl companion with continuous curved swimming trajectory
 * - Alternating visual balance across sections (Right -> Left -> Right -> Left -> CTA)
 * - True swimming physics (tail propulsion, limb paddling, fluttering gills, banking turns)
 * - Final CTA sequence: Axolotl revolves around the CTA container like the moon
 *   around the Earth — sweeping in FRONT of the frosted card, then BEHIND it
 * - Clean navigation boundary: Navigates to dedicated /login route
 * - Preserves existing site color palette, dark theme, and typography
 */

/**
 * Rate-limits a scroll-driven motion value: the output chases the source at no
 * more than `maxPerSecond` progress-units per second, then a critically-damped
 * spring keeps the chase organic (damping ≈ 2·√stiffness → no overshoot, so
 * velocity stays bounded by the cap). Fast scrolling only queues up more
 * distance — it can never make the swim, the turns, or the reveals move
 * faster than the capped pace.
 */
function useCappedProgress(source, maxPerSecond) {
  const target = useMotionValue(source.get());
  const smooth = useSpring(target, { stiffness: 170, damping: 26, mass: 1 });

  useEffect(() => {
    let rafId;
    let last = performance.now();
    let goal = source.get();
    let firstChange = true;

    const unsub = source.on('change', (v) => {
      if (firstChange) {
        // The very first measurement (e.g. the page was restored mid-scroll on
        // refresh) snaps into place instead of replaying the whole journey.
        firstChange = false;
        goal = v;
        target.set(v);
        if (typeof smooth.jump === 'function') smooth.jump(v);
        else smooth.set(v);
        return;
      }
      goal = v;
    });

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const cur = target.get();
      const delta = goal - cur;
      if (delta !== 0) {
        const maxStep = maxPerSecond * dt;
        target.set(Math.abs(delta) <= maxStep ? goal : cur + Math.sign(delta) * maxStep);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      unsub();
      cancelAnimationFrame(rafId);
    };
  }, [source, target, smooth, maxPerSecond]);

  return smooth;
}

export default function Landing() {
  const { isAuthenticated, dbReady, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Redirect if already authenticated
  if (isAuthenticated && dbReady && !isLoadingAuth) {
    return <Navigate to="/dashboard" replace />;
  }

  // Detect reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQueryMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQueryMotion.matches);
    const handleMotionChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQueryMotion.addEventListener('change', handleMotionChange);

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      mediaQueryMotion.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // ── Scroll Progress Tracking Across the Entire Underwater Journey ─────────
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // ── Velocity-Capped Scroll Progress ────────────────────────────────────────
  // However fast the user scrolls (flicks, fast wheel, End key), the journey
  // only advances at the pace of a normal scroll — the "current" speed. Fast
  // scrolling queues up more distance but never accelerates the animation.
  // The fade-in reveals below use fixed-duration whileInView animations, so
  // they stay identical at any scroll speed as well.
  const MAX_PROGRESS_PER_SECOND = 0.24;
  const smoothProgress = useCappedProgress(scrollYProgress, MAX_PROGRESS_PER_SECOND);

  // ── S-Curve Path Interpolation (Continuous Journey) ───────────────────────
  // Travel windows take ~10% of the (velocity-capped) journey each: the axolotl
  // dashes to the opposite edge at the SAME capped pace every time — never
  // faster, no matter how hard the user scrolls — then dwells at its perch.
  // Section 1 (0.00 - 0.08): Hero Initial -> Axolotl at RIGHT (~74%)
  // Transition 1->2 (0.08 - 0.18): dash down to LEFT (~22%)
  // Section 2 (0.18 - 0.42): MoE Lessons -> Axolotl settled at LEFT (~22%)
  // Transition 2->3 (0.42 - 0.52): dash across to RIGHT (~76%)
  // Section 3 (0.52 - 0.62): AXO AI -> Axolotl settled at RIGHT (~76%)
  // Transition 3->4 (0.62 - 0.72): dash to LEFT (~24%)
  // Section 4 (0.72 - 0.88): Focus & Raids -> Axolotl settled at LEFT (~24%)
  // Section 5 (0.88 - 1.00): Final CTA -> Swims to CENTER and enters orbit

  const rawX = useTransform(
    smoothProgress,
    [0.0, 0.08, 0.13, 0.18, 0.42, 0.47, 0.52, 0.62, 0.72, 0.88, 1.0],
    isMobile
      ? [70, 68, 50, 28, 28, 52, 70, 50, 30, 50, 50]
      : [74, 72, 48, 22, 22, 50, 76, 50, 24, 50, 50]
  );

  const rawY = useTransform(
    smoothProgress,
    [0.0, 0.08, 0.13, 0.18, 0.42, 0.47, 0.52, 0.62, 0.72, 0.88, 1.0],
    isMobile
      ? [44, 42, 48, 46, 44, 50, 46, 48, 46, 50, 50]
      : [48, 45, 54, 50, 48, 54, 50, 52, 48, 50, 50]
  );

  // Pitch diving angle (degrees): dips down when diving, levels off when settling
  const rawAngle = useTransform(
    smoothProgress,
    [0.0, 0.07, 0.12, 0.17, 0.36, 0.44, 0.49, 0.54, 0.62, 0.72, 0.84, 0.90, 1.0],
    [0, 8, 24, -6, 0, -8, -24, 6, 0, 18, -6, 0, 0]
  );

  // Swim speed factor: bursts to full speed on transitions, calms when arriving
  const rawSpeed = useTransform(
    smoothProgress,
    [0.0, 0.07, 0.13, 0.18, 0.42, 0.47, 0.52, 0.62, 0.72, 0.88, 1.0],
    [0.15, 1.0, 1.0, 0.3, 1.0, 1.0, 0.3, 1.0, 1.0, 0.55, 0.55]
  );

  // Hydrodynamic spring physics — the capped progress already bounds velocity,
  // so these springs are ~critically damped: they smooth the chase without
  // ever overshooting or exceeding the capped pace.
  const springX = useSpring(rawX, { stiffness: 210, damping: 30 });
  const springY = useSpring(rawY, { stiffness: 210, damping: 30 });
  const springAngle = useSpring(rawAngle, { stiffness: 160, damping: 26 });
  const springSpeed = useSpring(rawSpeed, { stiffness: 160, damping: 26 });

  // ── Content Reveal Strategy ────────────────────────────────────────────────
  // Text blocks reveal via viewport intersection (whileInView) instead of
  // fragile scroll-percentage gates, so text ALWAYS appears when scrolled to.
  // Blank spacer sections give the axolotl empty water to swim across before
  // each text block fades in on the opposite edge (Right -> Left -> Right...).

  // ── Orbit Animation for Section 5 (Lunar CTA Orbit) ────────────────────────
  // AXO revolves around the "Ready to start your journey?" container like the
  // moon revolves around the Earth: it sweeps across the FRONT of the frosted
  // card on the near (lower) half of the orbit, then slips BEHIND the glass on
  // the far (upper) half — shrinking and dimming with distance for true depth.
  const ctaCardRef = useRef(null);
  const [orbitOffset, setOrbitOffset] = useState({ x: 0, y: 0, angle: 0, facingRight: true, behind: false });
  const [scrollP, setScrollP] = useState(0);

  useEffect(() => {
    const unsub = smoothProgress.on('change', (v) => setScrollP(v));
    return () => unsub();
  }, [smoothProgress]);

  const isInOrbitZone = scrollP >= 0.90;

  useEffect(() => {
    if (!isInOrbitZone || prefersReducedMotion) {
      setOrbitOffset({ x: 0, y: 0, angle: 0, facingRight: false, behind: false });
      return;
    }

    let rafId;
    const startTime = performance.now();
    const orbitPeriod = 6000; // 6s per lap — slow, stately, lunar

    const loop = (now) => {
      const elapsed = (now - startTime) % orbitPeriod;
      const phi = (elapsed / orbitPeriod) * Math.PI * 2;

      // Center the orbit on the CTA container itself, tracked live so AXO
      // follows the card while it glides into place during the final scroll
      const card = ctaCardRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let cx = vw / 2;
      let cy = vh / 2;
      let cardW = isMobile ? 340 : 672;
      let cardH = isMobile ? 440 : 480;
      if (card) {
        const rect = card.getBoundingClientRect();
        cx = rect.left + rect.width / 2;
        cy = rect.top + rect.height / 2;
        cardW = rect.width;
        cardH = rect.height;
      }

      // Radii hug the card so the orbit visibly crosses its face (moon ↔ Earth)
      const rx = isMobile
        ? Math.min(cardW / 2 + 8, vw / 2 - 100)
        : Math.min(cardW / 2 + 14, vw / 2 - 120);
      const ry = Math.min(cardH / 2 + 34, vh / 2 - 110);

      // Position on the orbit ellipse (positive y = near/front side of card)
      const ox = Math.cos(phi) * rx;
      const oy = Math.sin(phi) * ry;
      const behind = Math.sin(phi) < 0; // upper half = far side (behind the card)

      // Tangent vector to follow the curve
      const dx = -Math.sin(phi) * rx;
      const dy = Math.cos(phi) * ry;
      let tangentDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

      // Axolotl facing logic during orbit
      const facing = dx >= 0;
      if (!facing) {
        tangentDeg = tangentDeg > 0 ? tangentDeg - 180 : tangentDeg + 180;
      }

      setOrbitOffset({
        // Offsets are applied from the viewport center (the fixed companion
        // layer), so rebase the live card center into that coordinate space
        x: cx - vw / 2 + ox,
        y: cy - vh / 2 + oy,
        angle: tangentDeg * 0.45, // soften tilt for elegant aquatic banking
        facingRight: facing,
        behind,
      });

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [isInOrbitZone, isMobile, prefersReducedMotion]);

  // Determine facing direction along the scroll path
  // When in Section 1 (0 to 0.35): travels left or faces left
  // When in Section 2->3 (0.35 to 0.70): travels right or faces right
  // When in Section 3->4 (0.70 to 0.90): travels left or faces left
  const pathFacingRight = scrollP > 0.38 && scrollP < 0.72;
  const currentFacingRight = isInOrbitZone ? orbitOffset.facingRight : pathFacingRight;
  const currentAngle = isInOrbitZone ? orbitOffset.angle : springAngle.get();
  const currentState = isInOrbitZone
    ? AXO_STATES.ORBITING
    : springSpeed.get() > 0.45
      ? AXO_STATES.SWIMMING
      : AXO_STATES.IDLE;

  return (
    <div
      ref={containerRef}
      className="dark relative min-h-[500vh] text-foreground selection:bg-accent/30 overflow-x-clip"
    >
      {/* ─── Living 2D Aquarium Environment ─────────────────────────────── */}
      <AquariumBackground />

      {/* ─── Persistent Sticky Underwater Companion Layer ────────────────── */}
      {/* Follows visitor across the entire scroll journey without teleporting */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: orbitOffset.behind ? 5 : 20 }}
      >
        <motion.div
          className="absolute"
          style={{
            left: useTransform(springX, (v) => `calc(${v}% + ${isInOrbitZone ? orbitOffset.x : 0}px)`),
            top: useTransform(springY, (v) => `calc(${v}% + ${isInOrbitZone ? orbitOffset.y : 0}px)`),
            x: '-50%',
            y: '-50%',
          }}
        >
          {/* Depth illusion: AXO shrinks & dims as it passes behind the card */}
          <motion.div
            initial={false}
            animate={{
              scale: orbitOffset.behind ? 0.8 : 1,
              opacity: orbitOffset.behind ? 0.55 : 1,
            }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
          >
            <AxolotlFullBody
              state={currentState}
              swimSpeed={isInOrbitZone ? 0.85 : springSpeed.get()}
              facingRight={currentFacingRight}
              angle={currentAngle}
              size={isMobile ? 170 : 230}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* ─── Top Header Navigation (scales down with the viewport) ────────── */}
      <header className="fixed top-0 left-0 right-0 z-30 mx-2.5 sm:mx-4 md:mx-10 mt-2.5 sm:mt-4 flex items-center justify-between gap-2 px-3 sm:px-5 md:px-8 py-2 sm:py-3 md:py-3.5 rounded-xl sm:rounded-2xl border border-white/10 bg-background/40 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 group shrink-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md sm:rounded-lg bg-foreground flex items-center justify-center transition-transform group-hover:scale-105">
            <span className="text-background text-[10px] sm:text-[11px] md:text-xs font-bold">S</span>
          </div>
          <span className="text-sm sm:text-[15px] md:text-base font-semibold tracking-tight">Studified</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <Link
            to="/login"
            className="text-[11px] sm:text-xs text-muted-foreground hover:text-accent transition-colors py-1 sm:py-1.5 px-2 sm:px-3 rounded-lg hover:bg-white/5"
          >
            Jump to sign in →
          </Link>
          <Button
            size="sm"
            onClick={() => navigate('/login')}
            className="hidden sm:inline-flex h-7 md:h-8 px-3 md:px-4 text-[11px] md:text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Sign in
          </Button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — Initial Hero (Text LEFT, Axolotl RIGHT)
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center px-5 md:px-12 pt-24 pb-16">
        <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-12 gap-8 items-center">
          {/* Content on LEFT (6 cols) — `relative` so z-10 stacks it above section siblings */}
          <motion.div
            className="lg:col-span-6 relative z-10"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.12] tracking-tight">
              Study smarter.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-emerald-400 to-[#74C69D]">
                Level up
              </span>{' '}
              your grades.
            </h1>

            <p className="text-muted-foreground mt-5 text-sm sm:text-base max-w-lg leading-relaxed">
              Meet your curriculum companion. MoE lessons, interactive assignments, AI study quizzes,
              and focus streaks — all designed to make learning engaging and rewarding.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 mt-8">
              <a
                href="#lessons"
                className="inline-flex items-center justify-center h-11 px-5 rounded-md border border-white/10 bg-background/30 backdrop-blur-md text-sm font-medium hover:bg-background/50 transition-colors"
              >
                Explore journey
              </a>
            </div>

            {/* Curriculum Stats Banner */}
            <div className="grid grid-cols-3 gap-3 mt-10 pt-6 border-t border-white/10 max-w-md">
              {[
                { count: '20+', label: 'MoE Units' },
                { count: '100%', label: 'Aligned' },
                { count: '∞', label: 'AXO AI Help' },
              ].map((stat, i) => (
                <div key={i}>
                  <p className="text-xl sm:text-2xl font-bold text-accent">{stat.count}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right column: Companion visual space */}
          <div className="hidden lg:block lg:col-span-6 h-96 relative" aria-hidden="true" />
        </div>
      </section>

      {/* ─── Blank Swim Spacer: axolotl crosses empty water to the LEFT edge ── */}
      <div className="h-[85vh] pointer-events-none" aria-hidden="true" />

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — MoE Curriculum (Axolotl LEFT, Content RIGHT)
          ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="lessons"
        className="relative min-h-screen flex items-center px-5 md:px-12 py-20"
      >
        <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-12 gap-10 items-center">
          {/* Left space for settled Axolotl */}
          <div className="hidden lg:block lg:col-span-5 h-80 relative" aria-hidden="true" />

          {/* Content on RIGHT (7 cols) — revealed once the axolotl has arrived left */}
          <motion.div
            className="lg:col-span-7 relative z-10"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent mb-5">
              <BookOpen className="w-6 h-6" />
            </div>

            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
              Master every unit of the <span className="text-accent">MoE syllabus</span>.
            </h2>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base leading-relaxed max-w-xl">
              Studified translates your textbooks into modular, interactive study lessons. Complete
              comprehension quizzes after each topic to lock in your understanding and earn XP.
            </p>

            {/* Feature Cards Grid */}
            <div className="grid sm:grid-cols-2 gap-3.5 mt-8">
              {[
                {
                  title: 'Official Curriculum',
                  desc: 'Structured units for Biology, Chemistry, Physics, and Math.',
                },
                {
                  title: 'Interactive Quizzes',
                  desc: 'Instant verification with clear step-by-step explanations.',
                },
                {
                  title: 'Tracked Mastery',
                  desc: 'Visualize topic completion and weaknesses before exam day.',
                },
                {
                  title: 'Offline-First Cache',
                  desc: 'Study smoothly even with fluctuating internet connections.',
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-background/30 backdrop-blur-md p-4 hover:border-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <h3 className="text-sm font-semibold">{card.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-6">{card.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Blank Swim Spacer: axolotl crosses empty water to the RIGHT edge ─ */}
      <div className="h-[85vh] pointer-events-none" aria-hidden="true" />

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — AXO AI Companion (Content LEFT, Axolotl RIGHT)
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center px-5 md:px-12 py-20">
        <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-12 gap-10 items-center">
          {/* Content on LEFT (7 cols) — revealed once the axolotl has arrived right */}
          <motion.div
            className="lg:col-span-7 relative z-10"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5">
              <Sparkles className="w-6 h-6" />
            </div>

            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
              An intelligent companion that{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-accent">
                thinks with you
              </span>
              .
            </h2>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base leading-relaxed max-w-xl">
              Stuck on a tricky concept? AXO breaks it down in plain language, generates customized
              15-question practice tests, and provides concise flashcards calibrated for Ethiopian
              high school students.
            </p>

            <div className="grid sm:grid-cols-2 gap-3.5 mt-8">
              {[
                {
                  title: '15-Question Drills',
                  desc: 'Rigorous exam-format practice quizzes with immediate scoring.',
                },
                {
                  title: 'Deep Concept Chat',
                  desc: 'Ask questions without judgment — AXO adapts to your pace.',
                },
                {
                  title: 'Study Note Cards',
                  desc: 'Auto-summarize complex chapters into memorable revision notes.',
                },
                {
                  title: 'Targeted Remediation',
                  desc: 'Focus specifically on question types you missed earlier.',
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-background/30 backdrop-blur-md p-4 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                    <h3 className="text-sm font-semibold">{card.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-6">{card.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right space for settled Axolotl */}
          <div className="hidden lg:block lg:col-span-5 h-80 relative" aria-hidden="true" />
        </div>
      </section>

      {/* ─── Blank Swim Spacer: axolotl crosses empty water to the LEFT edge ── */}
      <div className="h-[85vh] pointer-events-none" aria-hidden="true" />

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 — Focus Sessions & Raids (Axolotl LEFT, Content RIGHT)
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center px-5 md:px-12 py-20">
        <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-12 gap-10 items-center">
          {/* Left space for settled Axolotl */}
          <div className="hidden lg:block lg:col-span-5 h-80 relative" aria-hidden="true" />

          {/* Content on RIGHT (7 cols) — revealed once the axolotl has arrived left */}
          <motion.div
            className="lg:col-span-7 relative z-10"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="flex gap-2.5 mb-5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Timer className="w-6 h-6" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Zap className="w-6 h-6" />
              </div>
            </div>

            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
              Stay in the zone with <span className="text-amber-400">Focus Timers</span> &{' '}
              <span className="text-blue-400">Raids</span>.
            </h2>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base leading-relaxed max-w-xl">
              Study independently using distraction-free Pomodoro blocks that earn XP per minute, or
              team up with your classmates to tackle collective curriculum boss challenges.
            </p>

            <div className="grid sm:grid-cols-2 gap-3.5 mt-8">
              {[
                {
                  title: 'Pomodoro Productivity',
                  desc: 'Timed study intervals with audio cues and streak multipliers.',
                },
                {
                  title: 'Classmate Raids',
                  desc: 'Contribute quiz points to defeat challenging study bosses.',
                },
                {
                  title: 'Live Leaderboards',
                  desc: 'Climb school and grade-level rankings as you master topics.',
                },
                {
                  title: 'Avatar & Room Rewards',
                  desc: 'Unlock badges, titles, and cosmetics for your profile.',
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-background/30 backdrop-blur-md p-4 hover:border-amber-500/30 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                    <h3 className="text-sm font-semibold">{card.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-6">{card.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Blank Swim Spacer: axolotl glides toward CENTER for the CTA orbit ─ */}
      <div className="h-[60vh] pointer-events-none" aria-hidden="true" />

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5 — Final CTA Destination & Axolotl Orbit Sequence
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center px-5 py-24">
        <motion.div
          className="relative z-10 max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Subtle Ambient Glow behind CTA */}
          <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-accent/20 via-emerald-500/10 to-[#52B788]/20 blur-3xl opacity-70 pointer-events-none" />

          <div
            ref={ctaCardRef}
            className="relative rounded-3xl border border-white/10 bg-background/40 backdrop-blur-xl p-8 sm:p-14 shadow-2xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent mx-auto mb-6 shadow-inner">
              <Trophy className="w-7 h-7" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready to start your journey?
            </h2>
            <p className="text-muted-foreground mt-4 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              Join Studified today. Your companion is ready, your lessons are prepared, and your study
              quests await.
            </p>

            {/* ─── The Orbit Focal Anchor: "Let's Get Started" CTA Button ─── */}
            <div className="relative mt-10 inline-block cta-float">
              {/* Breathing accent glow + sonar pulse rings */}
              <span className="cta-glow" aria-hidden="true" />
              <span className="cta-ring cta-ring-a" aria-hidden="true" />
              <span className="cta-ring cta-ring-b" aria-hidden="true" />

              {/* Rising aquarium bubbles */}
              <span className="cta-bubble cta-bubble-1" aria-hidden="true" />
              <span className="cta-bubble cta-bubble-2" aria-hidden="true" />
              <span className="cta-bubble cta-bubble-3" aria-hidden="true" />

              {/* Exact button text and navigation per specification §14.2 & §15 */}
              <Button
                id="cta-get-started"
                size="lg"
                onClick={() => navigate('/login')}
                className="relative h-12 px-8 rounded-xl text-base font-semibold bg-accent text-accent-foreground shadow-lg shadow-accent/30 group overflow-hidden transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                {/* Animated gradient fill + sheen sweep */}
                <span className="cta-button-bg" aria-hidden="true" />
                <span className="cta-shine" aria-hidden="true" />
                <span className="relative z-10">Let's Get Started</span>
                <ChevronRight className="relative z-10 w-5 h-5 ml-1.5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>

            <div className="mt-5">
              <Link
                to="/login"
                className="text-xs text-muted-foreground hover:text-accent transition-colors underline-offset-4 hover:underline"
              >
                Already have an account? Sign in here →
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-8 border-t border-white/10 text-center text-[11px] text-muted-foreground">
        Studified · Ethiopian General Education Curriculum (MoE) · Grades 9–12 · All rights reserved
      </footer>
    </div>
  );
}