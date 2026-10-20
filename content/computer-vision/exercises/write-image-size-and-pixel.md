---
slug: write-image-size-and-pixel
type: write_code
title: Image size and one pixel
lesson: digital-images-and-pixels
difficulty: easy
updated: 2026-10-09
---

## Question

A small grayscale image is stored as a List of rows, and every row is a List of pixel values. With Lists you read one pixel with `img[row][col]` (NumPy uses `img[row, col]`).

Complete the program so it reads a row number and a column number, then prints three lines:

1. the size, as `size: 3 rows, 4 columns`
2. the pixel at that row and column, as `pixel: 200`
3. the bottom-right pixel, as `bottom-right: 210`

Work the size out with `len()`, not by typing 3 and 4, so the program still works for another image.

## Code

```python
img = [[12, 40, 80, 120],
       [30, 60, 200, 255],
       [0, 90, 150, 210]]
row = int(input())
col = int(input())
# print the three lines here

```

## Expected behavior

For row `1` and column `2` the program prints:

```
size: 3 rows, 4 columns
pixel: 200
bottom-right: 210
```

## Tests

### row 1, column 2

```input
1
2
```

```output
size: 3 rows, 4 columns
pixel: 200
bottom-right: 210
```

### the top-left pixel

```input
0
0
```

```output
size: 3 rows, 4 columns
pixel: 12
bottom-right: 210
```

### the last row and column

```input
2
3
```

```output
size: 3 rows, 4 columns
pixel: 210
bottom-right: 210
```

## Solution

```python
img = [[12, 40, 80, 120],
       [30, 60, 200, 255],
       [0, 90, 150, 210]]
row = int(input())
col = int(input())
rows = len(img)
cols = len(img[0])
print("size:", rows, "rows,", cols, "columns")
print("pixel:", img[row][col])
print("bottom-right:", img[-1][-1])
```

## Hints

- `len(img)` counts the rows. How do you count the values in one row?
- `img[row]` is a whole row. Index it again to get one pixel.
- The last row is `img[-1]`. What is the last value in that row?

## Explanation

The image is a List of 3 rows, so `len(img)` is the number of rows (the height). Every row has the same length, so `len(img[0])` is the number of columns (the width). This matches `img.shape` in OpenCV: rows first, then columns.

`img[row]` picks one row, and `img[row][col]` picks one value from it. Row and column numbers start at 0, so the bottom-right pixel is `img[2][3]` here, or `img[-1][-1]` for an image of any size.
