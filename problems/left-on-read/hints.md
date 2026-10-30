Think about the question you ask for every message: "did this id get a reply?" How fast can you answer it?
---

Searching `replied` with `includes` or `in` on a list checks every element each time. Put the replied ids into a set first so each lookup is quick.
---

Walk `sent` in order and return the first id that is not in the set. If the loop finishes, return `-1`.
