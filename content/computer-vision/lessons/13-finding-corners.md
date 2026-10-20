---
slug: finding-corners
title: Finding corners with Shi-Tomasi
topic: feature-detection
lecture: 3
difficulty: medium
description: Find the strongest corners in an image with cv2.goodFeaturesToTrack, understand its three parameters, and draw the corners as red dots.
objectives:
  - Detect corners with cv2.goodFeaturesToTrack on a grayscale image
  - Explain maxCorners, qualityLevel and minDistance
  - Convert corner positions to whole numbers and draw them with cv2.circle
  - Explain the shape (N, 1, 2) of the corners array
prerequisites:
  - Features, edges and the Canny detector
related:
  - features-and-edges
  - orb-keypoints-and-descriptors
updated: 2026-10-15
---

## [explanation] Shi-Tomasi corner detection

`cv2.goodFeaturesToTrack()` is OpenCV's **Shi-Tomasi corner detector**. It takes a grayscale image and returns the positions of the **strongest corners**: the places that change in every direction, which you met in the last lesson.

The name says what the corners are for: good features to **track**, that is, to find again in the next frame of a video.

## [code] Finding corners

```python program
import cv2

img = cv2.imread("street.png")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
corners = cv2.goodFeaturesToTrack(
    gray,
    maxCorners=100,
    qualityLevel=0.01,
    minDistance=10
)
print(corners.shape)
print(corners[0])
```

```output
(100, 1, 2)
[[710. 319.]]
```

```notes
5 | goodFeaturesToTrack | Shi-Tomasi corners | circle sky
7 | maxCorners=100 | keep at most 100 | square yel
8 | qualityLevel=0.01 | at least 1% of the best | diamond green
9 | minDistance=10 | 10 pixels apart | tri sky
```

## [explanation] The three parameters

| Parameter | Meaning |
|---|---|
| `maxCorners` | the **maximum** number of corners to return; it keeps the strongest |
| `qualityLevel` | the **minimum quality**, compared with the best corner in the image: 0.01 keeps corners at least 1% as strong as the best one |
| `minDistance` | the minimum **distance** in pixels between returned corners, so they don't bunch up |

On `street.png` it returned exactly **100**, the `maxCorners` limit: the image has more corners than that. With `maxCorners=0` (no limit) it finds 1311 with the same quality and distance; with `maxCorners=20` you get only the 20 strongest.

## [explanation] Reading the result

`corners.shape` is `(100, 1, 2)`: **100 corners**, each stored as a tiny array holding one `[x, y]` pair. The extra `1` in the middle is just how OpenCV packs points.

`corners[0]` is `[[710. 319.]]`: the strongest corner is at **x = 710, y = 319**, in the letters of the STOP sign. The dots after the numbers mean they are **decimals** (`float32`); OpenCV can find a corner's position more precisely than whole pixels.

## [code] Drawing the corners

```python program
import cv2
import numpy as np

img = cv2.imread("street.png")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
corners = cv2.goodFeaturesToTrack(gray, maxCorners=100, qualityLevel=0.01, minDistance=10)

corners = np.int32(corners)
for corner in corners:
    x, y = corner.ravel()
    cv2.circle(img, (x, y), 4, (0, 0, 255), -1)
cv2.imshow("Detected Corners", img)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

```notes
8 | np.int32 | decimals to whole pixels | circle sky
9 | for corner in corners | one corner at a time | square yel
10 | ravel | [[x, y]] becomes x, y | diamond green
11 | (0, 0, 255) | red in BGR | tri coral
11 | -1 | a filled circle | circle green
```

## [diagram] 100 corners on the street

![The street scene with 100 small filled red dots. Most sit on the window corners of the first and third buildings; others are on the stop sign's letters, the car, the tree, the two snowy peaks and a few stones on the road. There are none in the sky, on the house or along the straight road lines](images/cv-corners.png)

## [explanation] How the drawing code works

- `np.int32(corners)` turns every position into whole pixels by dropping the decimal part (710.4 and 710.9 both become 710), because `cv2.circle` needs **integer** coordinates.
- The loop visits each corner. `corner` is `[[x, y]]`; `ravel()` flattens it, so `x, y = corner.ravel()` unpacks the two numbers.
- `cv2.circle(img, (x, y), 4, (0, 0, 255), -1)` draws on `img`: **centre** `(x, y)`, **radius** 4, **colour** `(0, 0, 255)` (red, because OpenCV uses BGR) and **thickness** `-1`, which means a filled circle.

Where are there **no** dots? In the sky, on the smooth mountain sides and along the road lines: flat regions have no corners, and long straight lines are edges, not corners. Why only two of the four buildings? Their light walls make the strongest contrast with the dark windows, and only the 100 strongest corners are kept.

**Note:** older tutorials write `np.int0(corners)`. `np.int0` was removed in NumPy 2, so it fails with an `AttributeError` there. `np.int32` works everywhere.

## [note] Check yourself

::: check `goodFeaturesToTrack` returns an array with shape `(37, 1, 2)` although `maxCorners` was 100. What does that tell you?
???
The image only had **37 corners** that passed `qualityLevel` and `minDistance`, fewer than the limit. A plain image (a chessboard with few squares, a white wall) often gives fewer corners than `maxCorners`.
:::

::: check What colour is `cv2.circle(img, (x, y), 4, (255, 0, 0), -1)`?
???
**Blue.** OpenCV's colour order is B, G, R, so `(255, 0, 0)` is full blue.
:::

## [common_mistakes] Common mistakes

- **Passing a colour image.** `goodFeaturesToTrack` needs grayscale.
- **Drawing with decimal coordinates.** `cv2.circle` needs whole numbers; convert with `np.int32` first.
- **Using `np.int0`.** It doesn't exist in NumPy 2; use `np.int32`.
- **Drawing before detecting.** Detect on a clean image; red dots drawn first would become "corners" themselves.
- **Expecting exactly `maxCorners` corners.** It is a maximum, not a promise.

## [key_takeaways] Key takeaways

- `cv2.goodFeaturesToTrack(gray, maxCorners, qualityLevel, minDistance)` returns the strongest corners.
- The result has shape `(N, 1, 2)` and holds decimal `[x, y]` positions.
- Convert with `np.int32`, unpack with `ravel()`, draw with `cv2.circle(img, (x, y), 4, (0, 0, 255), -1)`.
- Corners appear where edges meet, never in flat regions or along straight lines.
