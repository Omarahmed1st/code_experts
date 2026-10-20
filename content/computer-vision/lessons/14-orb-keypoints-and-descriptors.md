---
slug: orb-keypoints-and-descriptors
title: ORB keypoints and descriptors
topic: feature-detection
lecture: 3
difficulty: medium
description: Go from corners to keypoints. Use ORB to find keypoints (where a feature is) and descriptors (what it looks like), draw them, and look inside one descriptor's 256 bits.
objectives:
  - Explain the difference between a keypoint and a descriptor
  - Detect ORB keypoints and compute descriptors with detectAndCompute
  - Draw keypoints with cv2.drawKeypoints
  - Read a keypoint's position, size and angle, and a descriptor's 32 numbers
prerequisites:
  - Finding corners with Shi-Tomasi
related:
  - finding-corners
  - feature-matching
updated: 2026-10-15
---

## [explanation] From corners to keypoints

A corner tells us **where** something interesting is. To find the same point in **another** image, we also need to know **what it looks like**. ORB gives us both:

**Image → feature detector → important locations: keypoints**

**ORB** (Oriented FAST and Rotated BRIEF) is a free, fast detector built into OpenCV. It can:

1. **detect** important keypoints, and
2. **describe** the appearance around each keypoint.

| | Answers | Example |
|---|---|---|
| **Keypoint** | **where** is the feature? | position (728, 325), size 31 pixels, angle 15° |
| **Descriptor** | **what** does the feature look like? | 32 numbers from 0 to 255 |

An easy way to remember it: the keypoint is the **address**, the descriptor is the **fingerprint**.

## [code] Detecting keypoints with ORB

```python program
import cv2

img = cv2.imread("street.png")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
orb = cv2.ORB_create()
keypoints, descriptors = orb.detectAndCompute(gray, None)
print(len(keypoints))
print(descriptors.shape)
output = cv2.drawKeypoints(img, keypoints, None)
cv2.imshow("ORB Keypoints", output)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

```output
501
(501, 32)
```

```notes
5 | ORB_create | makes the detector | circle sky
6 | detectAndCompute | keypoints and descriptors | square yel
6 | None | no mask: the whole image | diamond green
9 | drawKeypoints | a circle on each one | circle green
```

## [diagram] ORB keypoints on the street

![The street scene with about 500 small coloured circles. They cluster on the windows of the first and third buildings, the stop sign, the car and the dashed centre line, with some on the road's stones, the house roof and the mountain tops. There are almost none in the sky, on the grass or on the plain walls](images/cv-orb.png)

## [explanation] What each function does

| Function | What it does |
|---|---|
| `cv2.ORB_create()` | makes an ORB detector with default settings |
| `orb.detectAndCompute(gray, None)` | finds the keypoints **and** computes their descriptors; `None` means "search the whole image" (no mask) |
| `cv2.drawKeypoints(img, keypoints, None)` | draws a small circle on each keypoint, on a copy of the image |

ORB aims for **500 keypoints** by default. The exact number can come out slightly different: on `street.png` it returned **501**. Ask for more with `cv2.ORB_create(nfeatures=1000)`.

The descriptor array is `(501, 32)`: **one row per keypoint**, 32 numbers per row. Row 0 describes `keypoints[0]`, row 1 describes `keypoints[1]`, and so on.

Notice where the keypoints cluster: on the windows, the sign, the car and the lane dashes, where there is detail. Smooth areas get almost none.

## [code] Inside one keypoint and its descriptor

```python program
import cv2
import numpy as np

img = cv2.imread("street.png")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
orb = cv2.ORB_create()
keypoints, descriptors = orb.detectAndCompute(gray, None)
kp = keypoints[0]
print("position:", kp.pt)
print("size:", kp.size)
print("angle:", round(kp.angle))
print("descriptor:", descriptors[0][:6])
print("bits:", np.unpackbits(descriptors[0])[:16])
```

```output
position: (728.0, 325.0)
size: 31.0
angle: 15
descriptor: [193 185 168  63 176 141]
bits: [1 1 0 0 0 0 0 1 1 0 1 1 1 0 0 1]
```

```notes
8 | keypoints[0] | the first keypoint | circle sky
9 | kp.pt | (x, y) position | square yel
10 | kp.size | the area it covers | diamond green
11 | kp.angle | its orientation | tri sky
12 | descriptors[0] | its fingerprint | circle green
13 | unpackbits | numbers as bits | square sky
```

## [diagram] One keypoint, close up

![Left: a close-up of a corner of the stop sign's white border with a circle of diameter 31 pixels centred at (728, 325) and a line from the centre showing its angle of 15 degrees. Right: a 16 by 16 grid of black and white cells, the 256 bits of its descriptor, with the first row read out as 1 1 0 0 0 0 0 1 1 0 1 1 1 0 0 1](images/cv-keypoint.png)

## [explanation] Reading the keypoint and the descriptor

**The keypoint** `keypoints[0]` sits at **(728, 325)**, on a corner of the stop sign's white border. Its **size**, 31, is the diameter of the area ORB looked at, and its **angle**, about 15°, is the direction from the centre towards the brighter side of that area. Thanks to the angle, ORB can still recognise the point when the image is rotated.

**The descriptor** is 32 numbers. ORB compares the brightness of pairs of pixels around the keypoint, always the same 256 pairs, and stores each answer ("is the first pixel darker?") as one bit, 1 or 0. 256 bits are packed into 32 numbers of 8 bits each:

- 193 in binary is **1100 0001**, the first eight bits;
- 185 in binary is **1011 1001**, the next eight.

Two keypoints that look alike have descriptors with mostly the **same bits**. That is exactly what the next lesson uses to match points between two images.

## [note] Check yourself

::: check `descriptors.shape` is `(800, 32)`. How many keypoints were found, and how many bits describe each one?
???
**800 keypoints**, one per row. Each row has 32 numbers of 8 bits: **256 bits** per keypoint.
:::

::: check What is the difference between `kp.pt` and `descriptors[0]`?
???
`kp.pt` says **where** the feature is (its x, y position). `descriptors[0]` says **what it looks like** (its fingerprint), so it can be recognised in another image.
:::

## [common_mistakes] Common mistakes

- **Mixing up keypoints and descriptors.** `detectAndCompute` returns both, in that order: `keypoints, descriptors = …`.
- **Expecting exactly 500 keypoints.** 500 is ORB's target, not an exact count.
- **Reading descriptors as brightness values.** The 32 numbers are packed bits, not pixel values; compare them bit by bit.
- **Forgetting the `None` mask argument.** `orb.detectAndCompute(gray)` is an error; pass `None` to search the whole image.

## [key_takeaways] Key takeaways

- A **keypoint** says where a feature is (position, size, angle); a **descriptor** says what it looks like.
- `orb = cv2.ORB_create()` then `keypoints, descriptors = orb.detectAndCompute(gray, None)`.
- ORB's descriptors are 32 numbers = 256 bits per keypoint; the array is `(N, 32)`.
- `cv2.drawKeypoints(img, keypoints, None)` shows where they are.
