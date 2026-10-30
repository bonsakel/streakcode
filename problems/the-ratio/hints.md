For a **fixed** speed `k`, it's easy to compute how many hours the whole feed takes: add up `ceil(pile / k)`. How does that total change as `k` goes up?
---

Faster speed never takes longer, so the question "can I finish at speed `k`?" flips from no to yes exactly once as `k` grows. That is the shape binary search needs. Search over the **answer** (the speed), not over the array.
---

The answer lies in `[1, max(piles)]`. Test the middle speed: if it finishes in time, the answer is that speed or lower, so move `high` down to it; otherwise move `low` up past it. Stop when they meet.
