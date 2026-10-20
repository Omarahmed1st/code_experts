---
slug: trace-alpha-beta-row
type: trace
title: Contrast and brightness on four pixels
lesson: brightness-and-contrast
difficulty: medium
updated: 2026-10-09
---

## Question

This program applies **new = alpha × old + beta** to four grayscale pixel values, then keeps each result between 0 and 255. `min(255, new)` gives the smaller of the two numbers, and `max(0, …)` gives the bigger one.

Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```python
row = [10, 100, 180, 230]
alpha = 1.5
beta = -20
for old in row:
    new = round(alpha * old + beta)
    new = max(0, min(255, new))
    print(old, "->", new)
```

## Answer

```output
10 -> 0
100 -> 130
180 -> 250
230 -> 255
```

## Hints

- Work out 1.5 × old first, then subtract 20.
- `min(255, new)` stops values above 255. `max(0, …)` stops values below 0.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 4 | first pixel | old = 10 | |
| 5 | 1.5 × 10 - 20 = -5 | old = 10; new = -5 | |
| 6 | -5 is below 0, so it becomes 0 | old = 10; new = 0 | |
| 7 | print | old = 10; new = 0 | 10 -> 0\n |
| 5 | 1.5 × 100 - 20 = 130 | old = 100; new = 130 | |
| 6 | 130 is already between 0 and 255 | old = 100; new = 130 | |
| 7 | print | old = 100; new = 130 | 100 -> 130\n |
| 5 | 1.5 × 180 - 20 = 250 | old = 180; new = 250 | |
| 6 | 250 is already between 0 and 255 | old = 180; new = 250 | |
| 7 | print | old = 180; new = 250 | 180 -> 250\n |
| 5 | 1.5 × 230 - 20 = 325 | old = 230; new = 325 | |
| 6 | 325 is above 255, so it becomes 255 | old = 230; new = 255 | |
| 7 | print | old = 230; new = 255 | 230 -> 255\n |

## Explanation

`alpha = 1.5` raises the contrast: it pushes the values apart. `beta = -20` makes everything a little darker. `round()` turns each result into a whole number, like a real pixel value.

Two results fall outside 0 to 255. The darkest pixel gives -5 and is **clipped** up to 0 (black). The brightest gives 325 and is clipped down to 255 (white). Line 6 is what keeps the values safe: without it, -5 and 325 could never be stored in a `uint8` image. `cv2.convertScaleAbs` does this saturation for you, except that it turns a negative result into its absolute value (-5 would become 5).
