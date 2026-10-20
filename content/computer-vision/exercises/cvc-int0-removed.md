---
slug: cvc-int0-removed
type: mcq
title: Code from an older tutorial
lesson: finding-corners
difficulty: easy
updated: 2026-10-16
---

## Question

A student copies corner-drawing code from an older tutorial. With NumPy 2 it stops on this line with an `AttributeError`. What is the fix?

## Code

```python
corners = np.int0(corners)
```

## Options

- [x] Use `np.int32(corners)` instead.
  Right: `np.int0` was removed in NumPy 2, and `np.int32` works everywhere.
- [ ] Use `int(corners)` instead.
  `int()` converts one number, not a whole array of corners.
- [ ] Install OpenCV again.
  The missing name belongs to NumPy, not OpenCV.
- [ ] Remove the line: `cv2.circle` accepts decimal positions.
  `cv2.circle` needs whole-number coordinates, so a conversion is still needed.

## Explanation

`np.int0` was an old name that NumPy 2 removed, so `np.int0` no longer exists and Python reports an `AttributeError`. `np.int32(corners)` does the job: it turns the decimal positions into whole pixels.
