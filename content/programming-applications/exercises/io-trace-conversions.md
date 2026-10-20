---
slug: io-trace-conversions
type: trace
title: Converting back and forth
lesson: input-processing-and-output
difficulty: medium
updated: 2026-10-16
---

## Question

What exactly does this program print? Type one line of output per line.

## Code

```python
x = "8"
y = int(x) + 2
z = str(y) + x
print(y, z)
print(float(x) / 4)
```

## Answer

```output
10 108
2.0
```

## Hints

- Write down the type of each variable: is it a number or text?
- `str()` turns a number into text, and `+` then joins.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 1 | the text "8" | x = "8" | |
| 2 | int("8") is 8, plus 2 | x = "8"; y = 10 | |
| 3 | str(10) is "10", joined with "8" | x = "8"; y = 10; z = "108" | |
| 4 | print the number and the text | x = "8"; y = 10; z = "108" | 10 108\n |
| 5 | float("8") is 8.0, divided by 4 | x = "8"; y = 10; z = "108" | 2.0\n |

## Explanation

- `int(x)` turns the text `"8"` into the number 8, so `y` is **10**.
- `str(y)` turns 10 back into the text `"10"`, and `+` joins it with `"8"`: `z` is the text **`108`**.
- `float(x)` is 8.0, and `/` always gives a float: **2.0**.
