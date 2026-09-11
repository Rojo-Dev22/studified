import React, { useMemo } from 'react';
import { useLowPower, useIsMobile } from '@/hooks/useDevicePrefs';

/**
 * Living 2D Aquarium Environment
 * Conforms to AXO_AAA_Scroll_Hero_Implementation_Spec.md §4:
 * - Layered depth: Water atmosphere, slow light rays, floating particles, rising bubbles
 * - Preserves existing site color palette and dark theme
 * - Non-intrusive: Enhances atmosphere without competing with text readability
 * - Respects prefers-reduced-motion
 *
 * Performance notes (mobile lag fix):
 * - Every ambient animation here is a pure CSS keyframe driven by the
 *   compositor — the browser animates off the main thread, so scrolling and
 *   React work never contend with the water. (Previously ~44 framer-motion
 *   springs ran on JS for both the landing and login pages.)
 * - Element counts are halved on mobile viewports and further reduced on
 *   low-power devices / reduced-motion preference.
 * - Bubbles no longer carry per-bubble backdrop-blur or extra gleam layers,
 *   which forced the compositor to manage dozens of blur masks per frame.
 */

export default function AquariumBackground({ className = '' }) {
  const lowPower = useLowPower();
  const isMobile = useIsMobile();

  // Generate deterministic bubbles (pure data — no animation state)
  const bubbles = useMemo(() => {
    // 18 on desktop, 8 on mobile, 5 on low-power devices
    const count = lowPower ? 5 : isMobile ? 8 : 18;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 4 + ((i * 17) % 92), // percentage across width
      size: 4 + ((i * 3) % 10), // 4px to 14px
      duration: 7 + ((i * 2.3) % 8), // 7s to 15s
      delay: (i * 0.75) % 6,
      sway: 12 + ((i * 5) % 20),
      opacity: 0.25 + ((i * 7) % 35) / 100,
    }));
  }, [lowPower, isMobile]);

  // Generate ambient floating micro-particles (water specks / plankton)
  const particles = useMemo(() => {
    // 24 on desktop, 10 on mobile, 6 on low-power devices
    const count = lowPower ? 6 : isMobile ? 10 : 24;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 3 + ((i * 29) % 94),
      y: 5 + ((i * 37) % 90),
      size: 2 + (i % 3),
      duration: 5 + ((i * 1.7) % 6),
      delay: (i * 0.4) % 4,
      color: i % 3 === 0 ? '#A8E6CF' : i % 3 === 1 ? '#52B788' : '#74C69D',
    }));
  }, [lowPower, isMobile]);

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none ${className}`}>
      {/* ─── Base Dark Oceanic Depth Atmosphere ───────────────────────── */}
      <div className="absolute inset-0 bg-[#060B0E]" />

      {/* ─── Radial Oceanic Ambient Glows ────────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,hsl(142_71%_45%/0.12),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_40%,hsl(158_64%_52%/0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_80%,hsl(142_71%_45%/0.07),transparent_60%)]" />

      {/* ─── Slow Ambient Caustic Light Rays ─────────────────────────── */}
      <div
        className="aq-ray absolute -top-20 left-1/4 w-3/4 h-[90vh]"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(168, 230, 207, 0.18) 0%, transparent 75%)',
          transform: 'rotate(-12deg)',
          // The sway keyframes compose this var into their transform. (A bare
          // inline `transform` is overridden by the animation every frame,
          // which silently un-tilted the rays while they drifted.)
          ['--aq-rot']: 'rotate(-12deg)',
          ['--aq-ray-dur']: '16s',
        }}
      />

      <div
        className="aq-ray absolute -top-32 right-1/4 w-2/3 h-[85vh]"
        style={{
          background:
            'radial-gradient(ellipse 50% 80% at 50% 0%, rgba(82, 183, 136, 0.16) 0%, transparent 75%)',
          transform: 'rotate(15deg)',
          // Same tilt var for the second ray (see note above).
          ['--aq-rot']: 'rotate(15deg)',
          ['--aq-ray-dur']: '20s',
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
        <div
          key={p.id}
          className="aq-particle absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            ['--aq-dur']: `${p.duration}s`,
            ['--aq-delay']: `${p.delay}s`,
            ['--aq-color']: p.color,
          }}
        />
      ))}

      {/* ─── Gentle Rising Aquarium Bubbles ───────────────────────────── */}
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="aq-bubble absolute bottom-[-30px] rounded-full border border-[#A8E6CF]/40 bg-[#A8E6CF]/10"
          style={{
            left: `${b.x}%`,
            width: b.size,
            height: b.size,
            // Single soft highlight replaces the old nested gleam div +
            // backdrop-blur layer (two composited surfaces per bubble).
            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.4), 0 0 6px rgba(168, 230, 207, 0.2)',
            ['--aq-dur']: `${b.duration}s`,
            ['--aq-delay']: `${b.delay}s`,
            ['--aq-sway']: `${b.sway}px`,
            ['--aq-opacity']: b.opacity,
          }}
        />
      ))}

      {/* ─── Gentle Vignette ─────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(6,11,14,0.65)_100%)]" />
    </div>
  );
}
