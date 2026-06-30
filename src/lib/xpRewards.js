/**
 * Award XP to the current user and return the new total.
 */
export async function awardXP(db, user, amount, extraUpdates = {}) {
  if (!user || amount <= 0) return user?.total_xp || 0;
  const newTotal = (user.total_xp || 0) + amount;
  await db.auth.updateMe({
    total_xp: newTotal,
    xp: newTotal,
    ...extraUpdates,
  });
  return newTotal;
}
