---
slug: cvp-darkest-in-gray
type: mcq
title: Which colour turns darkest?
lesson: grayscale-images
difficulty: medium
updated: 2026-10-16
---

## Question

Three pixels are pure, full-strength colours. After `cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)`, which one becomes the **darkest** grey?

## Options

- [x] Pure blue, `(255, 0, 0)`
  Right: blue has the smallest weight, 0.114, so it becomes about 29.
- [ ] Pure green, `(0, 255, 0)`
  Green has the biggest weight, 0.587, so it becomes about 150: the lightest of the three.
- [ ] Pure red, `(0, 0, 255)`
  Red's weight is 0.299, so it becomes about 76: darker than green, but lighter than blue.
- [ ] All three become the same grey, 85.
  That would be a plain average (255 ÷ 3). OpenCV gives each channel its own weight.

## Explanation

**grey = 0.299 × R + 0.587 × G + 0.114 × B**

| Pixel (B, G, R) | Grey value |
|---|---|
| blue (255, 0, 0) | 0.114 × 255 ≈ 29 |
| red (0, 0, 255) | 0.299 × 255 ≈ 76 |
| green (0, 255, 0) | 0.587 × 255 ≈ 150 |

Our eyes are most sensitive to green and least to blue, and the weights copy that. This is why blue things look dark in grayscale.
