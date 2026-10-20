---
slug: cvm-trace-crosscheck
type: trace
title: Cross-checking by hand
lesson: feature-matching
difficulty: medium
updated: 2026-10-16
---

## Question

Image A and image B each have 4 features. `best_for_a[i]` is the B feature that A's feature `i` matches best, and `best_for_b[j]` is the A feature that B's feature `j` matches best. The program keeps only the pairs that choose each other. What exactly does it print?

## Code

```python
best_for_a = [2, 0, 1, 3]
best_for_b = [1, 2, 0, 0]
kept = 0
for i in range(len(best_for_a)):
    j = best_for_a[i]
    if best_for_b[j] == i:
        print("A", i, "<-> B", j)
        kept = kept + 1
print(kept, "matches kept")
```

## Answer

```output
A 0 <-> B 2
A 1 <-> B 0
A 2 <-> B 1
3 matches kept
```

## Hints

- For each `i`, look up `j`, then check whether B's feature `j` points back to `i`.
- A's feature 3 likes B's feature 3. Whom does B's feature 3 like?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 3 | nothing kept yet | kept = 0 | |
| 5 | A0 likes B2 | i = 0; j = 2 | |
| 6 | B2 likes A0: they agree | i = 0; j = 2 | |
| 7 | | | A 0 <-> B 2\n |
| 8 | | kept = 1 | |
| 5 | A1 likes B0 | i = 1; j = 0 | |
| 6 | B0 likes A1: they agree | i = 1; j = 0 | |
| 7 | | | A 1 <-> B 0\n |
| 8 | | kept = 2 | |
| 5 | A2 likes B1 | i = 2; j = 1 | |
| 6 | B1 likes A2: they agree | i = 2; j = 1 | |
| 7 | | | A 2 <-> B 1\n |
| 8 | | kept = 3 | |
| 5 | A3 likes B3 | i = 3; j = 3 | |
| 6 | B3 likes A0, not A3: dropped | i = 3; j = 3 | |
| 9 | | kept = 3 | 3 matches kept\n |

## Explanation

This is what `crossCheck=True` does inside `BFMatcher`. Three pairs choose each other and are kept. A3's best match is B3, but B3's best match is A0, so the pair A3–B3 is one-sided and is dropped.
