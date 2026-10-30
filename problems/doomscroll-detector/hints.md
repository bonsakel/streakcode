Checking every possible substring works but is slow for long feeds. Can you reuse the work from the previous window instead of starting over?
---

Keep a window `[start, i]` that always has no repeats. Move `i` forward one character at a time, and keep a map from each character to the last index where you saw it.
---

When `s[i]` was last seen **inside the current window**, jump `start` to just after that earlier position. Then record `i - start + 1` as a candidate answer. Careful: a last-seen index that is **before** `start` must be ignored.
