import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * Living 2D Aquarium Environment
 * Conforms to AXO_AAA_Scroll_Hero_Implementation_Spec.md §4:
 * - Layered depth: Water atmosphere, slow light rays, floating particles, rising bubbles
 * - Preserves existing site color palette and dark theme
 * - Non-intrusive: Enhances atmosphere without competing with text readability
 * - Respects prefers-reduced-motion
 */

export default function AquariumBackground({ className = '' }) {
  // Generate deterministic bubbles
  const bubbles = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: 4 + ((i * 17) % 92), // percentage across width
      size: 4 + ((i * 3) % 10), // 4px to 14px
      duration: 7 + ((i * 2.3) % 8), // 7s to 15s
      delay: (i * 0.75) % 6,
      sway: 12 + ((i * 5) % 20),
      opacity: 0.25 + ((i * 7) % 35) / 100,
    }));
  }, []);

  // Generate ambient floating micro-particles (water specks / plankton)
  const particles = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: 3 + ((i * 29) % 94),
      y: 5 + ((i * 37) % 90),
      size: 2 + (i % 3),
      duration: 5 + ((i * 1.7) % 6),
      delay: (i * 0.4) % 4,
      color: i % 3 === 0 ? '#A8E6CF' : i % 3 === 1 ? '#52B788' : '#74C69D',
    }));
  }, []);

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none ${className}`}>
      {/* ─── Base Dark Oceanic Depth Atmosphere ───────────────────────── */}
      <div className="absolute inset-0 bg-[#060B0E]" />

      {/* ─── Radial Oceanic Ambient Glows ────────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,hsl(142_71%_45%/0.12),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_40%,hsl(158_64%_52%/0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_80%,hsl(142_71%_45%/0.07),transparent_60%)]" />

      {/* ─── Slow Ambient Caustic Light Rays ─────────────────────────── */}
      <motion.div
        className="absolute -top-20 left-1/4 w-3/4 h-[90vh] opacity-25"
        animate={{
          x: [-15, 20, -15],
          opacity: [0.18, 0.28, 0.18],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(168, 230, 207, 0.18) 0%, transparent 75%)',
          transform: 'rotate(-12deg)',
        }}
      />

      <motion.div
        className="absolute -top-32 right-1/4 w-2/3 h-[85vh] opacity-20"
        animate={{
          x: [25, -20, 25],
          opacity: [0.15, 0.24, 0.15],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background:
            'radial-gradient(ellipse 50% 80% at 50% 0%, rgba(82, 183, 136, 0.16) 0%, transparent 75%)',
          transform: 'rotate(15deg)',
        }}
      />

      {/* ─── Ambient Water Grid Texture (Subtle Depth) ───────────────── */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #A8E6CF 1px, transparent 0)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* ─── Drifting Micro-Particles ─────────────────────────────────── */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          animate={{
            y: [-12, 12, -12],
            x: [-8, 8, -8],
            opacity: [0.2, 0.7, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* ─── Gentle Rising Aquarium Bubbles ───────────────────────────── */}
      {bubbles.map((b) => (
        <motion.div
          key={b.id}
          className="absolute bottom-[-30px] rounded-full border border-[#A8E6CF]/40 bg-[#A8E6CF]/10 backdrop-blur-[0.5px]"
          style={{
            left: `${b.x}%`,
            width: b.size,
            height: b.size,
            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.4), 0 0 6px rgba(168, 230, 207, 0.2)',
          }}
          animate={{
            y: ['0vh', '-110vh'],
            x: [0, b.sway, -b.sway, 0],
            opacity: [0, b.opacity, b.opacity, 0],
          }}
          transition={{
            duration: b.duration,
            repeat: Infinity,
            delay: b.delay,
            ease: 'linear',
          }}
        >
          {/* Bubble specular gleam */}
          <div
            className="absolute rounded-full bg-white/70"
            style={{
              top: '20%',
              left: '25%',
              width: Math.max(1.5, b.size * 0.3),
              height: Math.max(1.5, b.size * 0.3),
            }}
          />
        </motion.div>
      ))}

      {/* ─── Gentle Vignette ─────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(6,11,14,0.65)_100%)]" />
    </div>
  );
}
