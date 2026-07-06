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

// ─── SVG Components ──────────────────────────────────────────────

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
        d={`M${50 + 18 * x},${40} Q${50 + 38 * x},${25} ${50 + 28 * x},${15}`}
        stroke="#2d6a4f"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M${50 + 18 * x},${40} Q${50 + 35 * x},${30} ${50 + 25 * x},${20}`}
        stroke="#40916c"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Middle gill */}
      <path
        d={`M${50 + 20 * x},${45} Q${50 + 42 * x},${35} ${50 + 35 * x},${25}`}
        stroke="#2d6a4f"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M${50 + 20 * x},${45} Q${50 + 38 * x},${38} ${50 + 32 * x},${28}`}
        stroke="#40916c"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Bottom gill */}
      <path
        d={`M${50 + 18 * x},${50} Q${50 + 40 * x},${48} ${50 + 36 * x},${38}`}
        stroke="#2d6a4f"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M${50 + 18 * x},${50} Q${50 + 36 * x},${50} ${50 + 33 * x},${42}`}
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
      {/* Left eye */}
      <motion.circle
        cx="38" cy="42" r="5"
        fill="#1a1a2e"
        variants={eyeVariants}
        animate={getVariant()}
        style={{ transformOrigin: '38px 42px' }}
      />
      {/* Right eye */}
      <motion.circle
        cx="62" cy="42" r="5"
        fill="#1a1a2e"
        variants={eyeVariants}
        animate={getVariant()}
        style={{ transformOrigin: '62px 42px' }}
      />
      {/* Eye shine */}
      {!isDormant && (
        <>
          <circle cx="36" cy="40" r="1.5" fill="white" opacity={0.8} />
          <circle cx="60" cy="40" r="1.5" fill="white" opacity={0.8} />
        </>
      )}
    </g>
  );
}

function Mouth({ state }) {
  const mouthVariants = {
    dormant: { d: 'M40,55 Q50,58 60,55' },
    active: { d: 'M38,54 Q50,60 62,54' },
    thinking: { d: 'M40,56 Q50,52 60,56' },
    loading: { d: 'M40,55 Q50,58 60,55' },
    ecstatic: { d: 'M35,52 Q50,65 65,52' },
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

function Body() {
  return (
    <g>
      {/* Body */}
      <ellipse cx="50" cy="75" rx="22" ry="18" fill="#a8e6cf" />
      {/* Left arm nub */}
      <ellipse cx="28" cy="72" rx="6" ry="4" fill="#a8e6cf" />
      {/* Right arm nub */}
      <ellipse cx="72" cy="72" rx="6" ry="4" fill="#a8e6cf" />
      {/* Belly highlight */}
      <ellipse cx="50" cy="78" rx="12" ry="10" fill="#c4f0e0" opacity={0.6} />
    </g>
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
      style={{ transformOrigin: '50px 45px' }}
    >
      {/* Head shape */}
      <ellipse cx="50" cy="45" rx="28" ry="24" fill="#a8e6cf" />
      {/* Cheek blush */}
      <ellipse cx="30" cy="50" rx="6" ry="3" fill="#ffb3c6" opacity={0.4} />
      <ellipse cx="70" cy="50" rx="6" ry="3" fill="#ffb3c6" opacity={0.4} />
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
        {/* Lightbulb body */}
        <path
          d="M78,15 Q78,10 80,8 Q82,10 82,15 L82,18 Q82,20 80,22 Q78,20 78,18 Z"
          fill="#fbbf24"
          stroke="#d97706"
          strokeWidth="1"
        />
        {/* Lightbulb base */}
        <rect x="79" y="22" width="2" height="3" rx="0.5" fill="#d97706" />
        {/* Glow */}
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
        const cy = 15 + Math.sin(rad) * radius;
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
    { x: 20, y: 10 },
    { x: 80, y: 5 },
    { x: 15, y: 30 },
    { x: 85, y: 25 },
    { x: 25, y: 60 },
    { x: 75, y: 55 },
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
          {/* Four-point star */}
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
    <g transform="translate(50, 8)">
      {/* Hat base */}
      <path
        d="M-12,0 L-8,-8 L8,-8 L12,0 Z"
        fill="#1a1a2e"
        stroke="#1a1a2e"
        strokeWidth="1"
      />
      {/* Hat top */}
      <rect x="-10" y="-10" width="20" height="3" rx="1" fill="#1a1a2e" />
      {/* Tassel */}
      <line x1="10" y1="-8" x2="14" y2="-2" stroke="#fbbf24" strokeWidth="1.5" />
      <circle cx="14" cy="-2" r="1.5" fill="#fbbf24" />
    </g>
  );
}

// ─── Main AXO Component ──────────────────────────────────────────

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

  // Use external state if provided, otherwise use internal
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

  // Idle timeout: transition to Dormant after inactivity
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (currentState === STATES.DORMANT) return;
    idleTimerRef.current = setTimeout(() => {
      setState(STATES.DORMANT);
    }, IDLE_TIMEOUT_MS);
  }, [currentState, setState]);

  // Ecstatic timeout: return to Active after celebration
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

  // Reset idle timer on state change
  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [currentState, resetIdleTimer]);

  const svgSize = size;
  const viewBox = '0 0 100 100';

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width={svgSize}
        height={svgSize}
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

        {/* Sparkles (Ecstatic state) */}
        <AnimatePresence>
          {currentState === STATES.ECSTATIC && <Sparkles />}
        </AnimatePresence>

        {/* Loading dots */}
        <AnimatePresence>
          {currentState === STATES.LOADING && <LoadingDots />}
        </AnimatePresence>

        {/* Lightbulb (Thinking state) */}
        <AnimatePresence>
          {currentState === STATES.THINKING && <LightbulbIcon />}
        </AnimatePresence>

        {/* Mortarboard hat */}
        {showHat && <MortarboardHat />}

        {/* Gills */}
        <Gills side="left" animate={currentState !== STATES.DORMANT} />
        <Gills side="right" animate={currentState !== STATES.DORMANT} />

        {/* Body */}
        <Body />

        {/* Head */}
        <Head state={currentState} />

        {/* Eyes */}
        <Eyes state={currentState} />

        {/* Mouth */}
        <Mouth state={currentState} />
      </svg>
    </div>
  );
}

// ─── Hook for managing AXO state from parent ────────────────────

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