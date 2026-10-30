Think about only the **last** characters of the two strings. If they match, what's the cost of that pair? If they differ, which three moves could deal with them?
---

Define `dp[i][j]` as the edit distance between the first `i` characters of `a` and the first `j` of `b`. Base cases: `dp[i][0] = i` (delete everything) and `dp[0][j] = j` (insert everything).
---

If `a[i-1] === b[j-1]`, then `dp[i][j] = dp[i-1][j-1]`. Otherwise it is `1 + min(dp[i-1][j] (delete), dp[i][j-1] (insert), dp[i-1][j-1] (replace))`. Fill the table row by row. You only need the previous row to compute the current one.
