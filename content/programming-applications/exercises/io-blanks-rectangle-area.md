---
slug: io-blanks-rectangle-area
type: correct_code
ask: blanks
title: The area of a rectangle
lesson: input-processing-and-output
difficulty: easy
updated: 2026-10-16
---

## Question

The program reads the width and the height of a rectangle in metres and prints its area. The sizes can have a decimal point, such as `2.5`. Fill in the **two blanks**.

## Code

```python
width = ___(input())
height = ___(input())
area = width * height
print("Area:", area)
```

## Expected behavior

The user types the width, then the height. For `2.5` and `4` the program prints `Area: 10.0`.

## Tests

### 2.5 by 4

```input
2.5
4
```

```output
Area: 10.0
```

### 3 by 1.5

```input
3
1.5
```

```output
Area: 4.5
```

## Solution

```python
width = float(input())
height = float(input())
area = width * height
print("Area:", area)
```

## Hints

- The typed text must become a number before you can multiply.
- Which conversion accepts `2.5`?

## Explanation

Both blanks are `float`. `input()` gives text, and `float()` turns it into a decimal number. `int()` would stop with a `ValueError` for `2.5`, because it only accepts whole numbers.

Because the sizes are floats, the area is a float too: 2.5 × 4.0 is printed as `10.0`.
