---
slug: uint8-subtract-wraps
type: mcq
title: Darkening a uint8 row with minus
lesson: brightness-and-contrast
difficulty: hard
updated: 2026-10-09
---

## Question

A student tries to make three pixels darker by subtracting 50 with NumPy. What does the program print?

## Code

```python
import numpy as np

row = np.array([[30, 120, 255]], dtype=np.uint8)
print(row - 50)
```

## Options

- [x] `[[236  70 205]]`
  Right: 30 - 50 would be -20, which a `uint8` can't hold. NumPy wraps around past 0 and stores 256 - 20 = 236.
- [ ] `[[  0  70 205]]`
  That's what you **want** (stopping at 0), but NumPy's `-` on `uint8` doesn't stop at the limit. It wraps around.
- [ ] `[[-20  70 205]]`
  A `uint8` is unsigned: it can only hold whole numbers from 0 to 255, never a negative number.
- [ ] It stops with an overflow error.
  NumPy doesn't raise an error here. It quietly wraps the value around, which is why this bug is easy to miss.

## Answer

```output
[[236  70 205]]
```

## Hints

- 120 - 50 and 255 - 50 are easy. The only interesting value is 30 - 50.
- Adding 10 to 250 wraps past 255 back to small numbers. What do you think happens when you go below 0?

## Explanation

A `uint8` holds whole numbers from 0 to 255 only. When a result falls outside that range, NumPy **wraps around**: it adds or subtracts 256 until the value fits.

| old | old - 50 | stored |
|---|---|---|
| 30 | -20 | -20 + 256 = **236** |
| 120 | 70 | 70 |
| 255 | 205 | 205 |

So the darkest pixel suddenly becomes almost white, the opposite of what the student wanted. NumPy also pads `70` with a space so the columns line up. To darken safely, use `cv2.convertScaleAbs` with a negative `beta`, or do the calculation with bigger numbers and keep the results between 0 and 255.
