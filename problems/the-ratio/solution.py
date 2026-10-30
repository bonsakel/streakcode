def minScrollSpeed(piles, hours):
    def hours_needed(speed):
        return sum(-(-pile // speed) for pile in piles)

    low, high = 1, max(piles)
    while low < high:
        mid = (low + high) // 2
        if hours_needed(mid) <= hours:
            high = mid
        else:
            low = mid + 1
    return low
