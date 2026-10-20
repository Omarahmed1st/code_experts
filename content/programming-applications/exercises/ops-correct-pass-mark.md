---
slug: ops-correct-pass-mark
type: correct_code
title: Fix the pass mark check
lesson: numbers-operators-and-decisions
difficulty: easy
updated: 2026-10-16
---

## Question

The program reads a mark and prints `Pass` for 50 or more, and `Fail` otherwise. Python refuses to run it. Find the **two** mistakes on the `if` line and fix them.

## Code

```python
mark = int(input())
if mark => 50
    print("Pass")
else:
    print("Fail")
```

## Expected behavior

The user types a whole-number mark. The program prints `Pass` when the mark is 50 or more, and `Fail` when it is below 50.

## Tests

### 75

```input
75
```

```output
Pass
```

### exactly 50

```input
50
```

```output
Pass
```

### 49

```input
49
```

```output
Fail
```

## Solution

```python
mark = int(input())
if mark >= 50:
    print("Pass")
else:
    print("Fail")
```

## Also accepted

```python
mark = int(input())
if mark > 49:
    print("Pass")
else:
    print("Fail")
```

## Hints

- How is "greater than or equal to" written in Python? Which symbol comes first?
- Compare the `if` line with the `else` line. What does the `else` line end with?

## Explanation

1. "Greater than or equal to" is written `>=`, with the `>` first. `=>` is not an operator in Python.
2. The `if` line must end with a **colon**, just like the `else` line.

Both are grammar mistakes, so Python reports a `SyntaxError` before running any line. With `>=`, a mark of exactly 50 passes; `mark > 50` would wrongly fail it.
