def mergePlans(plans):
    merged = []
    for start, end in sorted(plans):
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged
