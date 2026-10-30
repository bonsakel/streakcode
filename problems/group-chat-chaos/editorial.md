## The idea

Nesting is last-in-first-out, which is exactly what a stack does. Push the closer each opener expects; every closer you read must equal the one on top.

## Walkthrough

For `"lol (ok [fine] {sure})"`: push `)` for `(`, push `]` for `[`, then `]` matches the top and pops. Push `}` for `{`, then `}` pops, then `)` pops. The stack is empty, so the answer is `true`.

For `"(]"`: push `)`, then `]` does not match the top `)`, so `false`.

## Complexity

- **Time:** `O(n)`, each character is handled once.
- **Space:** `O(n)` for the stack in the worst case (all openers).

## Common traps

- Popping from an empty stack. `")("` starts with a closer and must return `false`, not crash.
- Returning `true` as soon as the loop ends without checking that the stack is empty. `"(("` leaves openers behind.
- Counting brackets of each kind separately passes `"([)]"`, which is wrong. Order matters.
