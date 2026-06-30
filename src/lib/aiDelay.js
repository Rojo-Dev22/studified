/** Minimum wait so Study AI feels responsive and shows the loading animation. */
export const AI_MIN_DELAY_MS = 1600;

export async function withMinDelay(promise, ms = AI_MIN_DELAY_MS) {
  const [result] = await Promise.all([promise, new Promise((r) => setTimeout(r, ms))]);
  return result;
}

export async function withDelayBudget(promise, { minMs = 5000 } = {}) {
  const start = Date.now();
  const result = await promise;
  const elapsed = Date.now() - start;
  const remaining = minMs - elapsed;
  if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
  return result;
}
