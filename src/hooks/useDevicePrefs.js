import { useSyncExternalStore } from 'react';

/**
 * One shared source of truth for the device flags that drive our mobile
 * performance optimizations. Each flag is a live media query exposed through
 * `useSyncExternalStore`, so subscribing components only re-render when the
 * actual boolean flips (e.g. rotating a tablet) — never on resize spam.
 *
 * - isMobile:     viewport below the Tailwind `md` breakpoint (768px)
 * - isLowPower:   low-end devices — we drop the heaviest visual effects
 * - reducedMotion: OS-level accessibility preference
 */

function subscribeMedia(query, onChange) {
  let mq;
  try {
    mq = window.matchMedia(query);
  } catch (_) {
    return () => {};
  }
  // Match the pattern used elsewhere in the codebase (Landing.jsx):
  // `change` events carry the new `matches` value directly.
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function getSnapshot(query) {
  try {
    return window.matchMedia(query).matches;
  } catch (_) {
    return false;
  }
}

function makeMediaHook(query) {
  // Stable function identities (created once per hook, not per render) so
  // useSyncExternalStore never unsubscribes/resubscribes needlessly.
  const subscribe = (cb) => subscribeMedia(query, cb);
  const getSnapshotForQuery = () => getSnapshot(query);
  const getServerSnapshot = () => false;
  return function useMediaFlag() {
    return useSyncExternalStore(subscribe, getSnapshotForQuery, getServerSnapshot);
  };
}

export const useIsMobile = makeMediaHook('(max-width: 767px)');
export const useLowPower = makeMediaHook('(max-width: 767px), (prefers-reduced-motion: reduce)');
export const usePrefersReducedMotion = makeMediaHook('(prefers-reduced-motion: reduce)');
