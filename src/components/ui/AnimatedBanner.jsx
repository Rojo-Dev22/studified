import React from 'react';

/**
 * Animated banner backdrop for the Shop's "animated" backgrounds.
 * Base: flowing gradient. Variant overlays give each background its own
 * signature motion: pop | ember | aurora | stars | nebula | shimmer.
 * Keyframes and helper classes live in index.css.
 */

const EMBERS = [
  { left: '6%', size: 9, dur: '3.4s', delay: '0s', gold: false },
  { left: '18%', size: 6, dur: '4.2s', delay: '.8s', gold: true },
  { left: '30%', size: 10, dur: '3.8s', delay: '1.6s', gold: false },
  { left: '44%', size: 7, dur: '4.6s', delay: '.3s', gold: true },
  { left: '56%', size: 9, dur: '3.2s', delay: '2.1s', gold: false },
  { left: '68%', size: 6, dur: '4.9s', delay: '1.2s', gold: true },
  { left: '80%', size: 10, dur: '3.6s', delay: '.5s', gold: false },
  { left: '90%', size: 7, dur: '4.4s', delay: '2.6s', gold: true },
];

const SHOOTS = [
  { top: '10%', dur: '5.5s', delay: '0s' },
  { top: '48%', dur: '7.5s', delay: '3.1s' },
];

export default function AnimatedBanner({ item, className = '' }) {
  const [c1, c2, c3] = item?.colors || ['#0ea5e9', '#22d3ee', '#a5f3fc'];
  const variant = item?.anim || 'flow';

  return (
    <div className={className} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} aria-hidden="true">
      {/* Flowing gradient base */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${c1}, ${c2}, ${c3})`,
          backgroundSize: '200% 200%',
          animation: 'bannerFlowPos 12s ease-in-out infinite',
        }}
      />

      {/* Bloom Pop — pastel circles popping */}
      {variant === 'pop' && (
        <>
          <span className="banner-pop" style={{ background: c1, left: '6%', top: '18%', width: '28%', animationDelay: '0s' }} />
          <span className="banner-pop" style={{ background: c2, left: '36%', top: '-14%', width: '32%', animationDelay: '1.2s' }} />
          <span className="banner-pop" style={{ background: c3, left: '64%', top: '26%', width: '26%', animationDelay: '2.3s' }} />
          <span className="banner-pop" style={{ background: c2, left: '22%', top: '44%', width: '20%', animationDelay: '1.7s' }} />
          <span className="banner-pop" style={{ background: c1, left: '78%', top: '-8%', width: '22%', animationDelay: '2.9s' }} />
        </>
      )}

      {/* Ember Flow — rising glowing embers */}
      {variant === 'ember' && EMBERS.map((e, i) => (
        <span
          key={i}
          className="banner-ember"
          style={{
            left: e.left,
            width: e.size,
            height: e.size,
            animationDuration: e.dur,
            animationDelay: e.delay,
            background: e.gold
              ? 'radial-gradient(circle, #fef3c7 0%, #fbbf24 42%, transparent 70%)'
              : 'radial-gradient(circle, #fdba74 0%, #ea580c 46%, transparent 72%)',
          }}
        />
      ))}

      {/* Aurora Veil — swaying light curtains */}
      {variant === 'aurora' && (
        <>
          <span className="banner-curtain" style={{ left: '-4%', width: '26%', background: `linear-gradient(180deg, transparent 0%, ${c3}cc 32%, ${c2}99 58%, transparent 88%)`, animationName: 'bannerCurtainA', animationDuration: '7s' }} />
          <span className="banner-curtain" style={{ left: '30%', width: '22%', background: `linear-gradient(180deg, transparent 5%, ${c2}cc 38%, ${c3}80 62%, transparent 90%)`, animationName: 'bannerCurtainB', animationDuration: '9s' }} />
          <span className="banner-curtain" style={{ left: '62%', width: '30%', background: `linear-gradient(180deg, transparent 0%, ${c3}b3 30%, ${c2}80 60%, transparent 85%)`, animationName: 'bannerCurtainA', animationDuration: '11s', animationDelay: '1.4s' }} />
        </>
      )}

      {/* Stargazer — twinkling stars + shooting stars */}
      {variant === 'stars' && (
        <>
          <span className="banner-sparkle" />
          <span className="banner-stars" />
          {SHOOTS.map((s, i) => (
            <span key={i} className="banner-shoot" style={{ top: s.top, animationDuration: s.dur, animationDelay: s.delay }} />
          ))}
        </>
      )}

      {/* Nebula Drift — drifting galaxy clouds + stardust */}
      {variant === 'nebula' && (
        <>
          <span className="banner-cloud" style={{ background: c2, left: '-14%', top: '-42%', width: '62%', animationName: 'bannerDriftA', animationDuration: '24s' }} />
          <span className="banner-cloud" style={{ background: c3, left: '48%', top: '-30%', width: '48%', animationName: 'bannerDriftB', animationDuration: '19s', animationDelay: '1.2s' }} />
          <span className="banner-cloud" style={{ background: c1, left: '22%', top: '8%', width: '70%', animationName: 'bannerDriftC', animationDuration: '28s', animationDelay: '.6s' }} />
          <span className="banner-sparkle" style={{ opacity: .55 }} />
        </>
      )}

      {/* Frost Sheen — glinting sheen sweep */}
      {variant === 'shimmer' && <span className="banner-shimmer" />}
    </div>
  );
}
