---
slug: ops-even-test
type: mcq
title: Is the number even?
lesson: numbers-operators-and-decisions
difficulty: easy
updated: 2026-10-16
---

## Question

Which condition is `True` exactly when the whole number `n` is **even**?

## Options

- [x] `n % 2 == 0`
  Right: an even number leaves no remainder when divided by 2.
- [ ] `n / 2 == 0`
  `n / 2` is half of `n`. It is only 0 when `n` itself is 0.
- [ ] `n // 2 == 0`
  `n // 2` is the whole part of `n ÷ 2`. It is 0 for 0 and 1 (and 1 is odd), and not 0 for 4.
- [ ] `n % 2 = 0`
  A single `=` stores a value; it can't compare. This line is a `SyntaxError`.

## Explanation

`n % 2` is the remainder after dividing by 2: **0 for every even number** and 1 for every odd one. Comparing it with `== 0` (two equals signs) gives `True` or `False`:

| n | n % 2 | n % 2 == 0 |
|---|---|---|
| 4 | 0 | True |
| 7 | 1 | False |
| 0 | 0 | True |
