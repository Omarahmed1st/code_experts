---
slug: cvp-correct-pixel-to-grey
type: correct_code
title: Fix the grey value calculator
lesson: grayscale-images
difficulty: medium
updated: 2026-10-16
---

## Question

The program reads one OpenCV pixel as three numbers on one line, in OpenCV's order, and prints its grey value with **grey = 0.299 × R + 0.587 × G + 0.114 × B**, rounded. It gives wrong answers for coloured pixels. Fix it.

## Code

```python
values = input().split()
r = int(values[0])
g = int(values[1])
b = int(values[2])
grey = 0.299 * r + 0.587 * g + 0.114 * b
print(round(grey))
```

## Expected behavior

The user types the pixel as B, G and R, separated by spaces, as OpenCV stores it. For the car pixel `60 60 200` the program prints `102`.

## Tests

### the red car, 60 60 200

```input
60 60 200
```

```output
102
```

### pure blue, 255 0 0

```input
255 0 0
```

```output
29
```

### pure green, 0 255 0

```input
0 255 0
```

```output
150
```

### pure red, 0 0 255

```input
0 0 255
```

```output
76
```

## Solution

```python
values = input().split()
b = int(values[0])
g = int(values[1])
r = int(values[2])
grey = 0.299 * r + 0.587 * g + 0.114 * b
print(round(grey))
```

## Hints

- In which order does OpenCV keep a pixel's three numbers?
- Try the pure blue test by hand. Which weight should 255 get?

## Explanation

OpenCV stores **B, G, R**, so the first number typed is blue and the last is red. The program read them as R, G, B, which gives red's weight to blue and blue's weight to red. Pure green still passes, because green is in the middle either way; the other three tests fail.
