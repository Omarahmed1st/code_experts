---
slug: bright-convertscaleabs-negative
type: mcq
title: Darkening with convertScaleAbs
lesson: brightness-and-contrast
difficulty: hard
updated: 2026-10-10
---

## Question

A row of three grayscale pixels holds the values 20, 100 and 240. A student darkens it with `cv2.convertScaleAbs` using `alpha = 1.0` and `beta = -50`.

Which values does `convertScaleAbs` store?

## Options

- [x] 30, 50 and 190
  Right: 20 - 50 = -30, and `convertScaleAbs` takes the **absolute value**, so -30 is stored as 30. The other two fit: 50 and 190.
- [ ] 0, 50 and 190
  This is what you might expect from saturation, but `convertScaleAbs` takes the absolute value **before** it keeps results between 0 and 255, so -30 becomes 30, not 0.
- [ ] 226, 50 and 190
  That is what NumPy's `-` on a `uint8` array does: it wraps around past 0 (-30 + 256 = 226). `convertScaleAbs` never wraps around.
- [ ] -30, 50 and 190
  A pixel value can't be negative. `convertScaleAbs` always stores whole numbers from 0 to 255.

## Hints

- Work out alpha × old + beta for each value first. Only one result is outside 0 to 255.
- The name of the function ends in "Abs". What does "absolute value" do to -30?

## Explanation

`cv2.convertScaleAbs` computes **alpha × old + beta**, takes the **absolute value** of the result, and then keeps it between 0 and 255.

| old | 1.0 × old - 50 | absolute value | stored |
|---|---|---|---|
| 20 | -30 | 30 | **30** |
| 100 | 50 | 50 | 50 |
| 240 | 190 | 190 | 190 |

So the darkest pixel ends up a little **lighter** than black instead of black, which is not what the student wanted. This is why the lesson says to choose `beta` so that the results stay positive. If you need dark values to stop at 0, keep the results between 0 and 255 yourself, for example with `max(0, min(255, new))` on each value.
