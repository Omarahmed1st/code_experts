---
slug: cvm-trace-hamming
type: trace
title: Counting differing bits
lesson: feature-matching
difficulty: hard
updated: 2026-10-16
---

## Question

`a` and `b` are one-number "descriptors", 193 and 195. The program compares them bit by bit, then asks OpenCV for their Hamming distance. What exactly does it print?

## Code

```python
import cv2
import numpy as np

a = np.array([[193]], dtype=np.uint8)
b = np.array([[195]], dtype=np.uint8)
print(format(193, "08b"), format(195, "08b"))
diff = np.unpackbits(a) != np.unpackbits(b)
print(np.count_nonzero(diff))
print(cv2.norm(a, b, cv2.NORM_HAMMING))
```

## Answer

```output
11000001 11000011
1
1.0
```

## Hints

- 195 is 193 + 2. Which bit has the value 2?
- `cv2.norm` gives back a decimal number.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 6 | 193 = 128 + 64 + 1; 195 = 128 + 64 + 2 + 1 | | 11000001 11000011\n |
| 7 | True where the two bits differ | | |
| 8 | only the bit worth 2 differs | | 1\n |
| 9 | OpenCV counts the same thing, as a decimal | | 1.0\n |

## Explanation

The **Hamming distance** is the number of bits that differ. 193 and 195 differ only in the bit worth 2, so the distance is **1**. `cv2.NORM_HAMMING` counts exactly this, and `cv2.norm` returns it as a float, `1.0`.

Note that the two numbers are close (193 and 195), but closeness of the numbers is not what counts: 127 and 128 differ by 1 as numbers, yet in all 8 of their bits. ORB descriptors are compared bit by bit.
