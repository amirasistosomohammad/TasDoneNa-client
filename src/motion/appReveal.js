/**
 * Shared app entrance: fade in + slide from above (negative y → 0).
 * Use with Framer Motion for layout, pending panels, settings tabs, etc.
 */
export const APP_REVEAL_EASE = [0.22, 1, 0.36, 1];

/**
 * @param {boolean} reducedMotion - from useReducedMotion()
 * @param {{ delay?: number, y?: number, duration?: number }} [opts]
 */
export function appRevealMotionProps(reducedMotion, opts = {}) {
  const { delay = 0, y = -14, duration = 0.45 } = opts;
  if (reducedMotion) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration, ease: APP_REVEAL_EASE, delay },
  };
}
