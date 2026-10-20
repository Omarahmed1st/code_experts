---
slug: bgr-red-pixel
type: mcq
title: What colour is this pixel?
lesson: digital-images-and-pixels
difficulty: easy
updated: 2026-10-09
---

## Question

An image was loaded with `cv2.imread()`. Printing one pixel with `print(img[50, 20])` shows:

```
[  0   0 255]
```

What colour is this pixel?

## Options

- [x] Red
  Right: OpenCV stores B, G, R. Blue is 0, green is 0 and red is 255, the brightest value.
- [ ] Blue
  That would be true in R, G, B order. OpenCV uses **B, G, R**, so the 255 is the red channel.
- [ ] Black
  Black would be `[0 0 0]`. Here one channel is fully on.
- [ ] White
  White would be `[255 255 255]`: all three channels fully on.

## Hints

- In OpenCV, which channel comes first: red or blue?

## Explanation

OpenCV keeps the three numbers of a colour pixel in the order **B**lue, **G**reen, **R**ed. So `[0 0 255]` means no blue, no green and full red: the pixel is **red**.

This order catches many beginners. In OpenCV, `(255, 0, 0)` is blue and `(0, 0, 255)` is red.
