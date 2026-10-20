---
slug: cvd-trace-canny-step
type: trace
compare: normalize_whitespace
title: Canny on a two-tone image
lesson: features-and-edges
difficulty: hard
updated: 2026-10-16
---

## Question

`img` is a 50 × 50 grayscale image: the left half is 120 and the right half is 220, so there is one straight, vertical edge down the middle. `flat` is the same size, all 120. What exactly does the program print?

## Code

```python
import cv2
import numpy as np

img = np.full((50, 50), 120, dtype=np.uint8)
img[:, 25:] = 220
edges = cv2.Canny(img, 100, 200)
print(edges.shape)
print(np.unique(edges))
print(np.count_nonzero(edges))
flat = np.full((50, 50), 120, dtype=np.uint8)
print(np.count_nonzero(cv2.Canny(flat, 100, 200)))
```

## Answer

```output
(50, 50)
[  0 255]
50
0
```

## Hints

- An edge image is still an image, the same size as the input, holding only two values.
- Canny draws edges one pixel wide. How many rows does the edge run through?
- Does anything change anywhere in a flat image?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | the right half becomes 220 | | |
| 6 | Canny marks the jump from 120 to 220 | | |
| 7 | same size as the input | | (50, 50)\n |
| 8 | the different values: black and white | | [  0 255]\n |
| 9 | a one-pixel-wide line through all 50 rows | | 50\n |
| 11 | no change anywhere, so no edges | | 0\n |

## Explanation

`cv2.Canny` gives back an image the same size as its input, **(50, 50)**, with only two values: **0** (not an edge) and **255** (edge). `np.unique` lists them.

Canny doesn't compare the raw difference of 100 with the thresholds: it measures the change over a 3 × 3 neighbourhood (with the Sobel operator), which gives 400 for this jump, well above `high`, so it is a sure edge. Canny thins every edge to one pixel wide, so the edge is one white pixel in each of the 50 rows: **50** edge pixels.

The flat image has no change anywhere, so Canny finds **0** edges. Flat regions have nothing to detect.
