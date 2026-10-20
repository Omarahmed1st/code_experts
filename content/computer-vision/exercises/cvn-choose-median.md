---
slug: cvn-choose-median
type: mcq
title: Black and white dots
lesson: smoothing-and-noise
difficulty: easy
updated: 2026-10-16
---

## Question

A camera with a faulty sensor gives frames with **isolated pure black and pure white pixels** scattered over them. Which filter removes them best?

## Options

- [x] `cv2.medianBlur(img, 3)` or `cv2.medianBlur(img, 5)`
  Right: each dot is an extreme value in its neighbourhood, so the median ignores it.
- [ ] `cv2.blur(img, (5, 5))`
  An average filter spreads each dot into a lighter or darker smudge instead of removing it.
- [ ] `cv2.GaussianBlur(img, (5, 5), 0)`
  A weighted average still adds the extreme values in. It works well for fine grain on every pixel, not for isolated dots.
- [ ] `cv2.resize(img, None, fx=0.5, fy=0.5)`
  Shrinking makes the image smaller, but noisy pixels still mix into the result.

## Explanation

This is **salt-and-pepper noise**. The median filter sorts each neighbourhood and **picks** the middle value, so a lone 0 or 255 is never chosen. On the lecture's noisy street image, a 5 × 5 median removed all 9,192 dots.

| Noise | Good choice |
|---|---|
| salt and pepper | `cv2.medianBlur` |
| fine grain on every pixel | `cv2.GaussianBlur` |
