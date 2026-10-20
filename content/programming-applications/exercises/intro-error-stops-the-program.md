---
slug: intro-error-stops-the-program
type: mcq
title: What does the user see?
lesson: what-is-programming-and-why-python
difficulty: easy
updated: 2026-10-15
---

## Question

The program uses a name, `total`, that was never created. What appears on the screen when it runs?

## Code

```python
print("Start")
print("Middle")
print(total)
print("End")
```

## Options

- [x] `Start` and `Middle`, then an error message (`NameError`). `End` never appears.
  Right: Python runs the lines one by one. Lines 1 and 2 work, line 3 stops the program, and line 4 is never reached.
- [ ] Only the error message: nothing is printed because the program has a mistake.
  That happens for grammar mistakes (a missing bracket or quote). This file's grammar is fine; the problem only appears when line 3 runs.
- [ ] `Start`, `Middle` and `End`: Python skips the broken line.
  Python never skips a line it can't run. It stops there.
- [ ] `Start`, `Middle`, the error message, then `End`.
  After an error, the program has stopped. Nothing below line 3 runs.

## Hints

- Python checks the grammar of the whole file first. Is there a grammar mistake here?
- Then it runs the lines from the top, one at a time.

## Explanation

The interpreter works in two steps. First it checks the **grammar** of the whole file: here every line is written correctly, so the program starts. Then it **executes the lines in order**:

1. `print("Start")` prints `Start`.
2. `print("Middle")` prints `Middle`.
3. `print(total)` asks for a variable called `total`, which doesn't exist. Python stops with `NameError: name 'total' is not defined`.

Line 4 never runs, so `End` is never printed.
