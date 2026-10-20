---
slug: cvp-trace-gray-shapes
type: trace
title: Shapes before and after cvtColor
lesson: grayscale-images
difficulty: easy
updated: 2026-10-16
---

## Question

`np.zeros` makes a black colour image, 400 pixels wide and 300 tall, without reading a file. What exactly does the program print?

## Code

```python
import cv2
import numpy as np

img = np.zeros((300, 400, 3), dtype=np.uint8)
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
print(img.shape)
print(gray.shape)
print(len(gray.shape))
```

## Answer

```output
(300, 400, 3)
(300, 400)
2
```

## Hints

- How many numbers does each pixel of a grayscale image hold?
- `len()` of a shape counts how many numbers are in it.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 4 | a black colour image: 300 rows, 400 columns, 3 channels | img.shape = (300, 400, 3) | |
| 5 | convert to grayscale: one number per pixel | gray.shape = (300, 400) | |
| 6 | print the colour shape | | (300, 400, 3)\n |
| 7 | print the grey shape | | (300, 400)\n |
| 8 | the grey shape has two numbers | | 2\n |

## Explanation

The height and width stay the same: the image is still 300 rows of 400 pixels. What changes is the last number. A colour pixel holds 3 numbers (B, G, R), so the shape ends with 3. A grey pixel holds just one, so the grayscale shape has **no channel dimension** at all: `(300, 400)`, two numbers.
