function rizzCalculator(scores) {
  const counts = new Map();
  for (const score of scores) counts.set(score, (counts.get(score) ?? 0) + 1);
  let total = 0;
  for (const [value, count] of counts) {
    if (count === 1) total += value;
  }
  return total;
}
