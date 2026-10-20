---
slug: cvf-value-sharpen-pixel
type: trace
ask: value
title: One sharpened pixel
lesson: sharpening-images
difficulty: medium
updated: 2026-10-16
---

## Question

The program applies the sharpening kernel to one pixel by hand. What is the value of `new` **when the last line runs**? Type the number only.

## Code

```python
centre = 90
above = 90
below = 90
left = 50
right = 90
new = 5 * centre - above - below - left - right
new = max(0, min(255, new))
print("Pixel done")
```

```python verify
centre = 90
above = 90
below = 90
left = 50
right = 90
new = 5 * centre - above - below - left - right
new = max(0, min(255, new))
print(new)
```

## Answer

```output
130
```

## Hints

- 5 × 90 first, then subtract the four neighbours.
- Is the result between 0 and 255? If it is, the last line of the calculation leaves it alone.

## Explanation

5 × 90 − 90 − 90 − 50 − 90 = 450 − 320 = **130**.

The pixel is next to a darker neighbour (50) on its left, so it sits on an edge. Sharpening makes it brighter than it was (90 → 130), which makes the edge stand out. 130 is already between 0 and 255, so `max(0, min(255, new))` doesn't change it.
