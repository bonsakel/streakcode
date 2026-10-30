function longestFreshStretch(s) {
  const lastSeen = new Map();
  let start = 0;
  let best = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const previous = lastSeen.get(ch);
    if (previous !== undefined && previous >= start) start = previous + 1;
    lastSeen.set(ch, i);
    best = Math.max(best, i - start + 1);
  }
  return best;
}
