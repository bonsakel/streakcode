## The idea

Only start counting at the **beginning** of a streak. A day `d` begins a streak exactly when `d - 1` is missing. From each start, extend forward while the next day exists.

## Walkthrough

For `[100, 4, 200, 1, 3, 2]` the set is `{1, 2, 3, 4, 100, 200}`. `1` is a start (no `0`), and extending gives `1, 2, 3, 4`, a length of 4. `100` and `200` are starts of length 1. The best is `4`.

## Complexity

- **Time:** `O(n)`. Each day is either skipped (not a start) or walked once as part of exactly one streak.
- **Space:** `O(n)` for the set.

A sort-based solution (`sort`, dedupe, scan) is `O(n log n)` and perfectly acceptable here too.

## Common traps

- Walking forward from **every** day instead of only from starts degrades to `O(n²)` on a long streak.
- Forgetting duplicates when sorting: `[1, 1, 2]` has a streak of `2`, not `3`.
