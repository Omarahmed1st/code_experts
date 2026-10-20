---
slug: img-correct-row-col-bgr
type: correct_code
title: Fix the pixel reader
lesson: digital-images-and-pixels
difficulty: medium
updated: 2026-10-10
---

## Question

A tiny colour image is stored as plain Python Lists, the way OpenCV stores it: a List of rows, each row a List of pixels, and each pixel a List of three numbers in **B, G, R** order. With Lists you read one pixel with `img[row][col]` (OpenCV uses `img[row, col]`).

The program reads a row number and a column number, then prints the blue and the red value of that pixel. It has **two** bugs. Find them and fix the program.

## Code

```python
img = [[[255, 0, 0], [0, 255, 0], [0, 0, 255]],
       [[59, 212, 255], [61, 33, 20], [255, 255, 255]]]
row = int(input())
col = int(input())
pixel = img[col][row]
r, g, b = pixel
print("blue:", b)
print("red:", r)
```

## Expected behavior

The image has 2 rows and 3 columns. The user types a row number (0 or 1) and then a column number (0, 1 or 2). The program prints the blue value and then the red value of that pixel. For row `1` and column `0` (the yellow pixel `[59, 212, 255]`) it prints:

```
blue: 59
red: 255
```

## Tests

### row 1, column 0 (yellow)

```input
1
0
```

```output
blue: 59
red: 255
```

### row 0, column 2 (red)

```input
0
2
```

```output
blue: 0
red: 255
```

### row 0, column 0 (blue)

```input
0
0
```

```output
blue: 255
red: 0
```

## Solution

```python
img = [[[255, 0, 0], [0, 255, 0], [0, 0, 255]],
       [[59, 212, 255], [61, 33, 20], [255, 255, 255]]]
row = int(input())
col = int(input())
pixel = img[row][col]
b, g, r = pixel
print("blue:", b)
print("red:", r)
```

## Hints

- Which comes first when you index an image: the row or the column?
- In OpenCV, which channel is the first number of a pixel: blue or red?

## Explanation

1. **Row and column are swapped.** An image is indexed as `img[row][col]` (in OpenCV `img[row, col]`), which is `img[y][x]`: first pick the row, then the column inside it. `img[col][row]` reads the wrong pixel, and for column 2 it even fails with `IndexError`, because the image has only 2 rows.
2. **The channels are unpacked in R, G, B order.** OpenCV keeps a pixel as **B, G, R**, so the first number is blue and the last is red. `r, g, b = pixel` puts the blue value into `r`. The fix is `b, g, r = pixel`.

The third test shows the second bug clearly: the pixel `[255, 0, 0]` is **blue** in OpenCV, so blue is 255 and red is 0.
