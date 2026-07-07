import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup, useMotionValue, useTransform, useSpring } from 'framer-motion';

// ─── State Machine ───────────────────────────────────────────────
const STATES = {
  DORMANT: 'Dormant',
  ACTIVE: 'Active',
  THINKING: 'Thinking',
  LOADING: 'Loading',
  ECSTATIC: 'Ecstatic',
};

const IDLE_TIMEOUT_MS = 8000;
const ECSTATIC_TIMEOUT_MS = 4000;

// ─── AAA Physics ─────────────────────────────────────────────────
// Spring physics per spec §2 (stiffness: 300, damping: 20)
const SPRING = { type: 'spring', stiffness: 300, damping: 20 };
// Elastic cubic-bezier for responsive, bouncy feel
const ELASTIC = [0.34, 1.56, 0.64, 1];

// ─── Shared Defs (gradients + depth shadow) ──────────────────────
function Defs() {
  return (
    <defs>
      {/* Head volume: radial highlight + linear shade for 3D feel */}
      <radialGradient id="headGradient" cx="38%" cy="28%" r="75%">
        <stop offset="0%" stopColor="#C8F4E2" />
        <stop offset="45%" stopColor="#A8E6CF" />
        <stop offset="100%" stopColor="#74C69D" />
      </radialGradient>
      <linearGradient id="headShade" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
        <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="100%" stopColor="#1B4332" stopOpacity="0.18" />
      </linearGradient>
      <radialGradient id="gillGradient" cx="50%" cy="20%" r="90%">
        <stop offset="0%" stopColor="#52B788" />
        <stop offset="100%" stopColor="#1B4332" />
      </radialGradient>
      <radialGradient id="glowOrb" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFF7CC" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#FFF7CC" stopOpacity="0" />
      </radialGradient>
      {/* Soft box-shadow depth */}
      <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="2.5" stdDeviation="3" floodColor="#1B4332" floodOpacity="0.35" />
      </filter>
      <filter id="glowBlur" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="2.2" />
      </filter>
    </defs>
  );
}

// ─── Gills (ride the shared breath for a blended, living system) ──
function Gills({ side, breath, phase }) {
  const x = side === 'left' ? -1 : 1;
  // Subtle per-side offset so the two sides aren't perfectly mirrored,
  // but both follow the SAME breath so the head reads as one creature.
  const rotate = useTransform(breath, (v) => v * 2.2 + (side === 'left' ? 0 : 0.6));
  const scale = useTransform(breath, (v) => 1 + v * 0.02);

  const gill = (baseX, baseY, ctrlX, ctrlY, endX, endY, w) => (
    <path
      d={`M${baseX},${baseY} Q${ctrlX},${ctrlY} ${endX},${endY}`}
      stroke="url(#gillGradient)"
      strokeWidth={w}
      fill="none"
      strokeLinecap="round"
    />
  );

  return (
    <motion.g
      style={{ rotate, scale, transformOrigin: `${50 + 22 * x}px 50px` }}
      filter="url(#softShadow)"
    >
      {/* Top gill */}
      <g>
        {gill(50 + 18 * x, 42, 50 + 38 * x, 25, 50 + 28 * x, 15, 3)}
        {gill(50 + 18 * x, 42, 50 + 35 * x, 30, 50 + 25 * x, 20, 2)}
      </g>
      {/* Middle gill */}
      <g>
        {gill(50 + 20 * x, 48, 50 + 42 * x, 38, 50 + 35 * x, 28, 3)}
        {gill(50 + 20 * x, 48, 50 + 38 * x, 42, 50 + 32 * x, 32, 2)}
      </g>
      {/* Bottom gill */}
      <g>
        {gill(50 + 18 * x, 54, 50 + 40 * x, 52, 50 + 36 * x, 42, 3)}
        {gill(50 + 18 * x, 54, 50 + 36 * x, 55, 50 + 33 * x, 46, 2)}
      </g>
    </motion.g>
  );
}

// ─── Eye (receives a shared blink so both eyes close together) ───
function Eye({ cx, cy, state, blink }) {
  const wide = state === STATES.ECSTATIC || state === STATES.ACTIVE;
  const thinking = state === STATES.THINKING;

  // When thinking, eyes softly half-close (calm, contemplative) and glance up.
  const scaleY = blink ? 0.08 : thinking ? 0.55 : 1;
  const r = wide ? 6.2 : 5.5;

  return (
    <g>
      <ellipse cx={cx} cy={cy} rx="7" ry="7.5" fill="#FFFFFF" stroke="#1B4332" strokeWidth="1.5" />
      {/* Pupil + highlights glance gently upward when pondering */}
      <motion.g
        animate={{ y: thinking ? -1.6 : 0 }}
        transition={SPRING}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      >
        <motion.circle
          cx={cx}
          cy={cy}
          animate={{ scaleY, r }}
          transition={SPRING}
          fill="#000000"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
        {!blink && (
          <>
            <circle cx={cx - 2} cy={cy - 3} r="2.2" fill="white" opacity={thinking ? 0.6 : 0.95} />
            <circle cx={cx + 2} cy={cy + 2} r="1.2" fill="white" opacity={thinking ? 0.5 : 0.8} />
          </>
        )}
      </motion.g>
    </g>
  );
}

