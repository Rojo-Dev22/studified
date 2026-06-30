export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function getLevelFromXP(totalXP) {
  let level = 1;
  let remaining = totalXP;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return { level, currentXP: remaining, xpToNext: xpForLevel(level) };
}

export function getRankFromLevel(level) {
  if (level >= 50) return 'S';
  if (level >= 40) return 'A';
  if (level >= 30) return 'B';
  if (level >= 20) return 'C';
  if (level >= 10) return 'D';
  return 'E';
}

export function getTitleFromLevel(level) {
  if (level >= 50) return 'Top Scholar';
  if (level >= 40) return 'Distinguished';
  if (level >= 30) return 'Advanced';
  if (level >= 20) return 'Proficient';
  if (level >= 10) return 'Intermediate';
  if (level >= 5) return 'Developing';
  return 'Beginner';
}

export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}