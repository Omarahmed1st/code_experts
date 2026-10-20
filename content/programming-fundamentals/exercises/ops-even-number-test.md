---
slug: ops-even-number-test
type: mcq
title: Testing for an even number
lesson: operators
difficulty: easy
updated: 2026-10-10
---

## Question

`n` is an `int`. Which comparison is TRUE exactly when `n` is an **even** number?

## Options

- [x] `n % 2 == 0`
  Right: an even number divided by 2 leaves nothing over, so the remainder is 0.
- [ ] `n % 2 == 1`
  This is TRUE when 1 is left over, which means `n` is odd.
- [ ] `n / 2 == 0`
  `/` gives the whole part, not the remainder. For example, `8 / 2` is 4, so this is FALSE for 8 even though 8 is even.
- [ ] `n % 2 = 0`
  A single `=` means store, not compare. To ask "is it equal to 0?" you need `==`.

## Hints

- Which operator gives the remainder after division?
- What is left over when you divide an even number by 2?

## Explanation

A number is even when dividing it by 2 leaves **no remainder**. The `%` operator gives the remainder, so `n % 2` is 0 for even numbers and 1 for odd numbers. For example, `8 % 2` is 0 and `7 % 2` is 1.

To check the remainder you compare it with `==`, which gives TRUE or FALSE: `n % 2 == 0`. A single `=` would mean "store", which is not a question.
