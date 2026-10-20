---
slug: algo-at-least-condition
type: mcq
title: Writing "at least" in C++
lesson: algorithms-steps-flowcharts-pseudocode
difficulty: easy
updated: 2026-10-10
---

## Question

A student passes when the mark is **at least 50**. How do you write this condition the way C++ needs it?

## Options

- [ ] `mark > 50`
  `>` means "greater than", so a mark of exactly 50 would not pass. "At least" includes 50.
- [x] `mark >= 50`
  Right: `>=` means "greater than or equal to", so 50 and every mark above it pass.
- [ ] `mark ≥ 50`
  This is the maths symbol. Your keyboard has no `≥` key, and C++ does not understand it. Write `>=`.
- [ ] `mark => 50`
  The order of the two symbols is wrong. C++ writes "greater than or equal to" as `>=`.

## Hints

- Should a mark of exactly 50 pass?
- In C++, the symbols for "greater than or equal to" are two keys typed together.

## Explanation

"At least 50" means 50 or more, so 50 itself must be included. That is "greater than or equal to", which C++ (and our pseudocode) writes as `>=`.

The maths symbol `≥` is not on your keyboard and is not C++. The other C++ forms are `<=` for "less than or equal to", `==` for "is equal to" and `!=` for "is not equal to".
