---
slug: vars-which-is-float
type: mcq
title: Which value is a float?
lesson: variables-and-data-types
difficulty: easy
updated: 2026-10-16
---

## Question

Which line prints `<class 'float'>`?

## Options

- [x] `print(type(20.0))`
  Right: a number with a decimal point is a `float`, even when the decimal part is 0.
- [ ] `print(type(20))`
  A whole number without a decimal point is an `int`: it prints `<class 'int'>`.
- [ ] `print(type("20.5"))`
  The quotes make it text, so it prints `<class 'str'>`, however much it looks like a number.
- [ ] `print(type(True))`
  `True` is a Boolean: it prints `<class 'bool'>`.

## Explanation

Python decides the type from how the value is written:

| Value | Type |
|---|---|
| `20` | `int` |
| `20.0` | `float` |
| `"20.5"` | `str` (quotes) |
| `True` | `bool` |

The decimal point is what makes `20.0` a float.
