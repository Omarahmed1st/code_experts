---
slug: cvp-rgb2gray-mistake
type: mcq
title: BGR2GRAY or RGB2GRAY?
lesson: grayscale-images
difficulty: hard
updated: 2026-10-16
---

## Question

The car pixel from `street.png` is converted twice, once with each code. What does the program print?

## Code

```python
import cv2
import numpy as np

car = np.array([[[60, 60, 200]]], dtype=np.uint8)  # one pixel, B G R
print(cv2.cvtColor(car, cv2.COLOR_BGR2GRAY)[0, 0])
print(cv2.cvtColor(car, cv2.COLOR_RGB2GRAY)[0, 0])
```

## Options

- [x] `102`, then `76`
  Right: `RGB2GRAY` reads the first number as red, so the car's 200 gets blue's small weight.
- [ ] `102`, then `102`
  The code tells `cvtColor` which number is red. Swapping it changes which weight each number gets.
- [ ] `76`, then `102`
  The car is red (R = 200 is the last number in BGR). `BGR2GRAY` reads it correctly and gives the brighter value.
- [ ] `102`, then an error, because an OpenCV image can't be RGB
  `cvtColor` can't tell which order the numbers are in; it trusts the code you give it.

## Answer

```output
102
76
```

## Explanation

- `COLOR_BGR2GRAY` reads `[60, 60, 200]` as B = 60, G = 60, R = 200: 0.299 × 200 + 0.587 × 60 + 0.114 × 60 = 101.86, so **102**.
- `COLOR_RGB2GRAY` reads the same numbers as R = 60, G = 60, B = 200: 0.299 × 60 + 0.587 × 60 + 0.114 × 200 = 75.96, so **76**.

No error warns you. OpenCV images are BGR, so always use `COLOR_BGR2GRAY` on them.
