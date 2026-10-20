---
slug: vars-trace-copy-then-change
type: trace
title: Copy a value, then change it
lesson: variables-and-data-types
difficulty: easy
updated: 2026-10-16
---

## Question

What exactly does this program print?

## Code

```python
a = 5
b = a
a = a + 3
b = b * 2
print(a, b)
```

## Answer

```output
8 10
```

## Hints

- `b = a` copies the value that `a` holds **at that moment**.
- Work out the right side of each `=` first, then store it.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 1 | store 5 in a | a = 5 | |
| 2 | copy a's value, 5, into b | a = 5; b = 5 | |
| 3 | 5 + 3 = 8, stored back in a | a = 8; b = 5 | |
| 4 | 5 × 2 = 10, stored back in b | a = 8; b = 10 | |
| 5 | print both, with a space between | a = 8; b = 10 | 8 10\n |

## Explanation

`b = a` doesn't join the two variables together: it copies the number 5 into `b`. After that, each box changes on its own. Line 3 changes only `a` (to 8), and line 4 changes only `b` (to 10).

`a = a + 3` and `b = b * 2` use the old value on the right to make the new one, which then replaces it.
