function minScrollSpeed(piles, hours) {
  const hoursNeeded = (speed) => {
    let total = 0;
    for (const pile of piles) total += Math.ceil(pile / speed);
    return total;
  };

  let low = 1;
  let high = Math.max(...piles);
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (hoursNeeded(mid) <= hours) high = mid;
    else low = mid + 1;
  }
  return low;
}
