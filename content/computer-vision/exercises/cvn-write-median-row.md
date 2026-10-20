---
slug: cvn-write-median-row
type: write_code
title: A median filter for one row
lesson: smoothing-and-noise
difficulty: hard
updated: 2026-10-16
---

## Question

Write a program that reads a row of pixel values on one line, separated by spaces, and prints the row after a **median filter of size 3**: every pixel except the first and the last becomes the median of itself and its left and right neighbours. The first and last pixels stay as they are.

Print the new values on one line, separated by spaces. Use `input()` without a prompt.

## Code

```python
# read the row here

```

## Expected behavior

For `20 20 255 20 20 0 20 20` the program prints `20 20 20 20 20 20 20 20`. For `10 50 12 13 200 14` it prints `10 12 13 13 14 14`.

## Tests

### a white dot and a black dot

```input
20 20 255 20 20 0 20 20
```

```output
20 20 20 20 20 20 20 20
```

### two spikes

```input
10 50 12 13 200 14
```

```output
10 12 13 13 14 14
```

### already smooth

```input
5 6 7
```

```output
5 6 7
```

## Solution

```python
row = []
for text in input().split():
    row.append(int(text))
new_row = [row[0]]
for i in range(1, len(row) - 1):
    three = sorted([row[i - 1], row[i], row[i + 1]])
    new_row.append(three[1])
new_row.append(row[-1])
print(" ".join(str(v) for v in new_row))
```

## Hints

- Build the new values in a **new** List. If you change `row` while you go, the next pixel would use a value that was already filtered.
- The median of three values is the one at index 1 after sorting them.

## Explanation

This is what `cv2.medianBlur(img, 3)` does, along one row instead of a 3 × 3 square. Keeping the results in a separate List matters: a filter always computes every new pixel from the **original** neighbours. OpenCV handles the edge pixels by imagining extra pixels around the border; this exercise simply keeps them.
