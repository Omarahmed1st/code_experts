---
slug: final-debug-which-loops-never-stop
type: mcq
title: Which loops never stop?
lesson: loops-with-decisions-and-debugging
difficulty: hard
multiple: true
updated: 2026-10-10
reserved: true
---

## Question

Each option is a loop from a C++ program. Which of these loops **never stop**? Pick **all** of them.

## Options

- [x] `int i = 1; while (i <= 5) cout << i; i++;`
  Right: without braces, only `cout << i;` is inside the loop. `i++` would only run after the loop, so `i` stays 1 forever.
- [ ] `int x = 10; while (x > 0) { cout << x; x -= 3; }`
  This one stops. `x` goes 10, 7, 4, 1, -2. It never equals 0, but the condition is `x > 0`, and `-2 > 0` is FALSE.
- [x] `int i = 1; do { cout << i; i += 2; } while (i != 6);`
  Right: `i` goes 1, 3, 5, 7, 9 … It jumps over 6, so `i != 6` stays TRUE forever.
- [x] `int i = 0; while (i <= 5) { cout << i; i = i * 2; }`
  Right: there is an update, but 0 × 2 is still 0. `i` never changes, so `0 <= 5` is always TRUE.

## Hints

- For each loop, write the first few values of the variable in the condition. Do they move toward making the condition FALSE?
- Which statements are really inside the loop when there are no braces?

## Explanation

A loop stops only when its condition becomes FALSE, so the update must move the variable **toward** that point.

- **Missing braces:** only the first statement after `while ( )` repeats. `i++;` is outside the loop, so `i` never changes. This is one of the six common loop mistakes from the debugging lecture.
- **`x -= 3` with `x > 0`:** `x` skips over 0, but `>` doesn't need an exact match. As soon as `x` is negative, the condition is FALSE. This loop stops after printing 10, 7, 4 and 1.
- **`i != 6` with steps of 2 from 1:** `i` is always odd, so it never equals 6. A `!=` condition only stops on an exact match; `i < 6` would have stopped.
- **`i = i * 2` starting at 0:** the update runs, but it doesn't change anything, because 0 times anything is 0. Always check that the update really moves the variable.
