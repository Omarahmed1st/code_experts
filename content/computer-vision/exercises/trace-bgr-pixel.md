---
slug: trace-bgr-pixel
type: trace
title: Unpacking a BGR pixel
lesson: digital-images-and-pixels
difficulty: medium
updated: 2026-10-09
---

## Question

This program uses plain Python Lists to copy what OpenCV does with a colour pixel. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```python
pixel = [59, 212, 255]
b, g, r = pixel
print("red:", r)
rgb = [r, g, b]
print(rgb)
img = [[pixel, [61, 33, 20]]]
print(len(img), len(img[0]), len(img[0][0]))
```

## Answer

```output
red: 255
[255, 212, 59]
1 2 3
```

## Hints

- `b, g, r = pixel` gives the first item to `b`, the second to `g` and the third to `r`.
- `img` is a List of rows. Each row is a List of pixels, and each pixel is a List of 3 numbers.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 1 | one OpenCV pixel, in B, G, R order | pixel = [59, 212, 255] | |
| 2 | unpack the three channels | b = 59; g = 212; r = 255 | |
| 3 | print the red channel | r = 255 | red: 255\n |
| 4 | build a new List in R, G, B order | rgb = [255, 212, 59] | |
| 5 | print it | rgb = [255, 212, 59] | [255, 212, 59]\n |
| 6 | an image with 1 row of 2 pixels | img = [[[59, 212, 255], [61, 33, 20]]] | |
| 7 | 1 row, 2 pixels in the row, 3 numbers in a pixel | img = [[[59, 212, 255], [61, 33, 20]]] | 1 2 3\n |

## Explanation

This is the yellow pixel from the lesson. In B, G, R order it is `[59, 212, 255]`, so line 2 puts 59 in `b`, 212 in `g` and 255 in `r`. Line 4 swaps the order to R, G, B, which is what most other tools expect.

Line 7 works out the "shape" by hand:

- `len(img)` is the number of rows: 1.
- `len(img[0])` is the number of pixels in the first row, the columns: 2.
- `len(img[0][0])` is the number of values in the first pixel, the channels: 3.

A NumPy image of the same size would have `img.shape` equal to `(1, 2, 3)`: rows, columns, channels.
