## The idea

Binary search on the answer. Define `hoursNeeded(k) = sum(ceil(pile / k))`. It never increases as `k` increases, so "`hoursNeeded(k) <= hours`" is false for small `k` and true for large `k`. Find the first `k` where it turns true.

## Walkthrough

For `piles = [3, 6, 7, 11]` and `hours = 8`, search `[1, 11]`. At `k = 6`: `1 + 1 + 2 + 2 = 6 <= 8`, so go lower. At `k = 3`: `1 + 2 + 3 + 4 = 10 > 8`, so go higher. At `k = 4`: `1 + 2 + 2 + 3 = 8 <= 8`. At `k = 3` it failed, so the minimum is `4`.

## Complexity

- **Time:** `O(n · log(max(piles)))`. About 30 steps for a billion, each scanning the piles once.
- **Space:** `O(1)`.

## Common traps

- Using floor division instead of rounding **up**: a pile of 7 at speed 4 takes 2 hours, not 1.
- Looping `k` from 1 upward. With piles of a billion that is far too slow.
- Searching with `high = mid - 1` and losing the answer. Keeping `high = mid` when the check passes avoids that.
