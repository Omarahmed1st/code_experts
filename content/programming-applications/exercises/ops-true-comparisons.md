---
slug: ops-true-comparisons
type: mcq
multiple: true
title: Which comparisons are True?
lesson: numbers-operators-and-decisions
difficulty: medium
updated: 2026-10-16
---

## Question

`x` holds the number 10. Which of these comparisons give `True`? Pick **all** that do.

## Options

- [x] `x >= 10`
  True: "greater than **or equal to**" includes 10 itself.
- [x] `x != 5`
  True: `!=` means "not equal to", and 10 is not 5.
- [ ] `x < 10`
  False: 10 is not less than itself.
- [ ] `x == "10"`
  False: `"10"` in quotes is text, and a number is never equal to a String.

## Explanation

| Comparison | Means | With x = 10 |
|---|---|---|
| `x >= 10` | greater than or equal to | True |
| `x != 5` | not equal to | True |
| `x < 10` | less than | False |
| `x == "10"` | equal to the text "10" | False |

The last one is a common trap with `input()`: a typed `10` is the String `"10"` until you convert it with `int()`.
