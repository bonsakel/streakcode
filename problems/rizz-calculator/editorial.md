## The idea

Frequency counting. Count how many times each value appears, then add up the values whose count is exactly one.

## Walkthrough

For `[-4, 10, -4, 7, 10, 1]` the counts are `-4 → 2`, `10 → 2`, `7 → 1`, `1 → 1`. Only `7` and `1` are unique, so the answer is `8`.

## Complexity

- **Time:** `O(n)`. One pass to count, one pass over the distinct values.
- **Space:** `O(k)`, where `k` is the number of distinct values (at most 2001 here).

## Common traps

- The naive approach calls `count()` / `indexOf()` for every element, which is `O(n²)` and gets slow near 100,000 elements.
- Summing every value once (the sum of the _distinct_ values) is a different question. A value that appears twice must contribute nothing.
