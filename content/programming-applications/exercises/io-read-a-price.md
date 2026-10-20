---
slug: io-read-a-price
type: mcq
title: Reading a price
lesson: input-processing-and-output
difficulty: easy
updated: 2026-10-16
---

## Question

The user will type a price such as `12.75`, and the program must calculate with it. Which line reads it correctly?

## Options

- [x] `price = float(input("Price: "))`
  Right: `input()` reads the text, then `float()` turns `"12.75"` into the number 12.75.
- [ ] `price = int(input("Price: "))`
  `int()` only accepts whole numbers. For `12.75` it stops with a `ValueError`.
- [ ] `price = input("Price: ")`
  This keeps the price as text, `"12.75"`. Calculating with it, as in `price * 2`, doesn't do arithmetic.
- [ ] `price = input(float("Price: "))`
  The brackets are the wrong way round: this tries to turn the prompt text `"Price: "` into a number, which is a `ValueError`.

## Hints

- Which conversion accepts a decimal point?
- Python runs the inner function first, then the outer one.

## Explanation

`float(input("Price: "))` works from the inside out: `input()` shows the prompt and returns what was typed, as text, and `float()` converts that text into a decimal number. Use `int()` only when the answer is always a whole number, such as an age.
