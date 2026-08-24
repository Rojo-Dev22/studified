/**
 * Award XP to the current user and return the new total.
 * Also saves XP transaction to cloud database for history tracking.
 * If an XP booster is equipped and still active, the amount is amplified.
 */
import { getActiveBooster } from './shopItems';

export async function awardXP(db, user, amount, extraUpdates = {}, source = 'unknown', description = '', metadata = {}) {
  if (!user || amount <= 0) return user?.total_xp || 0;

  // ── Booster amplifier ────────────────────────────────────────────
  let boosted = amount;
  let booster = null;
  try {
    booster = getActiveBooster(user);
    if (booster?.boost?.multiplier > 1) {
      boosted = Math.round(amount * booster.boost.multiplier);
    }
  } catch { /* booster lookup is non-critical */ }

  const newTotal = (user.total_xp || 0) + boosted;
  await db.auth.updateMe({
    total_xp: newTotal,
    xp: newTotal,
    ...extraUpdates,
  });

  // ACoin is earned through experience / leveling up — award alongside XP.
  try {
    const { awardCoins } = await import('@/lib/coins');
    await awardCoins(db, user, 'acoin', boosted);
  } catch (err) {
    // Silently fail - coins are non-critical
  }

  // Save XP transaction to cloud database (non-blocking)
  try {
    const { addXPTransaction } = await import('@/lib/cloudDatabase');
    const uid = user.id || user.uid;
    if (uid) {
      await addXPTransaction(uid, boosted, source, description || `Earned ${boosted} XP`, {
        ...metadata,
        newTotal,
        ...(booster ? { booster: booster.id } : {}),
      });
    }
  } catch (err) {
    // Silently fail - localStorage is primary
    console.warn('Cloud XP tracking failed:', err);
  }

  return newTotal;
}