// Both eyes share ONE blink timer so they close in unison.
function Eyes({ state }) {
  const [blink, setBlink] = useState(false);
  const wide = state === STATES.ECSTATIC || state === STATES.ACTIVE;

  useEffect(() => {
    if (wide) {
      setBlink(false);
      return undefined;
    }
    let timer;
    const schedule = () => {
      const delay = 2600 + Math.random() * 3600; // single shared rhythm
      timer = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          schedule();
        }, 130);
      }, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [wide]);

  return (
    <g>
      <Eye cx={38} cy={46} state={state} blink={blink} />
      <Eye cx={62} cy={46} state={state} blink={blink} />
    </g>
  );
}

// ─── Mouth (spring / elastic morph) ──────────────────────────────
const MOUTH_PATHS = {
  dormant: 'M42,62 Q50,65 58,62',
  active: 'M40,61 Q50,67 60,61',
  thinking: 'M47,62 Q50,59 53,62 Q50,65 47,62',
  loading: 'M42,62 Q50,65 58,62',
  ecstatic: 'M38,58 Q50,72 62,58',
};

function Mouth({ state }) {
  return (
    <motion.path
      animate={{ d: MOUTH_PATHS[state.toLowerCase()] }}
      transition={{ duration: 0.45, ease: ELASTIC }}
      fill="none"
      stroke="#000000"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  );
}

// ─── Head (rides the shared breath; calm + blended) ──────────────
function Head({ state, breath }) {
  const isThinking = state === STATES.THINKING;
  // Head bobs with the SAME breath as the gills so the whole creature
  // rises and settles as one. Thinking adds a slow, gentle tilt (no shake).
  const y = useTransform(breath, (v) => -v * 2.2);
  const rotate = useTransform(breath, (v) => (isThinking ? 3 + v * 0.8 : v * 0.6));

  return (
    <motion.g
      style={{ y, rotate, transformOrigin: '50px 50px' }}
      filter="url(#softShadow)"
    >
      {/* Head base with volume gradient */}
      <ellipse cx="50" cy="50" rx="32" ry="30" fill="url(#headGradient)" stroke="#1B4332" strokeWidth="2" />
      {/* Shade overlay for 3D volume */}
      <ellipse cx="50" cy="50" rx="32" ry="30" fill="url(#headShade)" />
      {/* Rim highlight */}
      <path d="M30,34 Q50,22 70,34" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Cute blush */}
      <ellipse cx="26" cy="56" rx="9" ry="6" fill="#ffb3c6" opacity="0.55" />
      <ellipse cx="74" cy="56" rx="9" ry="6" fill="#ffb3c6" opacity="0.55" />

      {/* Small nose */}
      <ellipse cx="50" cy="54" rx="2" ry="1.5" fill="#1B4332" opacity="0.3" />

      {/* Thinking indicator - hand resting on chin (calm, settled) */}
      <AnimatePresence>
        {isThinking && (
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={SPRING}
          >
            <circle cx="78" cy="58" r="4.5" fill="#A8E6CF" stroke="#1B4332" strokeWidth="1.5" />
            <path d="M78,58 Q83,54 78,50" stroke="#1B4332" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </motion.g>
        )}
      </AnimatePresence>
    </motion.g>
  );
}

// ─── Thinking lightbulb ──────────────────────────────────────────
function LightbulbIcon() {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0, y: -10 }}
      transition={SPRING}
    >
      <motion.g
        animate={{ y: [0, -1.5, 0], scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '80px 20px' }}
      >
        <circle cx="80" cy="15" r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
        <path d="M77,15 L77,18 Q77,20 80,20 Q83,20 83,18 L83,15" fill="none" stroke="#d97706" strokeWidth="1.5" />
        <line x1="79" y1="20" x2="81" y2="20" stroke="#d97706" strokeWidth="1" />
        <line x1="79" y1="22" x2="81" y2="22" stroke="#d97706" strokeWidth="1" />
        <circle cx="80" cy="15" r="10" fill="#fbbf24" opacity="0.2">
          <animate attributeName="r" values="10;14;10" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.1;0.2" dur="3s" repeatCount="indefinite" />
        </circle>
      </motion.g>
    </motion.g>
  );
}

