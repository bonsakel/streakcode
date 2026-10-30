## The idea

A sliding window. Keep the window `[start, i]` free of repeats. When the new character already appears inside the window, slide `start` just past its previous position.

## Walkthrough

For `"abba"`: at `i = 0, 1` the window is `"ab"`. At `i = 2` we see `b` again (last seen at 1), so `start` becomes 2 and the window is `"b"`. At `i = 3` we see `a`, last seen at 0, which is **before** `start`, so we ignore it and the window grows to `"ba"`. The best length is `2`.

## Complexity

- **Time:** `O(n)`. `start` and `i` each only move forward.
- **Space:** `O(k)` for the map, where `k` is the alphabet size (at most 95 printable ASCII characters).

## Common traps

- Moving `start` backwards. On `"abba"` the last-seen index of `a` is `0`, which is behind `start = 2`. Always take it only if it is `>= start`.
- Rebuilding a set for every start position is `O(n²)` and times out on long feeds.
