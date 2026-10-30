## The idea

Turn "was this replied to?" into a constant-time lookup with a hash set, then scan `sent` in order.

## Walkthrough

For `sent = [1, 2, 3, 4]` and `replied = [1, 2, 4]`, the set is `{1, 2, 4}`. Scanning `sent`: `1` is in it, `2` is in it, `3` is not, so the answer is `3`.

## Complexity

- **Time:** `O(n + m)` to build the set from `m` replies and scan `n` sent messages.
- **Space:** `O(m)` for the set.

## Common traps

- Checking `replied.includes(id)` inside the loop works, but it is `O(n · m)` and slows down on big inputs.
- Returning the **smallest** unreplied id is a different problem. The question asks for the first one in send order.