// ─── Loading orbiting dots ───────────────────────────────────────
function LoadingDots() {
  const dots = [0, 1, 2, 3, 4, 5, 6];
  return (
    <g>
      {dots.map((i) => {
        const angle = (i / dots.length) * 360;
        const rad = (angle * Math.PI) / 180;
        const radius = 14;
        const cx = 50 + Math.cos(rad) * radius;
        const cy = 18 + Math.sin(rad) * radius;
        return (
          <motion.circle
            key={i}
            cx={cx}
            cy={cy}
            r="2.5"
            fill="#40916c"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: (i / dots.length) * 1.2, ease: 'easeInOut' }}
          />
        );
      })}
    </g>
  );
}

// ─── Multi-layered Ecstatic particle system ──────────────────────
const starPath = (cx, cy, s) =>
  `M${cx},${cy - s} Q${cx + s * 0.25},${cy - s * 0.25} ${cx + s},${cy} Q${cx + s * 0.25},${cy + s * 0.25} ${cx},${cy + s} Q${cx - s * 0.25},${cy + s * 0.25} ${cx - s},${cy} Q${cx - s * 0.25},${cy - s * 0.25} ${cx},${cy - s}Z`;

function generateParticles(count) {
  return Array.from({ length: count }, (_, i) => {
    const layer = i % 3; // 0: glow orb, 1: mid sparkle, 2: sharp star
    return {
      id: i,
      layer,
      x: 12 + Math.random() * 76,
      y: 12 + Math.random() * 76,
      size: layer === 0 ? 6 + Math.random() * 6 : 2 + Math.random() * 4,
      delay: Math.random() * 1.6,
      duration: 1.4 + Math.random() * 2.2,
      repeatDelay: Math.random() * 1.2,
      driftX: (Math.random() - 0.5) * 26,
      driftY: -12 - Math.random() * 28,
      rotate: Math.random() * 360,
      color: Math.random() > 0.4 ? '#fbbf24' : '#FFF7CC',
    };
  });
}

function ParticleField() {
  const particles = useMemo(() => generateParticles(24), []);
  const layers = [
    particles.filter((p) => p.layer === 0),
    particles.filter((p) => p.layer === 1),
    particles.filter((p) => p.layer === 2),
  ];

  return (
    <g>
      {/* Layer 0: soft glow orbs (blurred, slow) */}
      {layers[0].map((p) => (
        <motion.circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r={p.size}
          fill="url(#glowOrb)"
          filter="url(#glowBlur)"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.8, 0], scale: [0, 1, 0.4], x: [0, p.driftX * 0.4, p.driftX], y: [0, p.driftY * 0.4, p.driftY] }}
          transition={{ duration: p.duration * 1.4, delay: p.delay, repeat: Infinity, repeatDelay: p.repeatDelay, ease: 'easeOut' }}
        />
      ))}
      {/* Layer 1: mid sparkles (4-point stars) */}
      {layers[1].map((p) => (
        <motion.path
          key={p.id}
          d={starPath(p.x, p.y, p.size)}
          fill={p.color}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.1, 0.5], rotate: [0, p.rotate * 0.5, p.rotate], x: [0, p.driftX * 0.6, p.driftX], y: [0, p.driftY * 0.6, p.driftY] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, repeatDelay: p.repeatDelay, ease: 'easeOut' }}
          style={{ transformOrigin: `${p.x}px ${p.y}px` }}
        />
      ))}
      {/* Layer 2: sharp tiny stars (fast, crisp) */}
      {layers[2].map((p) => (
        <motion.path
          key={p.id}
          d={starPath(p.x, p.y, p.size * 0.7)}
          fill="#ffffff"
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.3], rotate: [0, p.rotate, p.rotate * 2], x: [0, p.driftX, p.driftX * 1.4], y: [0, p.driftY, p.driftY * 1.4] }}
          transition={{ duration: p.duration * 0.8, delay: p.delay, repeat: Infinity, repeatDelay: p.repeatDelay, ease: 'easeOut' }}
          style={{ transformOrigin: `${p.x}px ${p.y}px` }}
        />
      ))}
    </g>
  );
}

// ─── Mortarboard hat (head-only compatible) ──────────────────────
function MortarboardHat() {
  return (
    <g transform="translate(50, 10)">
      <path d="M-12,0 L-8,-8 L8,-8 L12,0 Z" fill="#000000" stroke="#000000" strokeWidth="1" />
      <rect x="-10" y="-10" width="20" height="3" rx="1" fill="#000000" />
      <line x1="10" y1="-8" x2="14" y2="-2" stroke="#fbbf24" strokeWidth="1.5" />
      <circle cx="14" cy="-2" r="1.5" fill="#fbbf24" />
    </g>
  );
}

