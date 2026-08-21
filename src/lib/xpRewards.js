/**
 * Award XP to the current user and return the new total.
 * Also saves XP transaction to cloud database for history tracking.
 */
export async function awardXP(db, user, amount, extraUpdates = {}, source = 'unknown', description = '', metadata = {}) {
  if (!user || amount <= 0) return user?.total_xp || 0;
  const newTotal = (user.total_xp || 0) + amount;
  await db.auth.updateMe({
    total_xp: newTotal,
    xp: newTotal,
    ...extraUpdates,
  });

  // ACoin is earned through experience / leveling up — award alongside XP.
  try {
    const { awardCoins } = await import('@/lib/coins');
    await awardCoins(db, user, 'acoin', amount);
  } catch (err) {
    // Silently fail - coins are non-critical
  }

  // Save XP transaction to cloud database (non-blocking)
  try {
    const { addXPTransaction } = await import('@/lib/cloudDatabase');
    const uid = user.id || user.uid;
    if (uid) {
      await addXPTransaction(uid, amount, source, description || `Earned ${amount} XP`, {
        ...metadata,
        newTotal,
      });
    }
  } catch (err) {
    // Silently fail - localStorage is primary
    console.warn('Cloud XP tracking failed:', err);
  }

  return newTotal;
}
