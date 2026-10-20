---
slug: write-wrap-vs-saturate
type: write_code
title: Wrap around or saturate?
lesson: brightness-and-contrast
difficulty: hard
updated: 2026-10-09
---

## Question

Adding to a `uint8` pixel can go two ways:

- NumPy's `+` **wraps around**: past 255 it starts again from 0, so 250 + 10 is stored as 4.
- `cv2.convertScaleAbs` **saturates**: it stops at 255, so 250 + 10 is stored as 255.

Write a program that reads a pixel value (0 to 255) and a brightness change `beta` (0 or more), and prints both results:

```
wrapped: 4
saturated: 255
```

Use plain Python only (no NumPy).

## Code

```python
value = int(input())
beta = int(input())
# work out the two results and print them

```

## Expected behavior

For `value = 250` and `beta = 10` the program prints `wrapped: 4` and `saturated: 255`. When the sum is 255 or less, both results are the same as the sum.

## Tests

### 250 + 10 goes past 255

```input
250
10
```

```output
wrapped: 4
saturated: 255
```

### 100 + 10 fits

```input
100
10
```

```output
wrapped: 110
saturated: 110
```

### 255 + 1 wraps to 0

```input
255
1
```

```output
wrapped: 0
saturated: 255
```

### 0 + 255 lands exactly on the limit

```input
0
255
```

```output
wrapped: 255
saturated: 255
```

## Solution

```python
value = int(input())
beta = int(input())
total = value + beta
wrapped = total % 256
saturated = min(total, 255)
print("wrapped:", wrapped)
print("saturated:", saturated)
```

## Hints

- A `uint8` has 256 possible values, 0 to 255. Wrapping around is the same as keeping the remainder after dividing by 256.
- `%` gives the remainder: `260 % 256` is 4.
- For saturation you need the smaller of the sum and 255.

## Explanation

Both results start from the same sum, `value + beta`.

- **Wrapped.** A `uint8` has exactly 256 values. When a sum goes past 255, the counting starts again at 0: 256 becomes 0, 257 becomes 1, 260 becomes 4. That is the remainder after dividing by 256, so `total % 256`. For a sum of 255 or less, the remainder is the sum itself.
- **Saturated.** The value stops at the limit: `min(total, 255)` keeps the sum when it fits and gives 255 when it doesn't. An `if total > 255:` check works too.

This is why `img + 100` in NumPy turns bright areas dark, while `cv2.convertScaleAbs(img, alpha=1.0, beta=100)` turns them white.
