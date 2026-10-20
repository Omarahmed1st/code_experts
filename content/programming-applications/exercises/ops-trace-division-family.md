---
slug: ops-trace-division-family
type: trace
title: Four ways to combine 17 and 5
lesson: numbers-operators-and-decisions
difficulty: easy
updated: 2026-10-16
---

## Question

What exactly does this program print? Type one line of output per line.

## Code

```python
a = 17
b = 5
print(a / b)
print(a // b)
print(a % b)
print(a ** 2)
```

## Answer

```output
3.4
3
2
289
```

## Hints

- `/` always gives a float.
- 17 = 3 × 5 + 2. Which part is `//`, and which is `%`?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 3 | 17 ÷ 5, as a float | a = 17; b = 5 | 3.4\n |
| 4 | whole part of 17 ÷ 5 | a = 17; b = 5 | 3\n |
| 5 | remainder of 17 ÷ 5 | a = 17; b = 5 | 2\n |
| 6 | 17 to the power 2 | a = 17; b = 5 | 289\n |

## Explanation

- `/` divides and **always** gives a float: 3.4.
- `//` divides and drops the decimal part: 3.
- `%` gives the remainder: 17 = 3 × 5 + **2**.
- `**` is the power: 17 × 17 = 289.
