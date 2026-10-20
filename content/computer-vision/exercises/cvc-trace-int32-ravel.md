---
slug: cvc-trace-int32-ravel
type: trace
title: From decimal corners to whole pixels
lesson: finding-corners
difficulty: medium
updated: 2026-10-16
---

## Question

`corners` holds two corner positions, packed the way `goodFeaturesToTrack` returns them. What exactly does the program print?

## Code

```python
import numpy as np

corners = np.array([[[710.4, 319.6]], [[52.0, 88.5]]], dtype=np.float32)
print(corners.shape)
corners = np.int32(corners)
for corner in corners:
    x, y = corner.ravel()
    print(x, y)
```

## Answer

```output
(2, 1, 2)
710 319
52 88
```

## Hints

- Count the brackets: 2 corners, each holding 1 pair of 2 numbers.
- `np.int32` drops the decimal part. It does not round.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 4 | 2 corners, each one [x, y] pair | | (2, 1, 2)\n |
| 5 | decimals become whole numbers | corners = [[[710, 319]], [[52, 88]]] | |
| 7 | the first corner, flattened | x = 710; y = 319 | |
| 8 | | x = 710; y = 319 | 710 319\n |
| 7 | the second corner | x = 52; y = 88 | |
| 8 | | x = 52; y = 88 | 52 88\n |

## Explanation

The shape `(2, 1, 2)` means 2 corners, each a tiny array holding one `[x, y]` pair.

`np.int32` turns every number into a whole number by **dropping the decimal part**: 710.4 becomes 710, and 319.6 becomes 319, not 320. Each `corner` is `[[x, y]]`, so `ravel()` flattens it into two numbers that `x, y = …` can unpack. These whole numbers are what `cv2.circle` needs.
