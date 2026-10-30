"""One-off generator for problems/*/tests.json (authoring aid; not shipped).

Expected values come from deliberately naive, independent brute-force implementations, so the
reference solutions in problems/*/solution.* are checked against something other than themselves.
"""
import json
import random
import sys
from bisect import bisect_left
from functools import lru_cache

sys.setrecursionlimit(20000)
rng = random.Random(7)
ROOT = sys.argv[1]


def write(slug, cases):
    out = [{"input": i, "expected": e, "hidden": h} for (i, e, h) in cases]
    with open(f"{ROOT}/{slug}/tests.json", "w") as f:
        json.dump(out, f, separators=(",", ":"))
        f.write("\n")
    print(slug, len(out), "tests,", sum(1 for c in out if c["hidden"]), "hidden")


def build(brute, visible, hidden):
    return [([*a], brute(*a), False) for a in visible] + [([*a], brute(*a), True) for a in hidden]


# rizz-calculator -------------------------------------------------------------
def rizz(scores):
    return sum(v for v in set(scores) if scores.count(v) == 1)


big = [rng.randint(-1000, 1000) for _ in range(5000)]
write(
    "rizz-calculator",
    build(
        rizz,
        [([1, 2, 3, 2],), ([5, 5, 5],), ([-4, 10, -4, 7, 10, 1],), ([],)],
        [
            ([42],),
            ([0, 0, 1],),
            ([-1000, 1000, -1000],),
            ([3, 3, 3, 4, 4, 9],),
            ([rng.randint(-5, 5) for _ in range(40)],),
            (big,),
        ],
    ),
)


# left-on-read ----------------------------------------------------------------
def left(sent, replied):
    for m in sent:
        if m not in replied:
            return m
    return -1


ids = rng.sample(range(1, 100000), 4000)
write(
    "left-on-read",
    build(
        left,
        [
            ([1, 2, 3, 4], [1, 2, 4]),
            ([10, 20, 30], [30, 20, 10]),
            ([7, 8, 9], []),
        ],
        [
            ([5], [5]),
            ([5], []),
            ([4, 9, 2, 6], [6, 2]),
            ([4, 9, 2, 6], [6, 2, 4, 9, 9, 2]),
            (ids, ids[:-1]),
            (ids, ids[1:]),
        ],
    ),
)


# touch-grass-streak ----------------------------------------------------------
def streak(days):
    uniq = sorted(set(days))
    best = run = 0
    prev = None
    for d in uniq:
        run = run + 1 if prev is not None and d == prev + 1 else 1
        best = max(best, run)
        prev = d
    return best


sparse = rng.sample(range(-1000000, 1000000), 3000) + list(range(500, 900))
rng.shuffle(sparse)
write(
    "touch-grass-streak",
    build(
        streak,
        [
            ([100, 4, 200, 1, 3, 2],),
            ([5, 5, 5],),
            ([9, 1, 4, 7, 3, -1, 0, 5, 8, -1, 6],),
            ([],),
        ],
        [
            ([7],),
            ([1, 3, 5, 7],),
            ([-3, -2, -1, 0, 1],),
            ([10, 9, 8, 8, 7, 100, 101],),
            ([2, 2, 3, 3, 4, 4],),
            (sparse,),
        ],
    ),
)


# group-chat-chaos ------------------------------------------------------------
def balanced(s):
    s = "".join(ch for ch in s if ch in "()[]{}")
    prev = None
    while prev != s:
        prev = s
        for pair in ("()", "[]", "{}"):
            s = s.replace(pair, "")
    return all(ch not in "()[]{}" for ch in s)


def gen_balanced(pairs):
    out = []
    for _ in range(pairs):
        o, c = rng.choice(["()", "[]", "{}"])
        out.append(o)
    # build a guaranteed-balanced string via recursive nesting
    def make(n):
        if n == 0:
            return ""
        k = rng.randint(1, n)
        o, c = rng.choice(["()", "[]", "{}"])
        return o + make(k - 1) + c + make(n - k)

    return make(pairs)


deep = "(" * 2000 + ")" * 2000
mixed = gen_balanced(1500)
broken = mixed[:-1] + (")" if mixed[-1] != ")" else "]")
write(
    "group-chat-chaos",
    build(
        balanced,
        [
            ("()[]{}",),
            ("lol (ok [fine] {sure})",),
            ("(]",),
            ("",),
        ],
        [
            ("(",),
            (")(",),
            ("([)]",),
            ("{[()]}",),
            ("no brackets here at all",),
            (deep,),
            (mixed,),
            (broken,),
        ],
    ),
)


