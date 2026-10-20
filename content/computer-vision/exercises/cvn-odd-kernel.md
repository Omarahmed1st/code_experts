---
slug: cvn-odd-kernel
type: mcq
title: Which call runs?
lesson: smoothing-and-noise
difficulty: medium
updated: 2026-10-16
---

## Question

`img` is a loaded image. Which line runs **without an error**?

## Options

- [x] `cv2.GaussianBlur(img, (7, 7), 0)`
  Right: an odd kernel size, given as (width, height), with sigma 0.
- [ ] `cv2.GaussianBlur(img, (6, 6), 0)`
  6 is even, so the kernel has no centre pixel. OpenCV stops with an assertion error.
- [ ] `cv2.medianBlur(img, (7, 7))`
  `medianBlur` takes **one number**: its kernel is always square. A tuple is an error.
- [ ] `cv2.medianBlur(img, 6)`
  One number is right, but it must be odd.

## Explanation

Every smoothing kernel needs a **centre pixel**, so its sizes must be odd: 3, 5, 7… The two functions take the size in different forms:

| Function | Size |
|---|---|
| `cv2.GaussianBlur(img, (k, k), 0)` | a tuple, (width, height) |
| `cv2.medianBlur(img, k)` | one number |
