def longestFreshStretch(s):
    last_seen = {}
    start = 0
    best = 0
    for i, ch in enumerate(s):
        previous = last_seen.get(ch)
        if previous is not None and previous >= start:
            start = previous + 1
        last_seen[ch] = i
        best = max(best, i - start + 1)
    return best
