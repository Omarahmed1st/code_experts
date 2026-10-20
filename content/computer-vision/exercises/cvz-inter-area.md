---
slug: cvz-inter-area
type: mcq
title: Interpolation for shrinking
lesson: resizing-images
difficulty: medium
updated: 2026-10-16
---

## Question

You are shrinking camera frames from 1920 × 1080 to 640 × 360. Which interpolation does OpenCV's documentation recommend for **shrinking**?

## Options

- [x] `cv2.INTER_AREA`
  Right: it is the recommended choice for making images smaller.
- [ ] `cv2.INTER_CUBIC`
  INTER_CUBIC is recommended for **enlarging**, and it is slower.
- [ ] No interpolation is needed when shrinking.
  Every resize has to calculate new pixel values from the old ones. That calculation is interpolation.
- [ ] `cv2.COLOR_BGR2GRAY`
  That is a `cvtColor` code for changing colour formats, not an interpolation.

## Explanation

**Interpolation** is how `resize` calculates the new pixels. Pass it as an argument:

```python
small = cv2.resize(img, (640, 360), interpolation=cv2.INTER_AREA)
```

The default, `cv2.INTER_LINEAR`, is fine for most work. For enlarging, `INTER_CUBIC` (slower) or `INTER_LINEAR` are recommended.
