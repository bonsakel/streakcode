The most recently opened bracket must be the first one closed. Which data structure gives you "last in, first out"?
---

Use a stack. When you see an opener, push something that lets you recognise its matching closer later. When you see a closer, look at the top of the stack.
---

On a closer: if the stack is empty or the top doesn't match, the answer is `false`. Otherwise pop. At the end the stack must be empty, or something was never closed. Ignore every other character.
