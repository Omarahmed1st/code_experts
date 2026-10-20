---
slug: bright-choose-alpha-beta
type: mcq
title: Choosing alpha and beta for a dull photo
lesson: brightness-and-contrast
difficulty: medium
updated: 2026-10-10
---

## Question

A grayscale photo looks dull and grey: its darkest value is 100 and its brightest value is 140. You apply **new = alpha × old + beta** to every pixel with `cv2.convertScaleAbs`.

Which choice gives the photo **more contrast** while keeping its values well inside 0 to 255?

## Options

- [x] `alpha = 2.0`, `beta = -120`
  Right: 100 becomes 80 and 140 becomes 160. The spread grows from 40 values to 80, and nothing reaches 0 or 255.
- [ ] `alpha = 1.0`, `beta = 60`
  This only adds brightness: the values move to 160 and 200, but the spread is still 40. The photo is lighter, not punchier.
- [ ] `alpha = 0.5`, `beta = 60`
  An `alpha` below 1 squeezes the values together: 110 to 130 is a spread of only 20. That is **less** contrast.
- [ ] `alpha = 3.0`, `beta = 0`
  Too much alpha: 300 and 420 are both above 255, so every pixel is saturated to 255 and the image turns white.

## Hints

- Work out what happens to the darkest value (100) and the brightest value (140) for each choice.
- More contrast means the two values end up further apart, and still between 0 and 255.

## Explanation

In **new = alpha × old + beta**, `alpha` controls contrast and `beta` controls brightness. Check the two ends of the range for each choice:

| alpha, beta | 100 becomes | 140 becomes | spread |
|---|---|---|---|
| 2.0, -120 | 80 | 160 | 80 |
| 1.0, 60 | 160 | 200 | 40 |
| 0.5, 60 | 110 | 130 | 20 |
| 3.0, 0 | 300 → 255 | 420 → 255 | 0 |

Only `alpha = 2.0` with `beta = -120` spreads the values out and keeps them inside 0 to 255. The negative `beta` is needed because multiplying by 2 alone would give 200 to 280, and the bright part would saturate. A good method: choose `alpha` for the spread you want, then choose `beta` to move the result back into the middle of 0 to 255.
