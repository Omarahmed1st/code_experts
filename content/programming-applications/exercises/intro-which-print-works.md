---
slug: intro-which-print-works
type: mcq
title: Which line prints the greeting?
lesson: what-is-programming-and-why-python
difficulty: easy
updated: 2026-10-15
---

## Question

Which line prints exactly `Hello, World!` on the screen?

## Options

- [x] `print("Hello, World!")`
  Right: `print` in small letters, brackets, and the text inside straight quotes.
- [ ] `Print("Hello, World!")`
  Python is case-sensitive. `Print` with a capital P is not a function Python knows, so it stops with `NameError: name 'Print' is not defined`.
- [ ] `print(Hello, World!)`
  Without quotes, Python reads `Hello` and `World!` as code, not text. The `!` makes it a `SyntaxError`, so nothing runs.
- [ ] `print("Hello, World!"`
  The closing bracket is missing. Python reports `SyntaxError: '(' was never closed` before running anything.

## Hints

- Check three things on each line: the spelling of `print`, the quotes and the brackets.

## Explanation

A working `print` line needs all three parts: the function name `print` in small letters, a pair of brackets, and the text in straight quotes. Each wrong option breaks one of them:

- a capital letter in the name gives a `NameError` when Python reaches that line;
- missing quotes or a missing bracket are grammar mistakes (`SyntaxError`), found before any line runs.
