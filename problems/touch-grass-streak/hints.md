Sorting the days makes runs easy to see. Does the sorted order handle duplicates for you?
---

Without sorting: put every day in a set. A day starts a streak only if `day - 1` is **not** in the set.
---

For each streak start, walk forward (`day + 1`, `day + 2`, ...) while the day is in the set and count the length. Keep the best. Each day is visited a bounded number of times, so it stays fast.
