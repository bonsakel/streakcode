## The idea

Sort by start time, then sweep once. After sorting, a plan can only overlap the most recent merged plan, so each step is one comparison.

## Walkthrough

For `[[1, 3], [8, 10], [2, 6], [15, 18]]`, sorting gives `[1, 3], [2, 6], [8, 10], [15, 18]`. `[2, 6]` starts at 2, which is `<= 3`, so merge into `[1, 6]`. `[8, 10]` starts after 6, so it is new. `[15, 18]` is new too. Result: `[[1, 6], [8, 10], [15, 18]]`.

## Complexity

- **Time:** `O(n log n)`, dominated by the sort. The sweep is `O(n)`.
- **Space:** `O(n)` for the output.

## Common traps

- Setting the merged end to the **new** plan's end. Use `max`, because a short plan can sit entirely inside a long one (`[1, 10]` and `[2, 3]`).
- Using `<` instead of `<=`. Plans that touch (`[1, 4]` and `[4, 5]`) must merge.
- Mutating the caller's arrays. Copy the pairs before editing them.
- JavaScript's default `sort()` orders numbers as text, so `10` sorts before `9`.
