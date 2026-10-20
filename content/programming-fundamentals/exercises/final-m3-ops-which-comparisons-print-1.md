---
slug: final-m3-ops-which-comparisons-print-1
type: mcq
title: Which comparisons print 1?
lesson: operators
difficulty: hard
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

A program starts with `int a = 9, b = 4;`. Each option is one more line after it. Work out both sides of the comparison first, the way C++ does with two `int` values, then compare.

Which lines print `1`? Pick **all** of them.

## Options

- [x] `cout << (a / b == 2);`
  Right: `9 / 4` is int / int, so it is 2 (the .25 is cut off). `2 == 2` is TRUE, printed as `1`.
- [x] `cout << (a - b * 2 == a % b);`
  Right: the left side is 9 − (4 × 2) = 1, because `*` comes before `-`. The right side is `9 % 4` = 1. `1 == 1` is TRUE.
- [ ] `cout << (a / b == 2.25);`
  It prints `0`. `a / b` is worked out as int / int **before** the comparison, so it is 2, not 2.25. `2 == 2.25` is FALSE.
- [ ] `cout << (a / 2 * 2 == a);`
  It prints `0`. `9 / 2` is 4 (int / int), and `4 * 2` is 8. `8 == 9` is FALSE. This comparison is TRUE only for even numbers.

## Hints

- Is `9 / 4` equal to 2.25 in C++ when both numbers are `int`?
- In `a - b * 2`, which operator goes first?

## Explanation

A comparison is done **last**, after both sides have been calculated, and `cout` prints TRUE as `1` and FALSE as `0`.

- `a / b` is int / int: 9 / 4 = 2, with the remainder thrown away. So `a / b == 2` is TRUE, and `a / b == 2.25` is FALSE. The int division happens first; comparing with a decimal number afterwards doesn't bring the .25 back.
- `a - b * 2` is 9 − 8 = 1 (multiplication before subtraction), and `a % b` is the remainder of 9 / 4, also 1. So that comparison is TRUE. This is no accident: 9 = 4 × 2 + 1.
- `a / 2 * 2` goes left to right: 9 / 2 = 4, then 4 × 2 = 8. Dividing and multiplying by 2 loses the remainder, so for the odd number 9 you get 8, and `8 == 9` is FALSE.
