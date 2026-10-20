---
slug: cvc-trace-bits
type: trace
title: A descriptor's numbers as bits
lesson: orb-keypoints-and-descriptors
difficulty: hard
updated: 2026-10-16
---

## Question

193 and 185 are the first two numbers of the descriptor in the lecture. `format(n, "08b")` writes a number as 8 binary digits. What exactly does the program print?

## Code

```python
import numpy as np

d = np.array([193, 185], dtype=np.uint8)
print(format(193, "08b"))
print(np.unpackbits(d))
print(len(np.unpackbits(np.zeros(32, dtype=np.uint8))))
```

## Answer

```output
11000001
[1 1 0 0 0 0 0 1 1 0 1 1 1 0 0 1]
256
```

## Hints

- 193 = 128 + 64 + 1. Which of the 8 places (128, 64, 32, 16, 8, 4, 2, 1) are used?
- 185 = 128 + 32 + 16 + 8 + 1.
- Every number of a descriptor holds 8 bits. How many bits do 32 numbers hold?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 3 | two descriptor numbers | | |
| 4 | 193 = 128 + 64 + 1 | | 11000001\n |
| 5 | the 8 bits of 193, then the 8 bits of 185 | | [1 1 0 0 0 0 0 1 1 0 1 1 1 0 0 1]\n |
| 6 | 32 numbers × 8 bits | | 256\n |

## Explanation

ORB stores each answer of a brightness test ("is the first pixel darker?") as one bit. Eight bits are packed into one number from 0 to 255:

- 193 = 128 + 64 + 1, so its bits are **1100 0001**.
- 185 = 128 + 32 + 16 + 8 + 1, so its bits are **1011 1001**.

`np.unpackbits` writes them out one after the other: 16 bits for 2 numbers. A full descriptor has 32 numbers, so **256** bits: one for each of the 256 pixel pairs ORB compares.
