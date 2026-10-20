---
slug: img-trace-gray-grid
type: trace
title: A small grayscale grid
lesson: digital-images-and-pixels
difficulty: medium
updated: 2026-10-10
---

## Question

This program stores a small grayscale image as plain Python Lists: a List of rows, and each row is a List of pixel values from 0 (black) to 255 (white). It then counts the pixels that are brighter than 128.

Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```python
gray = [[32, 40, 207],
        [35, 207, 210]]
print(len(gray), len(gray[0]))
print(gray[1][2])
print(gray[-1][0], gray[0][-1])
bright = 0
for row in gray:
    for value in row:
        if value > 128:
            bright = bright + 1
print("bright:", bright)
```

## Answer

```output
2 3
210
35 207
bright: 3
```

## Hints

- `len(gray)` counts the rows. `len(gray[0])` counts the values in the first row, which is the number of columns.
- `gray[-1]` is the last row. `gray[0][-1]` is the last value of the first row.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 1 | an image with 2 rows and 3 columns | gray = [[32, 40, 207], [35, 207, 210]] | |
| 3 | 2 rows, 3 values in the first row | gray = [[32, 40, 207], [35, 207, 210]] | 2 3\n |
| 4 | row 1, column 2: the bottom-right pixel | gray = [[32, 40, 207], [35, 207, 210]] | 210\n |
| 5 | first value of the last row, last value of the first row | gray = [[32, 40, 207], [35, 207, 210]] | 35 207\n |
| 6 | the counter starts at 0 | bright = 0 | |
| 10 | row 0: 32 and 40 are not above 128; 207 is, so add 1 | bright = 1 | |
| 10 | row 1: 35 is not above 128; 207 and 210 are, so add 2 | bright = 3 | |
| 11 | print the count | bright = 3 | bright: 3\n |

## Explanation

The List `gray` copies the shape of a grayscale image in OpenCV: `len(gray)` is the number of rows (the height, 2) and `len(gray[0])` is the number of columns (the width, 3). A NumPy image of the same size would have `gray.shape` equal to `(2, 3)`, with no third number because a grayscale pixel holds only one value.

`gray[1][2]` means row 1, column 2. Indexes start at 0, so this is the second row and the third column: 210. Negative indexes count from the end, so `gray[-1][0]` is 35 and `gray[0][-1]` is 207.

The two loops visit every pixel, row by row. Three values are above 128: 207, 207 and 210. These are the light pixels; the others (32, 40, 35) are dark.
