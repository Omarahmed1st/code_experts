---
slug: cvp-value-grey-by-formula
type: trace
ask: value
title: A pixel's grey value by hand
lesson: grayscale-images
difficulty: medium
updated: 2026-10-16
---

## Question

An OpenCV pixel holds `[200, 100, 50]`. The program works out its grey value with the formula from the lecture. What is the value of `grey` **when the last line runs**? Type the number only.

## Code

```python
pixel = [200, 100, 50]
b, g, r = pixel
grey = round(0.299 * r + 0.587 * g + 0.114 * b)
print("Converted")
```

```python verify
pixel = [200, 100, 50]
b, g, r = pixel
grey = round(0.299 * r + 0.587 * g + 0.114 * b)
print(grey)
```

## Answer

```output
96
```

## Hints

- OpenCV keeps the channels in the order B, G, R. Which value is the red one?
- Multiply each channel by its own weight, add the three results, then round.

## Explanation

In OpenCV order the pixel is B = 200, G = 100 and R = 50: a mostly **blue** pixel.

0.299 × 50 + 0.587 × 100 + 0.114 × 200 = 14.95 + 58.7 + 22.8 = 96.45, which rounds to **96**.

If you got 124, you read the pixel as R, G, B: 0.299 × 200 + 0.587 × 100 + 0.114 × 50 = 124.2. That is the grey value of a mostly red pixel, not this one.
