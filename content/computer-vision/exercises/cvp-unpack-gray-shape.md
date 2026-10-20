---
slug: cvp-unpack-gray-shape
type: mcq
title: Three names for a grey shape
lesson: grayscale-images
difficulty: medium
updated: 2026-10-16
---

## Question

`gray` is a grayscale image with shape `(480, 640)`. What happens on this line?

## Code

```python
h, w, c = gray.shape
```

## Options

- [x] It stops with `ValueError: not enough values to unpack (expected 3, got 2)`.
  Right: the shape has only two numbers, and the line asks for three.
- [ ] `h` is 480, `w` is 640 and `c` is 1.
  A grayscale shape has no channel number at all, not even 1.
- [ ] `h` is 480, `w` is 640 and `c` is 0.
  Python doesn't fill in missing values. It stops instead.
- [ ] `h` is 640, `w` is 480 and `c` is left empty.
  The shape is (height, width), and unpacking needs exactly one name per value.

## Explanation

Unpacking needs exactly as many names as there are values. For a grayscale image, write `h, w = gray.shape`. Only colour images have the third number: `h, w, c = img.shape`.
