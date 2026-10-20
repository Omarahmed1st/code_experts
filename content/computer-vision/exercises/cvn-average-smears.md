---
slug: cvn-average-smears
type: mcq
title: Why the average blur made it worse
lesson: smoothing-and-noise
difficulty: medium
updated: 2026-10-16
---

## Question

In the lecture, the average error of the noisy street image was 5.1. After `cv2.blur(noisy, (5, 5))` it was **8.2**, worse than doing nothing. Why?

## Options

- [x] The average spreads every dot into a smudge, and also blurs the real details.
  Right: the dots are not removed, only spread out, and the picture itself gets softer.
- [ ] `cv2.blur` only works on grayscale images.
  It works on colour images too, channel by channel.
- [ ] A 5 × 5 kernel is even, so the result is shifted.
  5 is odd. The kernel has a centre pixel.
- [ ] The average error can't be compared between filters.
  It can: each result was compared with the same clean image, so smaller is better.

## Explanation

Each salt or pepper dot is an extreme value. An average filter adds it into every one of its neighbours' new values, so one wrong pixel becomes a 5 × 5 patch of slightly wrong pixels. At the same time, real edges are softened. The median filter (error 2.8) picks an existing middle value instead, which ignores the dots.
