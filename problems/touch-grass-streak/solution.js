function longestStreak(days) {
  const present = new Set(days);
  let best = 0;
  for (const day of present) {
    if (present.has(day - 1)) continue;
    let end = day;
    while (present.has(end + 1)) end++;
    best = Math.max(best, end - day + 1);
  }
  return best;
}
