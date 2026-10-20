---
slug: cvd-reduce-texture-edges
type: mcq
multiple: true
title: Too many edges in the grass
lesson: features-and-edges
difficulty: medium
updated: 2026-10-16
---

## Question

`cv2.Canny(gray, 50, 100)` fills the grass and the road's stones with short marks. Which changes give **fewer of these texture edges**? Pick **all** that do.

## Options

- [x] Raise both thresholds, for example to `(150, 250)`.
  Right: higher thresholds keep only the strong changes, such as outlines.
- [x] Blur the image first, for example with `cv2.GaussianBlur(gray, (5, 5), 0)`.
  Right: blurring weakens small, fine changes before Canny measures them.
- [ ] Lower both thresholds, for example to `(20, 40)`.
  Lower thresholds count **weaker** changes as edges, so you get even more texture.
- [ ] Swap them: `cv2.Canny(gray, 100, 50)`.
  OpenCV quietly uses the smaller number as `low`, so nothing changes.
- [ ] Run Canny on the colour image instead.
  Edges depend on brightness; convert to grayscale first.

## Explanation

Texture is many small, weak changes in brightness. Two ways remove them: **make them weaker** (blur first) or **demand stronger changes** (raise the thresholds, keeping `high` about 2 to 3 times `low`). On `street.png`, going from (50, 100) to (150, 250) cut the edge pixels from 8.9% to 3.8%.
