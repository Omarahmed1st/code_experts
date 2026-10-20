---
slug: ops-precedence
type: mcq
title: Which operator goes first?
lesson: numbers-operators-and-decisions
difficulty: medium
updated: 2026-10-16
---

## Question

What does this line print?

## Code

```python
print(10 - 2 * 3 + 4 // 2)
```

## Options

- [x] `6`
  Right: `2 * 3` is 6 and `4 // 2` is 2 first, then 10 − 6 + 2 = 6.
- [ ] `26`
  That is `(10 - 2) * 3 + 4 // 2`: it does the subtraction first, as if it had brackets.
- [ ] `14`
  That works strictly from left to right: ((10 − 2) × 3 + 4) // 2. Python doesn't do that.
- [ ] `3`
  That is `10 - 2 * (3 + 4) // 2`: it adds 3 and 4 first, as if they had brackets.

## Answer

```output
6
```

## Hints

- `*`, `/`, `//` and `%` come before `+` and `-`.
- Operators of the same level go from left to right.

## Explanation

Python follows the usual order of operations:

1. `*` and `//` first: `2 * 3` is 6, and `4 // 2` is 2.
2. Then `-` and `+`, from left to right: 10 − 6 = 4, and 4 + 2 = **6**.

When you aren't sure, add brackets: `10 - (2 * 3) + (4 // 2)` means the same and is easier to read.
