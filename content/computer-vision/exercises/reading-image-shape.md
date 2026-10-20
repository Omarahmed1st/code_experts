---
slug: reading-image-shape
type: mcq
title: Reading an image's shape
lesson: digital-images-and-pixels
difficulty: medium
multiple: true
updated: 2026-10-09
---

## Question

A colour image was loaded with OpenCV, and `print(img.shape)` shows:

```
(300, 400, 3)
```

Which statements are true? Pick **all** that are right.

## Options

- [x] The image is 400 pixels wide.
  Right: the shape lists rows (height) first, then columns (width). 400 columns means 400 pixels wide.
- [x] Each pixel holds three numbers, in the order blue, green, red.
  Right: the last number is the number of channels, and OpenCV keeps them in B, G, R order.
- [ ] The bottom-right pixel is `img[300, 400]`.
  Indexes start at 0, so the last row is 299 and the last column is 399. The bottom-right pixel is `img[299, 399]`; `img[300, 400]` is out of range.
- [ ] The image is 400 pixels tall.
  Height comes **first** in the shape: the image has 300 rows, so it is 300 pixels tall.

## Hints

- In `(rows, columns, channels)`, which one is the height?
- If there are 300 rows, what is the number of the last row?

## Explanation

`img.shape` is `(rows, columns, channels)`:

- 300 rows: the image is **300 pixels tall**.
- 400 columns: it is **400 pixels wide**.
- 3 channels: every pixel holds 3 numbers, blue, green and red, in that order.

The rows are numbered 0 to 299 and the columns 0 to 399, so the bottom-right pixel is `img[299, 399]`. A common shortcut is `h, w = img.shape[:2]`, which gives `h = 300` and `w = 400`.
