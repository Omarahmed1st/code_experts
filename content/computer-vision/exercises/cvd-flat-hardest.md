---
slug: cvd-flat-hardest
type: mcq
title: The hardest place to find again
lesson: features-and-edges
difficulty: easy
updated: 2026-10-16
---

## Question

You mark one small square in a photo and try to find **exactly the same spot** in a second photo of the same street. Which spot is the **hardest** to find again?

## Options

- [x] A square in the middle of the clear sky
  Right: a flat region looks the same everywhere, so any square of sky would match.
- [ ] The corner of a window
  Corners are the **easiest**: the image changes in every direction around them, so their position is unique.
- [ ] A point on a long, straight road line
  This one is **ambiguous**: you can find the line, but not where along it. Still easier than the sky.
- [ ] The corner of a road sign
  Like a window corner, two edges meet here, which makes it distinctive.

## Explanation

Slide a small window over each region:

| Region | When the window moves… | Can you find it again? |
|---|---|---|
| flat (sky) | nothing changes | hard |
| edge (road line) | changes only across the line | ambiguous |
| corner | changes in every direction | easy |

Good features are **distinctive**, which is why detectors look for corners.
