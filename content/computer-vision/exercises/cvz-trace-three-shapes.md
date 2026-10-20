---
slug: cvz-trace-three-shapes
type: trace
title: Three resized shapes
lesson: resizing-images
difficulty: medium
updated: 2026-10-16
---

## Question

`img` is a black colour image the same size as `street.png`, 960 wide and 540 tall. What exactly does the program print?

## Code

```python
import cv2
import numpy as np

img = np.zeros((540, 960, 3), dtype=np.uint8)
a = cv2.resize(img, (320, 180))
b = cv2.resize(img, (480, 640))
c = cv2.resize(img, None, fx=0.25, fy=0.5)
print(a.shape)
print(b.shape)
print(c.shape)
```

## Answer

```output
(180, 320, 3)
(640, 480, 3)
(270, 240, 3)
```

## Hints

- `resize` takes (width, height); `shape` lists the height first.
- `fx` multiplies the width and `fy` multiplies the height.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 4 | 540 rows, 960 columns | img.shape = (540, 960, 3) | |
| 5 | 320 wide, 180 tall | a.shape = (180, 320, 3) | |
| 6 | 480 wide, 640 tall: a tall image | b.shape = (640, 480, 3) | |
| 7 | width 960 × 0.25 = 240, height 540 × 0.5 = 270 | c.shape = (270, 240, 3) | |
| 8 | | | (180, 320, 3)\n |
| 9 | | | (640, 480, 3)\n |
| 10 | | | (270, 240, 3)\n |

## Explanation

The size you give `cv2.resize` is **(width, height)**, but `shape` is **(height, width, channels)**, so the two numbers always appear swapped in the shape.

- `(320, 180)` keeps the 16:9 ratio, a quarter of the size each way.
- `(480, 640)` is the "giving (height, width)" mistake: it makes a **tall** image.
- `fx=0.25, fy=0.5` uses different factors, so the picture is squeezed sideways: 240 wide and 270 tall.
