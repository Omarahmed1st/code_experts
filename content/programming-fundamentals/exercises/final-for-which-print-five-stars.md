---
slug: final-for-which-print-five-stars
type: mcq
title: Which loops print five stars?
lesson: for-loops
difficulty: hard
multiple: true
updated: 2026-10-10
reserved: true
---

## Question

Each option is a loop that prints stars `*`. Which loops print **exactly 5** stars? Pick **all** the correct ones.

## Options

- [x] `for (int i = 0; i < 5; i++) { cout << "*"; }`
  Right: `i` is 0, 1, 2, 3 and 4. At 5, `5 < 5` is FALSE. That is 5 passes.
- [x] `for (int i = 1; i <= 10; i += 2) { cout << "*"; }`
  Right: `i` is 1, 3, 5, 7 and 9. At 11, `11 <= 10` is FALSE. That is 5 passes.
- [ ] `for (int i = 10; i >= 0; i -= 2) { cout << "*"; }`
  `i` is 10, 8, 6, 4, 2 **and 0**: `0 >= 0` is TRUE. That is 6 stars, one too many.
- [ ] `int i = 0; do { cout << "*"; i += 5; } while (i < 20);`
  The body runs with `i` = 0, 5, 10 and 15. After that `i` is 20, and `20 < 20` is FALSE. That is only 4 stars.

## Hints

- For each loop, list the values of the counter for which the body runs. Count the list.
- Look carefully at the last value: does `<`, `<=` or `>=` include it?

## Explanation

To count the passes of a loop, list the values of the counter that make the condition TRUE.

- `i = 0` to `i < 5`: 0, 1, 2, 3, 4 → 5 passes. Starting at 0 with `<` gives the same count as starting at 1 with `<=`.
- `i = 1`, `i <= 10`, `i += 2`: 1, 3, 5, 7, 9 → 5 passes. The step changes the count.
- `i = 10`, `i >= 0`, `i -= 2`: 10, 8, 6, 4, 2, 0 → 6 passes. The `>=` includes 0, which is an off-by-one error if 5 was the goal.
- The `do-while` prints first and checks after: it runs with 0, 5, 10, 15 → 4 passes. When `i` reaches 20, `20 < 20` is FALSE.

Off-by-one errors come from the start value and from `<` versus `<=`. Checking the first and the last pass is the quickest way to catch them.