// ─── Main AXO Component (Head Only) ──────────────────────────────
export default function AXO({
  state: externalState,
  size = 100,
  showHat = false,
  className = '',
  onStateChange,
}) {
  const [internalState, setInternalState] = useState(STATES.DORMANT);
  /** @type {React.MutableRefObject<number | null>} */
  const idleTimerRef = useRef(null);
  /** @type {React.MutableRefObject<number | null>} */
  const ecstaticTimerRef = useRef(null);

  const currentState = externalState || internalState;

  // ── Shared breathing clock ──────────────────────────────────────
  // One spring-driven value (-1 → 1) that the head AND gills both follow,
  // so the whole character inhales/exhales as a single living system.
  const breathRaw = useMotionValue(0);
  const breath = useSpring(breathRaw, { stiffness: 300, damping: 20 });
  useEffect(() => {
    let raf;
    const start = performance.now();
    const period = currentState === STATES.THINKING ? 4200 : 3200; // slower, calmer when thinking
    const tick = (now) => {
      const t = ((now - start) % period) / period;
      breathRaw.set(Math.sin(t * Math.PI * 2));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [currentState, breathRaw]);

  const setState = useCallback(
    (newState) => {
      if (externalState !== undefined) {
        onStateChange?.(newState);
        return;
      }
      setInternalState(newState);
      onStateChange?.(newState);
    },
    [externalState, onStateChange]
  );

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (currentState === STATES.DORMANT) return;
    idleTimerRef.current = setTimeout(() => {
      setState(STATES.DORMANT);
    }, IDLE_TIMEOUT_MS);
  }, [currentState, setState]);

  useEffect(() => {
    if (currentState === STATES.ECSTATIC) {
      ecstaticTimerRef.current = setTimeout(() => {
        setState(STATES.ACTIVE);
      }, ECSTATIC_TIMEOUT_MS);
    }
    return () => {
      if (ecstaticTimerRef.current) clearTimeout(ecstaticTimerRef.current);
    };
  }, [currentState, setState]);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [currentState, resetIdleTimer]);

  const viewBox = '0 0 100 100';

  return (
    <LayoutGroup>
      <motion.div layout className={`inline-flex items-center justify-center ${className}`}>
        {/* Accessibility: announce state changes */}
        <span className="sr-only" aria-live="polite">
          {currentState}
        </span>

        <motion.svg
          layout
          width={size}
          height={size}
          viewBox={viewBox}
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          <Defs />

          {/* Background glow on ecstatic */}
          <AnimatePresence>
            {currentState === STATES.ECSTATIC && (
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="#fbbf24"
                opacity="0.15"
                initial={{ r: 30, opacity: 0 }}
                animate={{ r: 45, opacity: 0.15 }}
                exit={{ r: 30, opacity: 0 }}
                transition={SPRING}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>{currentState === STATES.ECSTATIC && <ParticleField />}</AnimatePresence>
          <AnimatePresence>{currentState === STATES.LOADING && <LoadingDots />}</AnimatePresence>
          <AnimatePresence>{currentState === STATES.THINKING && <LightbulbIcon />}</AnimatePresence>

          {showHat && <MortarboardHat />}

          {/* Head-only layered render (back-to-front) — all share one breath */}
          <Gills side="left" breath={breath} phase={0} />
          <Gills side="right" breath={breath} phase={0.6} />
          <Head state={currentState} breath={breath} />
          <Eyes state={currentState} />
          <Mouth state={currentState} />
        </motion.svg>
      </motion.div>
    </LayoutGroup>
  );
}

// ─── Hook ────────────────────────────────────────────────────────
export function useAXOState() {
  const [state, setState] = useState(STATES.DORMANT);

  const activate = useCallback(() => setState(STATES.ACTIVE), []);
  const startThinking = useCallback(() => setState(STATES.THINKING), []);
  const startLoading = useCallback(() => setState(STATES.LOADING), []);
  const celebrate = useCallback(() => setState(STATES.ECSTATIC), []);
  const idle = useCallback(() => setState(STATES.DORMANT), []);

  return {
    state,
    setState,
    activate,
    startThinking,
    startLoading,
    celebrate,
    idle,
    isDormant: state === STATES.DORMANT,
    isActive: state === STATES.ACTIVE,
    isThinking: state === STATES.THINKING,
    isLoading: state === STATES.LOADING,
    isEcstatic: state === STATES.ECSTATIC,
  };
}

export { STATES };