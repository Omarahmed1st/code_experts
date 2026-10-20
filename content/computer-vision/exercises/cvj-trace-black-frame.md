---
slug: cvj-trace-black-frame
type: trace
title: One black frame through the pipeline
lesson: live-camera-pipeline
difficulty: medium
updated: 2026-10-16
---

## Question

A camera gives a completely black 1280 × 720 frame (the lens cap is on). It goes through the project pipeline once. What exactly does the program print?

## Code

```python
import cv2
import numpy as np

frame = np.zeros((720, 1280, 3), dtype=np.uint8)
resized = cv2.resize(frame, (640, 480))
gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
blur = cv2.GaussianBlur(gray, (5, 5), 0)
edges = cv2.Canny(blur, 50, 150)
print(frame.shape)
print(gray.shape)
print(edges.shape, np.count_nonzero(edges))
```

## Answer

```output
(720, 1280, 3)
(480, 640)
(480, 640) 0
```

## Hints

- `resize` takes (width, height); shapes list the height first.
- Is there any change in brightness anywhere in a black frame?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 4 | a black 1280 × 720 colour frame | frame.shape = (720, 1280, 3) | |
| 5 | 640 wide, 480 tall | resized.shape = (480, 640, 3) | |
| 6 | one channel | gray.shape = (480, 640) | |
| 7 | blurring black gives black | blur.shape = (480, 640) | |
| 8 | no changes, so no edges | edges.shape = (480, 640) | |
| 9 | | | (720, 1280, 3)\n |
| 10 | | | (480, 640)\n |
| 11 | | | (480, 640) 0\n |

## Explanation

Every camera size becomes 640 × 480 after the resize, which is why the pipeline resizes first: the later steps always get the same size. Grayscale removes the channel number, and Canny gives back an image of the same size.

A black frame has no change in brightness anywhere, so Canny finds **0** edge pixels. Note that `ret` would still be `True` for this frame: the camera worked, it just saw nothing.
