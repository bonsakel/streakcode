def isBalanced(s):
    closer_for = {"(": ")", "[": "]", "{": "}"}
    closers = set(closer_for.values())
    expected = []
    for ch in s:
        if ch in closer_for:
            expected.append(closer_for[ch])
        elif ch in closers:
            if not expected or expected.pop() != ch:
                return False
    return not expected
