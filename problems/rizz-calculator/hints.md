How would you know whether a number showed up once or many times? You need to remember how often you have seen each value.
---

A hash map from value to count does exactly that. Build it in one pass over the array.
---

After counting, walk the map and add up only the keys whose count is exactly `1`. Don't forget that an empty array should give `0`.
