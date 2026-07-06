import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

// ─── SVG Sub-components (Head only) ──────────────────────────────

function Gills({ side, animate = false }) {
  const x = side === 'left' ? -1 : 1;
  const gillVariants = {
    idle: {
      rotate: [0, 3 * x, 0, -3 * x, 0],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
    active: {
      rotate: [0, 5 * x, 0, -5 * x, 0],
      transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  return (
    <motion.g
      variants={gillVariants}
      animate={animate ? 'active' : 'idle'}
      style={{ transformOrigin: `${50 + 20 * x}px 50px` }}
    >
      {/* Top gill */}
      <path
        d={`M${50 + 18 * x},${42} Q${50 + 38 * x},${25} ${50 + 28 * x},${15}`}
        stroke="#2d6a4f"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M${50 + 18 * x},${42} Q${50 + 35 * x},${30} ${50 + 25 * x},${20}`}
        stroke="#40916c"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Middle gill */}
      <path
        d={`M${50 + 20 * x},${48} Q${50 + 42 * x},${38} ${50 + 35 * x},${28}`}
        stroke="#2d6a4f"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M${50 + 20 * x},${48} Q${50 + 38 * x},${42} ${50 + 32 * x},${32}`}
        stroke="#40916c"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Bottom gill */}
      <path
        d={`M${50 + 18 * x},${54} Q${50 + 40 * x},${52} ${50 + 36 * x},${42}`}
        stroke="#2d6a4f"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M${50 + 18 * x},${54} Q${50 + 36 * x},${55} ${50 + 33 * x},${46}`}
        stroke="#40916c"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </motion.g>
  );
}

function Eyes({ state }) {
  const isDormant = state === STATES.DORMANT;
  const isEcstatic = state === STATES.ECSTATIC;
  const isThinking = state === STATES.THINKING;

  const eyeVariants = {
    dormant: {
      scaleY: [1, 0.1, 1],
      transition: { duration: 4, repeat: Infinity, times: [0, 0.5, 1] },
    },
    active: {
      scale: [1, 1.15, 1],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
    thinking: {
      scale: [1, 0.9, 1],
      transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
    },
    ecstatic: {
      scale: [1, 1.3, 1],
      transition: { duration: 0.5, repeat: 3, ease: 'easeOut' },
    },
  };

  const getVariant = () => {
    if (isDormant) return 'dormant';
    if (isEcstatic) return 'ecstatic';
    if (isThinking) return 'thinking';
    return 'active';
  };

  return (
    <g>
      <motion.circle
        cx="38" cy="46" r="5"
        fill="#1a1a2e"
        variants={eyeVariants}
        animate={getVariant()}
        style={{ transformOrigin: '38px 46px' }}
      />
      <motion.circle
        cx="62" cy="46" r="5"
        fill="#1a1a2e"
        variants={eyeVariants}
        animate={getVariant()}
        style={{ transformOrigin: '62px 46px' }}
      />
      {!isDormant && (
        <>
          <circle cx="36" cy="44" r="1.5" fill="white" opacity={0.8} />
          <circle cx="60" cy="44" r="1.5" fill="white" opacity={0.8} />
        </>
      )}
    </g>
  );
}

function Mouth({ state }) {
  const mouthVariants = {
    dormant: { d: 'M40,60 Q50,63 60,60' },
    active: { d: 'M38,59 Q50,65 62,59' },
    thinking: { d: 'M40,61 Q50,57 60,61' },
    loading: { d: 'M40,60 Q50,63 60,60' },
    ecstatic: { d: 'M35,57 Q50,70 65,57' },
  };

  return (
    <motion.path
      variants={mouthVariants}
      animate={state}
      fill="none"
      stroke="#1a1a2e"
      strokeWidth="2.5"
      strokeLinecap="round"
      transition={{ duration: 0.3, ease: 'easeOut' }}
    />
  );
}

function Head({ state }) {
  const headVariants = {
    dormant: {
      y: [0, -2, 0],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
    active: {
      y: [0, -1, 0],
      transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
    },
    thinking: {
      rotate: [0, -3, 0, 3, 0],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
    loading: {
      y: [0, -1, 0],
      transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
    },
    ecstatic: {
      y: [0, -4, 0],
      transition: { duration: 0.4, repeat: 4, ease: 'easeOut' },
    },
  };

  return (
    <motion.g
      variants={headVariants}
      animate={state}
      style={{ transformOrigin: '50px 50px' }}
    >
      {/* Head - centered, larger without body */}
      <ellipse cx="50" cy="50" rx="30" ry="27" fill="#a8e6cf" />
      {/* Cheek blush */}
      <ellipse cx="28" cy="56" rx="7" ry="4" fill="#ffb3c6" opacity={0.4} />
      <ellipse cx="72" cy="56" rx="7" ry="4" fill="#ffb3c6" opacity={0.4} />
      {/* Small neck hint */}
      <ellipse cx="50" cy="74" rx="14" ry="6" fill="#a8e6cf" opacity={0.7} />
    </motion.g>
  );
}

function LightbulbIcon() {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <motion.g
        animate={{
          y: [0, -3, 0],
          rotate: [0, 5, 0, -5, 0],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '80px 20px' }}
      >
        <path
          d="M78,15 Q78,10 80,8 Q82,10 82,15 L82,18 Q82,20 80,22 Q78,20 78,18 Z"
          fill="#fbbf24"
          stroke="#d97706"
          strokeWidth="1"
        />
        <rect x="79" y="22" width="2" height="3" rx="0.5" fill="#d97706" />
        <circle cx="80" cy="15" r="8" fill="#fbbf24" opacity={0.2}>
          <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.1;0.2" dur="2s" repeatCount="indefinite" />
        </circle>
      </motion.g>
    </motion.g>
  );
}

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
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: (i / dots.length) * 1.2,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </g>
  );
}

function Sparkles() {
  const sparklePositions = [
    { x: 20, y: 15 },
    { x: 80, y: 10 },
    { x: 15, y: 35 },
    { x: 85, y: 30 },
    { x: 25, y: 65 },
    { x: 75, y: 60 },
  ];

  return (
    <g>
      {sparklePositions.map((pos, i) => (
        <motion.g
          key={i}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.2, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.25,
            ease: 'easeOut',
          }}
          style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
        >
          <path
            d={`M${pos.x},${pos.y - 5} Q${pos.x},${pos.y} ${pos.x + 5},${pos.y} Q${pos.x},${pos.y} ${pos.x},${pos.y + 5} Q${pos.x},${pos.y} ${pos.x - 5},${pos.y} Q${pos.x},${pos.y} ${pos.x},${pos.y - 5}Z`}
            fill="#fbbf24"
          />
        </motion.g>
      ))}
    </g>
  );
}

function MortarboardHat() {
  return (
    <g transform="translate(50, 10)">
      <path
        d="M-12,0 L-8,-8 L8,-8 L12,0 Z"
        fill="#1a1a2e"
        stroke="#1a1a2e"
        strokeWidth="1"
      />
      <rect x="-10" y="-10" width="20" height="3" rx="1" fill="#1a1a2e" />
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
  const idleTimerRef = useRef(null);
  const ecstaticTimerRef = useRef(null);

  const currentState = externalState || internalState;

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
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        {/* Background glow */}
        {currentState === STATES.ECSTATIC && (
          <motion.circle
            cx="50" cy="50" r="45"
            fill="#fbbf24"
            opacity={0.15}
            initial={{ r: 30, opacity: 0 }}
            animate={{ r: 45, opacity: 0.15 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        )}

        <AnimatePresence>
          {currentState === STATES.ECSTATIC && <Sparkles />}
        </AnimatePresence>

        <AnimatePresence>
          {currentState === STATES.LOADING && <LoadingDots />}
        </AnimatePresence>

        <AnimatePresence>
          {currentState === STATES.THINKING && <LightbulbIcon />}
        </AnimatePresence>

        {showHat && <MortarboardHat />}

        {/* Head-only rendering - no body */}
        <Gills side="left" animate={currentState !== STATES.DORMANT} />
        <Gills side="right" animate={currentState !== STATES.DORMANT} />
        <Head state={currentState} />
        <Eyes state={currentState} />
        <Mouth state={currentState} />
      </svg>
    </div>
  );
}

// ─── Hook ────────────────────────────────────────────────────

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