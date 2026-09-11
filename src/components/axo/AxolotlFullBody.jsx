import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { useLowPower } from '@/hooks/useDevicePrefs';

/**
 * AXO — Animated Axolotl HEAD.
 *
 * A hand-drawn 2D axolotl head (bezier paths, no circle-blob body) INSPIRED by
 * the supplied illustration `a-premium--aaa-studio-quality-full-body-2d-illustr.svg`:
 * wide face with tapered chin, darker crown shading, six feathery gill fronds,
 * deep-black glossy eyes, the soft "w" mouth, mint-green palette.
 *
 * The head itself is the swimmer: it bobs with a slow, relaxed rhythm, banks
 * into turns, breathes calmly, and its six gills flutter with independent
 * phase timing (faster when swimSpeed rises). While idle it cycles through a
 * variety of behaviors (looking around, gill flares, playful wiggles, lazy
 * drifts) so it never feels stuck on one loop. Natural variable-interval
 * blinking keeps it alive; `prefers-reduced-motion` damps everything to a
 * gentle float.
 *
 * Public API (state, swimSpeed, facingRight, angle, size, bubbleEmit) is
 * unchanged, so the existing scroll hero (Landing.jsx) keeps working.
 */

// ─── Character States ───────────────────────────────────────────────────────
export const AXO_STATES = {
  IDLE: 'idle',
  SWIMMING: 'swimming',
  DIVING: 'diving',
  TURNING: 'turning',
  ORBITING: 'orbiting',
  ASCENDING: 'ascending',
};

// Idle variety — AXO cycles through these behaviors while resting so it never
// just bobs in place: float (calm), lookAround (curious), gillFlare (proud),
// wiggle (playful burst), drift (lazy wander).
const IDLE_BEHAVIORS = ['float', 'lookAround', 'gillFlare', 'wiggle', 'drift'];

// Pivot points in viewBox user units (viewBox `0 0 140 120`)
const PIVOT = {
  head: '70px 60px',
  leftEye: '52px 57px',
  rightEye: '88px 57px',
  mouth: '70px 78px',
  gillL1: '39px 40px',
  gillL2: '34px 52px',
  gillL3: '37px 63px',
  gillR1: '101px 40px',
  gillR2: '106px 52px',
  gillR3: '103px 63px',
};

// ─── Gradients (mint body, darker gills) ────────────────────────────────────
function AxoDefs({ id }) {
  return (
    <defs>
      <radialGradient id={`${id}-body`} cx="38%" cy="26%" r="85%">
        <stop offset="0%" stopColor="#CFF7E6" />
        <stop offset="52%" stopColor="#A8E6CF" />
        <stop offset="100%" stopColor="#74C69D" />
      </radialGradient>
      <radialGradient id={`${id}-gill`} cx="70%" cy="80%" r="90%">
        <stop offset="0%" stopColor="#52B788" />
        <stop offset="100%" stopColor="#1B4332" />
      </radialGradient>
      <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#1B4332" floodOpacity="0.18" />
      </filter>
    </defs>
  );
}

