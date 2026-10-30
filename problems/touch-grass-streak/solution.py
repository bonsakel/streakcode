def longestStreak(days):
    present = set(days)
    best = 0
    for day in present:
        if day - 1 in present:
            continue
        end = day
        while end + 1 in present:
            end += 1
        best = max(best, end - day + 1)
    return best
