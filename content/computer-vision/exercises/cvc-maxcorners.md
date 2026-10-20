---
slug: cvc-maxcorners
type: mcq
title: More corners than the limit
lesson: finding-corners
difficulty: medium
updated: 2026-10-16
---

## Question

With `qualityLevel=0.01` and `minDistance=10`, `street.png` has 1311 corners. What does this line return?

## Code

```python
corners = cv2.goodFeaturesToTrack(gray, maxCorners=50, qualityLevel=0.01, minDistance=10)
```

## Options

- [x] The 50 strongest corners, in an array with shape `(50, 1, 2)`
  Right: `maxCorners` is a maximum, and the strongest corners are the ones kept.
- [ ] All 1311 corners, because the image has that many
  `maxCorners=50` limits the result to 50.
- [ ] The first 50 corners from the top-left of the image
  The corners are chosen by **strength**, not by position.
- [ ] An error, because the image has more corners than `maxCorners`
  Having more corners than the limit is normal. OpenCV simply keeps the best ones.

## Explanation

`maxCorners` is the **maximum** number returned, and the strongest ones win. The shape is `(N, 1, 2)`: N corners, each packed as one `[x, y]` pair. If an image has fewer corners than the limit, N is smaller, so `maxCorners` is a limit, not a promise.
