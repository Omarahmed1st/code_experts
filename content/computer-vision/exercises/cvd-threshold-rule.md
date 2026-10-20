---
slug: cvd-threshold-rule
type: mcq
title: Between the two thresholds
lesson: features-and-edges
difficulty: medium
updated: 2026-10-16
---

## Question

With `cv2.Canny(gray, 100, 200)`, the brightness change at a pixel measures **150**. Is the pixel marked as an edge?

## Options

- [x] Only if it connects to a sure edge, a pixel whose change is stronger than 200.
  Right: changes between `low` and `high` count only when they continue a sure edge.
- [ ] Yes, always: 150 is above `low`.
  Being above `low` is not enough on its own.
- [ ] No, never: 150 is below `high`.
  Weak changes that connect to a strong edge are kept. This lets Canny follow an edge where it fades a little.
- [ ] Only if 150 is exactly halfway between the thresholds.
  The position between the thresholds doesn't matter, only the connection.

## Explanation

| Change at a pixel | Result |
|---|---|
| stronger than `high` (200) | an edge, for sure |
| between `low` and `high` | an edge **only if** it connects to a sure edge |
| weaker than `low` (100) | not an edge |
