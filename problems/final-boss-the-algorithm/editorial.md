## The idea

Dynamic programming over prefixes. Let `dp[i][j]` be the minimum edits to turn `a[0..i)` into `b[0..j)`. The answer is `dp[len(a)][len(b)]`.

## Transitions

- Characters match: `dp[i][j] = dp[i-1][j-1]` (no edit needed).
- Characters differ: `dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])`:
  - `dp[i-1][j]`: delete `a[i-1]`
  - `dp[i][j-1]`: insert `b[j-1]` at the end
  - `dp[i-1][j-1]`: replace `a[i-1]` with `b[j-1]`
- Base cases: `dp[i][0] = i`, `dp[0][j] = j`.

## Walkthrough

For `"horse"` to `"ros"` the table's bottom-right cell is `3`, matching the replace, delete, delete sequence in the statement.

## Complexity

- **Time:** `O(n · m)`. About 250,000 cells at length 500.
- **Space:** `O(min(n, m))` with the rolling-row trick (this solution keeps only the previous row), or `O(n · m)` with the full table.

## Common traps

- Plain recursion without memoisation is exponential and will time out.
- Off-by-one errors between the table index `i` and the character index `i - 1`.
- Forgetting the base cases, so empty strings return `0` instead of the other string's length.
