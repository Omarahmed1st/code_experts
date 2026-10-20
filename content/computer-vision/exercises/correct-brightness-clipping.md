---
slug: correct-brightness-clipping
type: correct_code
title: Fix the brightness change
lesson: brightness-and-contrast
difficulty: easy
updated: 2026-10-09
---

## Question

A small grayscale image is stored as a List of rows, and every row is a List of pixel values. This program reads a brightness change `beta`, adds it to every pixel and prints the new rows. Every new value must stay between 0 and 255.

It works when `beta` makes the image brighter, but not always when it makes it darker. Find the bug and fix the program.

## Code

```python
img = [[30, 90, 150],
       [200, 240, 255]]
beta = int(input())
for row in img:
    new_row = []
    for value in row:
        new = value + beta
        if new > 255:
            new = 255
        new_row.append(new)
    print(new_row)
```

## Expected behavior

The user types a whole number `beta` (it can be negative). The program prints each row of the image after adding `beta` to every pixel. A result above 255 is stored as 255, and a result below 0 is stored as 0. For `beta = -40` it prints:

```
[0, 50, 110]
[160, 200, 215]
```

## Tests

### brighter by 20

```input
20
```

```output
[50, 110, 170]
[220, 255, 255]
```

### darker by 40 (30 - 40 must become 0)

```input
-40
```

```output
[0, 50, 110]
[160, 200, 215]
```

### no change

```input
0
```

```output
[30, 90, 150]
[200, 240, 255]
```

## Solution

```python
img = [[30, 90, 150],
       [200, 240, 255]]
beta = int(input())
for row in img:
    new_row = []
    for value in row:
        new = value + beta
        if new > 255:
            new = 255
        if new < 0:
            new = 0
        new_row.append(new)
    print(new_row)
```

## Also accepted

```python
img = [[30, 90, 150],
       [200, 240, 255]]
beta = int(input())
for row in img:
    new_row = []
    for value in row:
        new = value + beta
        if new > 255:
            new = 255
        elif new < 0:
            new = 0
        new_row.append(new)
    print(new_row)
```

```python
img = [[30, 90, 150],
       [200, 240, 255]]
beta = int(input())
for row in img:
    new_row = []
    for value in row:
        new = max(0, min(255, value + beta))
        new_row.append(new)
    print(new_row)
```

## Hints

- Try `beta = -40` by hand on the first pixel, 30. What does the program store?
- A pixel value has two limits, not one.

## Explanation

The program only checks the **top** limit. When `beta` is negative, a dark pixel can go below 0: 30 + (-40) = -20, and the program stores -20. A pixel value can't be negative, so the result must be **clipped** to 0 (black), just as values above 255 are clipped to 255 (white).

Add a second check after the first one:

```python
if new < 0:
    new = 0
```

Or do both checks in one line: `new = max(0, min(255, value + beta))`.
