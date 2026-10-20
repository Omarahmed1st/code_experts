---
slug: intro-missing-bracket-nothing-runs
type: mcq
title: A missing bracket on line 2
lesson: what-is-programming-and-why-python
difficulty: medium
updated: 2026-10-15
---

## Question

Line 2 is missing its closing bracket. What appears on the screen when this program runs?

## Code

```python
print("Start")
print("Middle"
print("End")
```

## Options

- [x] Only an error message (`SyntaxError`). Not even `Start` is printed.
  Right: a missing bracket is a grammar mistake, and Python checks the grammar of the whole file before it runs any line.
- [ ] `Start`, then an error message.
  That is what happens with a mistake found while running, such as an unknown name. A grammar mistake is found earlier, before line 1 runs.
- [ ] `Start`, `Middle` and `End`: Python adds the missing bracket.
  Python never guesses what you meant. It reports the mistake and stops.
- [ ] `Start` and `End`: Python skips line 2.
  Python doesn't skip lines it can't understand.

## Hints

- Compare this with a program that uses a name that doesn't exist. When is each kind of mistake found?

## Explanation

Before running anything, the interpreter reads the **whole file** and checks its grammar. The `(` on line 2 is never closed, so Python reports `SyntaxError: '(' was never closed` and stops. Because this check happens first, **no line runs**, not even line 1.

Compare: a `NameError` (an unknown name) is only found when Python reaches that line, so the lines above it have already printed.
