---
slug: cvz-correct-keep-ratio
type: correct_code
title: Fix the aspect-ratio calculator
lesson: resizing-images
difficulty: medium
updated: 2026-10-16
---

## Question

The program reads an image's width and height, then the new width you want, and prints the new size that keeps the aspect ratio. The formula on one line is wrong. Fix it.

## Code

```python
old_w = int(input())
old_h = int(input())
new_w = int(input())
new_h = int(old_w * new_w / old_h)
print(new_w, "x", new_h)
```

## Expected behavior

The user types the old width, the old height and the new width, one per line. For `960`, `540` and `640` the program prints `640 x 360`.

## Tests

### street.png to 640 wide

```input
960
540
640
```

```output
640 x 360
```

### a 1280 × 720 frame to 320 wide

```input
1280
720
320
```

```output
320 x 180
```

### a square image

```input
1000
1000
500
```

```output
500 x 500
```

## Solution

```python
old_w = int(input())
old_h = int(input())
new_w = int(input())
new_h = int(old_h * new_w / old_w)
print(new_w, "x", new_h)
```

## Also accepted

```python
old_w = int(input())
old_h = int(input())
new_w = int(input())
new_h = int(new_w * old_h / old_w)
print(new_w, "x", new_h)
```

```python
old_w = int(input())
old_h = int(input())
new_w = int(input())
new_h = old_h * new_w // old_w
print(new_w, "x", new_h)
```

## Hints

- The new height has to be smaller than the old height when the new width is smaller than the old width. Is it, for the first test?
- new height = old height × new width ÷ old width.

## Explanation

The formula is **new height = old height × new width ÷ old width**: the height shrinks by the same fraction as the width. The program swapped `old_w` and `old_h`, so for `street.png` it computed 960 × 640 ÷ 540 ≈ 1137, a very tall, stretched image.

The square image passes even with the bug, because its width and height are equal.