// ─── Main Axolotl Head Experience ───────────────────────────────────────────
export default function AxolotlHead({
  state = AXO_STATES.IDLE,
  swimSpeed = 0, // 0 (still) to 1 (full speed) — number OR framer-motion MotionValue
  facingRight = true,
  angle = 0, // pitch/bank angle in degrees — number OR MotionValue
  size = 230,
  className = '',
  bubbleEmit = false,
  disableGlow = false, // skip the per-frame feDropShadow repaint (mobile perf)
}) {
  const id = useMemo(() => `axo-${Math.random().toString(36).slice(2, 8)}`, []);

  // ── MotionValue-aware props (mobile perf) ───────────────────────────────
  // `swimSpeed` and `angle` may be plain numbers OR framer-motion
  // MotionValues. MotionValues let the parent (Landing) stream scroll-driven
  // values straight into this component's animation loop with zero React
  // re-renders per frame.
  const speedIsMV = !!(swimSpeed && typeof swimSpeed.get === 'function');
  const angleIsMV = !!(angle && typeof angle.get === 'function');
  const speedValue = speedIsMV ? swimSpeed.get() : swimSpeed || 0;

  // ── Reduced-motion respect ────────────────────────────────────────────────
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    let mq = null;
    try {
      mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
      const onChange = (e) => setPrefersReducedMotion(e.matches);
      mq.addEventListener('change', onChange);
      return () => mq && mq.removeEventListener('change', onChange);
    } catch (_) {
      return undefined;
    }
  }, []);

  const activeSpeed = Math.max(0.08, speedValue);
  const lowPower = useLowPower();
  const isOrbiting = state === AXO_STATES.ORBITING;
  const isSwimming = state === AXO_STATES.SWIMMING || activeSpeed > 0.3;
  const calm = prefersReducedMotion ? 0.16 : 1;

  // ── Natural blink (variable interval — never rigid) ───────────────────────
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    let alive = true;
    let t1;
    let t2;
    const trigger = () => {
      t1 = setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        t2 = setTimeout(() => {
          if (!alive) return;
          setBlink(false);
          trigger();
        }, 120);
      }, 2400 + Math.random() * 3600);
    };
    trigger();
    return () => {
      alive = false;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // ── Idle Variety: cycles through different idle behaviors while resting ───
  // A behavior is picked at random intervals (4.2–7.4s); each one drives its
  // own motion targets in the animation loop below. Swimming/orbiting always
  // overrides the idle machine.
  const [idleBehavior, setIdleBehavior] = useState('float');
  const idleBehaviorRef = useRef('float');
  const idleBehaviorStartRef = useRef(0);
  useEffect(() => {
    idleBehaviorRef.current = idleBehavior;
  }, [idleBehavior]);

  useEffect(() => {
    if (isSwimming || isOrbiting) {
      idleBehaviorRef.current = 'float';
      setIdleBehavior('float');
      return undefined;
    }
    let alive = true;
    let timer;
    const pick = () => {
      if (!alive) return;
      const next = IDLE_BEHAVIORS[Math.floor(Math.random() * IDLE_BEHAVIORS.length)];
      idleBehaviorRef.current = next;
      idleBehaviorStartRef.current = performance.now() / 1000;
      setIdleBehavior(next);
      timer = setTimeout(pick, 4200 + Math.random() * 3200);
    };
    idleBehaviorStartRef.current = performance.now() / 1000;
    timer = setTimeout(pick, 3200 + Math.random() * 2600);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [isSwimming, isOrbiting]);

  // ── Swimming physics (requestAnimationFrame + phase integration) ──────────
  // Phase & amplitude are integrated (not recomputed from elapsed time), so
  // speed changes blend smoothly — the head never snaps to a new rhythm.
  const headY = useMotionValue(0);
  const swayX = useMotionValue(0);
  const headRoll = useMotionValue(0);
  const gillL1 = useMotionValue(0);
  const gillL2 = useMotionValue(0);
  const gillL3 = useMotionValue(0);
  const gillR1 = useMotionValue(0);
  const gillR2 = useMotionValue(0);
  const gillR3 = useMotionValue(0);

  // LOW-POWER ANIMATION MODEL (mobile perf rework):
  // - No framer `useSpring` chain here. Each framer spring ran its own
  //   perpetual rAF integration, so even a parked page burned 4+ rAF loops —
  //   one of them feeding an internal `breath` value that was never even
  //   rendered. All smoothing now happens INSIDE the single rAF loop below
  //   via exponential blend factors: one loop, one integration pass, zero
  //   idle work.

  // Persistent animation clock — refs (not per-effect locals), so re-renders
  // from new prop values never reset the phase: the bob stays butter-smooth.
  const tRef = useRef(0);
  const phaseRef = useRef(0);
  const freqRef = useRef(1.6);
  const ampRef = useRef(5);
  const lastFrameRef = useRef(0);

  useEffect(() => {
    let rafId;
    let lastLoop = 0;

    // Frame-rate independent smoothing factors: `1 - exp(-k·dt)` produces the
    // identical curve at 30fps and 60fps (the old `+= x * 0.04` blends were
    // frame-rate DEPENDENT — a throttled loop would have moved differently).
    const smoothDt = (k, dt) => 1 - Math.exp(-k * dt);

    // On low-power devices every other frame is skipped: the rAF callback
    // returns WITHOUT integrating (near-zero work), so the loop renders ~30fps
    // and the phone's main thread stays free for scroll input.
    const minFrame = lowPower ? 1000 / 30 : 0;

    const animate = (now) => {
      rafId = requestAnimationFrame(animate);
      if (minFrame && now - lastLoop < minFrame - 1) return;

      const last = lastLoop || now - 1000 / 60;
      const dt = Math.min(0.05, (now - last) / 1000);
      lastLoop = now;
      lastFrameRef.current = now;
      tRef.current += dt;

      // Live speed: when the parent streams a MotionValue, read it here (no
      // re-render needed); otherwise use the prop captured at render time.
      const liveSpeed = speedIsMV ? Math.max(0.08, swimSpeed.get()) : activeSpeed;
      const swimmingNow = isOrbiting || liveSpeed > 0.3;

      // Smooth frequency + amplitude blending toward the current state
      // (exponential, frame-rate independent — see smoothDt above)
      const targetFreq = isOrbiting ? 2.4 : swimmingNow ? 3.1 : 1.6;
      const targetAmp = isOrbiting ? 9 : swimmingNow ? 11 : 5;
      freqRef.current += (targetFreq - freqRef.current) * smoothDt(2.4, dt);
      ampRef.current += (targetAmp - ampRef.current) * smoothDt(3, dt);
      phaseRef.current += dt * freqRef.current;
      const phase = phaseRef.current;
      const t = tRef.current;

      // Behavior for this frame: idle variety while resting, swim while moving
      const behavior = swimmingNow ? 'swim' : idleBehaviorRef.current;

      // Calm, SLOW buoyant bob (no more rapid up-and-down); idle behaviors
      // only soften it further, and breathing is equally relaxed.
      const bobFreq = swimmingNow ? 1.1 : 0.8;
      let bobAmp = swimmingNow ? 2.4 : 2.0;
      let swayAmp = 2;
      let swayFreq = 0.45;
      let rollAmp = swimmingNow ? 3.6 : 4.2;
      let rollWobble = 0;
      let gillScale = 1;

      switch (behavior) {
        case 'lookAround': // curious — slowly scans around with a gentle tilt
          rollAmp = 0;
          rollWobble = Math.sin(t * 0.55) * 7.5;
          swayAmp = 3.5;
          swayFreq = 0.3;
          bobAmp = 1.4;
          gillScale = 0.7;
          break;
        case 'gillFlare': // showing off — gills flare wide in slow pulses
          gillScale = 1.35 + Math.sin(t * 1.9) * 0.75;
          bobAmp = 1.2;
          rollWobble = Math.sin(t * 0.4) * 1.5;
          break;
        case 'wiggle': { // playful — a decaying wiggle burst after each switch
          const since = Math.max(0, now / 1000 - idleBehaviorStartRef.current);
          rollAmp = 2.5;
          rollWobble = Math.exp(-since * 1.1) * Math.sin(since * 13) * 6.5;
          swayAmp = 1.5;
          bobAmp = 1.6;
          break;
        }
        case 'drift': // lazy — long, slow horizontal drift across the water
          swayAmp = 5;
          swayFreq = 0.22;
          rollAmp = 3.2;
          rollWobble = Math.sin(t * 0.3) * 2;
          bobAmp = 1.3;
          gillScale = 0.55;
          break;
        case 'swim': // propulsion is handled by the phase-driven values below
          break;
        default: // float — the calm resting state
          rollWobble = Math.sin(t * 0.5) * 2.2;
          break;
      }

      headY.set(Math.sin(t * bobFreq) * bobAmp * calm);
      swayX.set(
        (swimmingNow ? Math.sin(phase) * 2 : Math.sin(t * swayFreq) * swayAmp) * calm
      );
      // Banking roll: slow relaxed tilt when idle, phase-locked lean when swimming
      headRoll.set(
        ((swimmingNow
          ? Math.sin(phase - 0.4) * rollAmp
          : Math.sin(t * 0.5) * rollAmp) + rollWobble) * calm
      );
      // Six gills flutter with independent phase offsets (symmetric flare).
      // Left gills rotate +, right gills rotate − so tips flare outward.
      // `gillScale` lets the idle behaviors calm or exaggerate the flutter.
      const gil = ampRef.current * calm * gillScale;
      gillL1.set(Math.sin(phase + 0.0) * gil);
      gillL2.set(Math.sin(phase + 0.9) * gil * 0.92);
      gillL3.set(Math.sin(phase + 1.8) * gil * 0.85);
      gillR1.set(-Math.sin(phase - 0.8) * gil * 0.95);
      gillR2.set(-Math.sin(phase - 1.7) * gil * 0.88);
      gillR3.set(-Math.sin(phase - 2.6) * gil * 0.8);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [
    activeSpeed, speedIsMV, isOrbiting, calm, lowPower,
    headY, swayX, headRoll,
    gillL1, gillL2, gillL3, gillR1, gillR2, gillR3,
  ]);

  // Rendered aspect ratio (viewBox 140 x 120)
  const viewH = (size * 120) / 140;

  // When `angle` arrives as a MotionValue we attach it via `style` so every
  // frame lands without a React re-render; the numeric path keeps the
  // animated spring-flip behavior unchanged.
  return (
    <motion.div
      className={`inline-block relative select-none pointer-events-none ${className}`}
      style={{
        width: size,
        height: viewH,
        transformOrigin: '50% 50%',
        ...(angleIsMV ? { rotate: angle } : null),
      }}
      animate={
        angleIsMV
          ? { scaleX: facingRight ? 1 : -1 }
          : { scaleX: facingRight ? 1 : -1, rotate: angle }
      }
      transition={{
        scaleX: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] },
        rotate: { duration: 0.35, ease: 'easeOut' },
      }}
    >
      {/* SVG drop-shadow filter repaints on every animated frame — the
          heaviest single paint cost on phones — so mobile opts out. */}
      <svg
        viewBox="0 0 140 120"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
        filter={disableGlow ? undefined : `url(#${id}-glow)`}
      >
        <AxoDefs id={id} />

        {/* ── HEAD (the swimmer: bob + sway + bank) ─────────────────────────── */}
        <motion.g
          style={{
            transformOrigin: PIVOT.head,
            // MotionValues stream straight into `style` — no identity
            // useTransform wrappers needed.
            y: headY,
            x: swayX,
            rotate: headRoll,
          }}
        >
          {/* SIX FEATHERY GILL FRONDS (drawn behind the head silhouette) */}
          <motion.g style={{ transformOrigin: PIVOT.gillL1, rotate: gillL1 }}>
            <path
              d="M39 42 C29 34 20 23 17 10 C26 15 35 25 41 35 C42.5 38 41.5 40.5 39 42 Z"
              fill={`url(#${id}-gill)`}
            />
          </motion.g>
          <motion.g style={{ transformOrigin: PIVOT.gillL2, rotate: gillL2 }}>
            <path
              d="M34 55 C23 52 12 45 5 34 C16 35 27 40 36 48 C37.5 50.5 36.5 53.5 34 55 Z"
              fill={`url(#${id}-gill)`}
            />
          </motion.g>
          <motion.g style={{ transformOrigin: PIVOT.gillL3, rotate: gillL3 }}>
            <path
              d="M37 67 C27 70 16 69 6 62 C17 58 28 57 37 60 C39 62 39 65 37 67 Z"
              fill={`url(#${id}-gill)`}
            />
          </motion.g>
          <motion.g style={{ transformOrigin: PIVOT.gillR1, rotate: gillR1 }}>
            <path
              d="M101 42 C111 34 120 23 123 10 C114 15 105 25 99 35 C97.5 38 98.5 40.5 101 42 Z"
              fill={`url(#${id}-gill)`}
            />
          </motion.g>
          <motion.g style={{ transformOrigin: PIVOT.gillR2, rotate: gillR2 }}>
            <path
              d="M106 55 C117 52 128 45 135 34 C124 35 113 40 104 48 C102.5 50.5 103.5 53.5 106 55 Z"
              fill={`url(#${id}-gill)`}
            />
          </motion.g>
          <motion.g style={{ transformOrigin: PIVOT.gillR3, rotate: gillR3 }}>
            <path
              d="M103 67 C113 70 124 69 134 62 C123 58 112 57 103 60 C101 62 101 65 103 67 Z"
              fill={`url(#${id}-gill)`}
            />
          </motion.g>

          {/* HEAD SILHOUETTE — wide cheeks, soft crown, tapered chin */}
          <path
            d="M27 57 C27 35 43 16 70 16 C97 16 113 35 113 57 C113 70 106 81 94 88 C86 92 77 96 70 96 C63 96 54 92 46 88 C34 81 27 70 27 57 Z"
            fill={`url(#${id}-body)`}
          />
          {/* Crown shade (classic darker two-tone top) */}
          <path
            d="M30 47 C32 30 46 18 70 18 C94 18 108 30 110 47 C96 38 84 34 70 34 C56 34 44 38 30 47 Z"
            fill="#74C69D"
            opacity="0.55"
          />
          {/* Wet sheen on the crown */}
          <path
            d="M42 28 C48 23 56 20 64 19 C57 25 50 31 45 37 C42 34 41 31 42 28 Z"
            fill="#FFFFFF"
            opacity="0.4"
          />
          {/* Jaw shadow for volume */}
          <path
            d="M31 60 C35 77 50 92 70 92 C90 92 105 77 109 60 C103 81 89 94 70 94 C51 94 37 81 31 60 Z"
            fill="#1B4332"
            opacity="0.10"
          />

          {/* EYES — deep black, glossy, with natural blink */}
          <motion.g style={{ transformOrigin: PIVOT.leftEye, scaleY: blink ? 0.12 : 1 }}>
            <ellipse cx="52" cy="57" rx="7.5" ry="8.2" fill="#0F1E0B" />
            <circle cx="49.5" cy="54" r="2.9" fill="#F4FFF9" opacity="0.95" />
            <circle cx="54.8" cy="59.6" r="1.4" fill="#FFFFFF" opacity="0.5" />
          </motion.g>
          <motion.g style={{ transformOrigin: PIVOT.rightEye, scaleY: blink ? 0.12 : 1 }}>
            <ellipse cx="88" cy="57" rx="7.5" ry="8.2" fill="#0F1E0B" />
            <circle cx="85.5" cy="54" r="2.9" fill="#F4FFF9" opacity="0.95" />
            <circle cx="90.8" cy="59.6" r="1.4" fill="#FFFFFF" opacity="0.5" />
          </motion.g>

          {/* Nostril specks */}
          <circle cx="63.5" cy="67" r="1.2" fill="#263A25" opacity="0.85" />
          <circle cx="76.5" cy="67" r="1.2" fill="#263A25" opacity="0.85" />

          {/* Cheek blush (subtle, in-palette) */}
          <ellipse cx="41" cy="71" rx="5.5" ry="3" fill="#74C69D" opacity="0.45" />
          <ellipse cx="99" cy="71" rx="5.5" ry="3" fill="#74C69D" opacity="0.45" />

          {/* Soft "w" mouth (preserved expression, mostly static) */}
          <motion.g style={{ transformOrigin: PIVOT.mouth, scale: 1 }}>
            <path
              d="M58 77.5 Q64 82.5 70 78.5 Q76 82.5 82 77.5"
              fill="none"
              stroke="#101F09"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </motion.g>
        </motion.g>

        {/* ── Ambient swim bubbles when accelerating ───────────────────────── */}
        {(bubbleEmit || activeSpeed > 0.6) && (
          <g>
            {[
              { cx: 16, cy: 102, r: 2.2, d: 0 },
              { cx: 8, cy: 110, r: 3, d: 0.4 },
            ].map((b, i) => (
              <motion.circle
                key={i}
                cx={b.cx}
                cy={b.cy}
                r={b.r}
                fill="none"
                stroke="#A8E6CF"
                strokeWidth="1"
                initial={{ opacity: 0.6, scale: 0.5 }}
                animate={{ opacity: [0.6, 0], scale: [0.5, 1.5], cx: b.cx - 18, cy: b.cy - 16 }}
                transition={{ duration: 1.2, repeat: Infinity, delay: b.d, ease: 'easeOut' }}
              />
            ))}
          </g>
        )}
      </svg>
    </motion.div>
  );
}
