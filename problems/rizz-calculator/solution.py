from collections import Counter


def rizzCalculator(scores):
    counts = Counter(scores)
    return sum(value for value, count in counts.items() if count == 1)