# doomscroll-detector ---------------------------------------------------------
def fresh(s):
    best = 0
    for i in range(len(s)):
        seen = set()
        for j in range(i, len(s)):
            if s[j] in seen:
                break
            seen.add(s[j])
        best = max(best, len(seen))
    return best


alphabet = "abcdefghijklmnopqrstuvwxyz !?#"
long_rand = "".join(rng.choice(alphabet) for _ in range(1500))
all_distinct = "".join(chr(c) for c in range(33, 127))
write(
    "doomscroll-detector",
    build(
        fresh,
        [("abcabcbb",), ("bbbbb",), ("pwwkew",), ("",)],
        [
            ("a",),
            ("au",),
            ("dvdf",),
            ("abba",),
            ("tmmzuxt",),
            (all_distinct + all_distinct,),
            (long_rand,),
        ],
    ),
)


# the-ratio -------------------------------------------------------------------
def hours_needed(piles, k):
    return sum(-(-p // k) for p in piles)


def ratio_small(piles, hours):
    for k in range(1, max(piles) + 1):
        if hours_needed(piles, k) <= hours:
            return k
    raise AssertionError


def ratio_big(piles, hours):
    # Independent route: bisect over the monotone predicate instead of scanning.
    rng_k = range(1, max(piles) + 1)
    return 1 + bisect_left(rng_k, True, key=lambda k: hours_needed(piles, k) <= hours)


def ratio(piles, hours):
    if max(piles) <= 3000:
        a, b = ratio_small(piles, hours), ratio_big(piles, hours)
        assert a == b, (piles, hours)
        return a
    return ratio_big(piles, hours)


many = [rng.randint(1, 10**9) for _ in range(1500)]
write(
    "the-ratio",
    build(
        ratio,
        [
            ([3, 6, 7, 11], 8),
            ([30, 11, 23, 4, 20], 5),
            ([30, 11, 23, 4, 20], 6),
        ],
        [
            ([1], 1),
            ([10], 3),
            ([1000000000], 2),
            ([5, 5, 5, 5], 4),
            ([312884470], 312884469),
            ([rng.randint(1, 50) for _ in range(30)], 45),
            (many, 1500),
            (many, 5000),
        ],
    ),
)


# delulu-scheduler ------------------------------------------------------------
def merge(plans):
    cur = [list(p) for p in plans]
    changed = True
    while changed:
        changed = False
        for i in range(len(cur)):
            for j in range(i + 1, len(cur)):
                a, b = cur[i], cur[j]
                if a[0] <= b[1] and b[0] <= a[1]:
                    cur[i] = [min(a[0], b[0]), max(a[1], b[1])]
                    del cur[j]
                    changed = True
                    break
            if changed:
                break
    return sorted(cur)


def gen_plans(n, span):
    plans = []
    for _ in range(n):
        s = rng.randint(0, span)
        plans.append([s, s + rng.randint(0, 6)])
    return plans


write(
    "delulu-scheduler",
    build(
        merge,
        [
            ([[1, 3], [8, 10], [2, 6], [15, 18]],),
            ([[1, 4], [4, 5]],),
            ([[1, 10], [2, 3], [4, 5]],),
            ([],),
        ],
        [
            ([[5, 5]],),
            ([[5, 5], [5, 5]],),
            ([[6, 7], [1, 2], [3, 4]],),
            ([[-5, -1], [-2, 3], [4, 4]],),
            ([[0, 0], [1, 1], [2, 2]],),
            (gen_plans(120, 400),),
        ],
    ),
)


# final-boss-the-algorithm ----------------------------------------------------
def edit(a, b):
    @lru_cache(maxsize=None)
    def go(i, j):
        if i == len(a):
            return len(b) - j
        if j == len(b):
            return len(a) - i
        if a[i] == b[j]:
            return go(i + 1, j + 1)
        return 1 + min(go(i + 1, j), go(i, j + 1), go(i + 1, j + 1))

    return go(0, 0)


def rand_word(n):
    return "".join(rng.choice("abcd") for _ in range(n))


w1 = rand_word(140)
w2 = list(w1)
for _ in range(25):
    w2[rng.randrange(len(w2))] = rng.choice("abcd")
w2 = "".join(w2)
write(
    "final-boss-the-algorithm",
    build(
        edit,
        [("horse", "ros"), ("intention", "execution"), ("same", "same"), ("", "abc")],
        [
            ("", ""),
            ("a", ""),
            ("a", "b"),
            ("kitten", "sitting"),
            ("sunday", "saturday"),
            ("abc", "cba"),
            (w1, w2),
            (rand_word(150), rand_word(130)),
        ],
    ),
)
