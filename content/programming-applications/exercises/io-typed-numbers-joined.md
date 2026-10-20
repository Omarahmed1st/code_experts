---
slug: io-typed-numbers-joined
type: mcq
title: Adding two typed numbers
lesson: input-processing-and-output
difficulty: easy
updated: 2026-10-16
---

## Question

The user runs this program and types `4`, then `5`. What does the last line print?

## Code

```python
a = input("First: ")
b = input("Second: ")
print(a + b)
```

## Options

- [x] `45`
  Right: `input()` always gives text, so `a` is `"4"` and `b` is `"5"`, and `+` joins the two Strings.
- [ ] `9`
  That needs numbers. Convert first: `int(input("First: "))`.
- [ ] `4 5`
  `+` joins Strings with nothing between them. A space would only appear with `print(a, b)`.
- [ ] It stops with a `TypeError`.
  Both values are Strings, so joining them works. The `TypeError` comes when you mix text and a number, as in `a + 5`.

## Hints

- What type does `input()` give back, even when the user types digits?

## Explanation

Whatever the user types, `input()` returns it as a **String**. Here `a` holds `"4"` and `b` holds `"5"`. For Strings, `+` means "join", so `a + b` is `"45"`.

To add the numbers, convert each one: `a = int(input("First: "))`. Then `a + b` is `9`.
