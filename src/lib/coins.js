// ─── Currency helpers: GameCoin + ACoin ─────────────────────────────
// GameCoin is earned by playing games.
// ACoin   is earned from XP / leveling-up activities (quests, focus, raids).

export function gameCoinBalance(user) {
  return user?.gamecoin || 0;
}

export function acoinBalance(user) {
  return user?.acoin || 0;
}

/** Award coins and persist them onto the current user. Returns new balance. */
export async function awardCoins(db, user, type, amount) {
  if (!user || amount <= 0) return type === 'acoin' ? acoinBalance(user) : gameCoinBalance(user);
  const field = type === 'acoin' ? 'acoin' : 'gamecoin';
  // Read the freshest balance from the live store so stacked awards never
  // build on one another from a stale snapshot.
  let current = user[field] ?? 0;
  try {
    const store = db.getStore && db.getStore();
    if (store?.currentUser?.[field] != null) current = store.currentUser[field];
  } catch { /* fall back to the passed snapshot */ }
  const next = current + amount;
  await db.auth.updateMe({ [field]: next });
  return next;
}

/** Spend coins; returns true only when affordable and deducted. */
export async function spendCoins(db, user, type, amount) {
  if (!user || amount <= 0) return false;
  const field = type === 'acoin' ? 'acoin' : 'gamecoin';
  // Use the freshest balance from the live store when available.
  let bal = user[field] ?? 0;
  try {
    const store = db.getStore && db.getStore();
    if (store?.currentUser?.[field] != null) bal = store.currentUser[field];
  } catch { /* fall back to the passed snapshot */ }
  if (bal < amount) return false;
  const next = bal - amount;
  await db.auth.updateMe({ [field]: next });
  return true;
}
