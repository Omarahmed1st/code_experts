---
slug: cvf-trace-sharpen-row
type: trace
compare: normalize_whitespace
title: Sharpening a small step
lesson: sharpening-images
difficulty: hard
updated: 2026-10-16
---

## Question

A tiny image has three identical rows, darker (100) on the left and brighter (160) on the right. What exactly does the program print?

## Code

```python
import cv2
import numpy as np

row = np.array([[100, 100, 100, 160, 160, 160]] * 3, dtype=np.uint8)
kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
sharp = cv2.filter2D(row, -1, kernel)
print(sharp[1])
```

## Answer

```output
[100 100  40 220 160 160]
```

## Hints

- The rows above and below are the same as the middle row, so "above" and "below" equal the centre.
- Only the two pixels on either side of the step have a neighbour that differs from them.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 4 | three equal rows: 100 100 100 160 160 160 | | |
| 6 | flat pixels stay; the last 100: 500 − 100 − 100 − 100 − 160 = 40; the first 160: 800 − 160 − 160 − 100 − 160 = 220 | | |
| 7 | print the middle row | | [100 100  40 220 160 160]\n |

## Explanation

**new = 5 × centre − above − below − left − right**

- In the flat parts, 5 × 100 − 4 × 100 = 100 and 5 × 160 − 4 × 160 = 160: nothing changes, because the kernel's numbers add up to 1.
- The last 100 has a 160 on its right: 500 − 100 − 100 − 100 − 160 = **40**, darker than before.
- The first 160 has a 100 on its left: 800 − 160 − 160 − 100 − 160 = **220**, brighter than before.

The step from 100 to 160 has become a bigger jump, from 40 to 220. That bigger jump is what looks "sharper". Both results stay inside 0 to 255 here, so nothing is clipped.
