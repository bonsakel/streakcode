function isBalanced(s) {
  const closerFor = { '(': ')', '[': ']', '{': '}' };
  const closers = new Set(Object.values(closerFor));
  const expected = [];
  for (const ch of s) {
    if (ch in closerFor) {
      expected.push(closerFor[ch]);
    } else if (closers.has(ch)) {
      if (expected.pop() !== ch) return false;
    }
  }
  return expected.length === 0;
}
