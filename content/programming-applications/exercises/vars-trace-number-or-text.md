---
slug: vars-trace-number-or-text
type: trace
title: 7 and "7"
lesson: variables-and-data-types
difficulty: medium
updated: 2026-10-16
---

## Question

What exactly does this program print? Type one line of output per line.

## Code

```python
x = 7
y = "7"
print(type(x), type(y))
print(x + 3)
print(y + "3")
```

## Answer

```output
<class 'int'> <class 'str'>
10
73
```

## Hints

- One of the two values has quotes around it.
- `+` adds numbers, but joins Strings end to end.

## Explanation

`x` holds the number 7 (an `int`), and `y` holds the text `"7"` (a `str`), because of the quotes.

- `x + 3` adds two numbers: **10**.
- `y + "3"` joins two Strings: `"7"` followed by `"3"` is **73**. It is text, not the number seventy-three.

Mixing them, as in `y + 3`, would stop with a `TypeError`: Python won't join text to a number.
