---
slug: cvd-value-edge-percent
type: trace
ask: value
title: What share of the pixels are edges?
lesson: features-and-edges
difficulty: easy
updated: 2026-10-16
---

## Question

Canny marked 18,144 pixels as edges in a 960 × 540 image. What is the value of `percent` **when the last line runs**? Type the number only.

## Code

```python
edge_pixels = 18144
total = 960 * 540
percent = round(edge_pixels / total * 100, 1)
print("Measured")
```

```python verify
edge_pixels = 18144
total = 960 * 540
percent = round(edge_pixels / total * 100, 1)
print(percent)
```

## Answer

```output
3.5
```

## Hints

- How many pixels does a 960 × 540 image have?
- Divide, then multiply by 100 to get a percentage.

## Explanation

960 × 540 = 518,400 pixels. 18,144 ÷ 518,400 = 0.035, and × 100 that is **3.5** %. This is the same measure as `np.count_nonzero(edges) / edges.size * 100` in the lecture's experiment.
