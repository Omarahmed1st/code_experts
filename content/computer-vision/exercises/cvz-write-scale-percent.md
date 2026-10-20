---
slug: cvz-write-scale-percent
type: write_code
title: Scale by a percentage
lesson: resizing-images
difficulty: easy
updated: 2026-10-16
---

## Question

Write a program that reads an image's width, its height and a percentage (each on its own line), and prints the new size after scaling **both** sides by that percentage, as `width x height` with whole numbers.

Use `input()` without prompts.

## Code

```python
# read the width, the height and the percentage here

```

## Expected behavior

For `960`, `540` and `50` the program prints `480 x 270`. For `640`, `480` and `150` it prints `960 x 720`.

## Tests

### half of street.png

```input
960
540
50
```

```output
480 x 270
```

### a quarter of a 1280 × 720 frame

```input
1280
720
25
```

```output
320 x 180
```

### enlarge by 150 %

```input
640
480
150
```

```output
960 x 720
```

## Solution

```python
w = int(input())
h = int(input())
percent = int(input())
new_w = int(w * percent / 100)
new_h = int(h * percent / 100)
print(new_w, "x", new_h)
```

## Hints

- 50 % means multiplying by 50 / 100, which is 0.5.
- Sizes must be whole numbers, so wrap each result in `int()`.

## Explanation

Scaling both sides by the same percentage keeps the aspect ratio, just like `fx` and `fy` with the same value. In OpenCV, the result could be used straight away: `cv2.resize(img, (new_w, new_h))`, or `cv2.resize(img, None, fx=percent / 100, fy=percent / 100)`.
