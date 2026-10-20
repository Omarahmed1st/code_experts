---
slug: cvn-trace-blur-rows
type: trace
compare: normalize_whitespace
title: Median and average on one row
lesson: smoothing-and-noise
difficulty: hard
updated: 2026-10-16
---

## Question

`row` is a tiny grayscale image, 1 pixel tall and 8 wide, with one white dot (255) and one black dot (0). Both filters look at each pixel and its left and right neighbours. What exactly does the program print?

## Code

```python
import cv2
import numpy as np

row = np.array([[20, 20, 255, 20, 20, 0, 20, 20]], dtype=np.uint8)
print(cv2.medianBlur(row, 3))
print(cv2.blur(row, (3, 1)))
```

## Answer

```output
[[20 20 20 20 20 20 20 20]]
[[20 98 98 98 13 13 13 20]]
```

## Hints

- For the median: of three neighbours, which value is in the middle when one of them is 255?
- For the average: (20 + 255 + 20) ÷ 3, rounded to a whole number so it can be stored.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 4 | a 1 × 8 grayscale image | | |
| 5 | every group of three has 20 in the middle when sorted | | [[20 20 20 20 20 20 20 20]]\n |
| 6 | the 255 makes three averages 98; the 0 makes three averages 13 | | [[20 98 98 98 13 13 13 20]]\n |

## Explanation

**Median:** around the white dot the groups are (20, 20, 255), (20, 255, 20) and (255, 20, 20). Sorted, each one has **20** in the middle. The same happens around the black dot. Both dots are gone and nothing else changed.

**Average:** every group that contains the 255 averages to (20 + 20 + 255) ÷ 3 = 98.3, stored as **98**: one white dot became three light-grey pixels. Every group with the 0 averages to 40 ÷ 3 = 13.3, stored as **13**: one black dot became three dark-grey pixels. The average filter spreads the noise; the median removes it.
