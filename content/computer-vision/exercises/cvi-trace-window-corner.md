---
slug: cvi-trace-window-corner
type: trace
title: Nine pixels as a List of rows
lesson: what-is-computer-vision
difficulty: easy
updated: 2026-10-16
---

## Question

These are the 9 pixel values at the corner of a window in `street.png`, stored as a List of rows. What exactly does the program print?

## Code

```python
patch = [[181, 181, 181],
         [181, 65, 65],
         [181, 65, 65]]
print(len(patch), "rows,", len(patch[0]), "columns")
print("top-left:", patch[0][0])
print("centre:", patch[1][1])
```

## Answer

```output
3 rows, 3 columns
top-left: 181
centre: 65
```

## Hints

- `patch[0]` is the first row, which is itself a List.
- `patch[1][1]` is row 1, then item 1 of that row. Both start counting at 0.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 1 | a List of 3 rows, each a List of 3 values | patch = 3 rows of 3 | |
| 4 | 3 rows; the first row has 3 items | | 3 rows, 3 columns\n |
| 5 | row 0, item 0 | | top-left: 181\n |
| 6 | row 1, item 1 | | centre: 65\n |

## Explanation

To the computer, the corner of the window is just numbers: **181** for the light wall and **65** for the dark glass. `patch[0][0]` is the top-left value, on the wall. `patch[1][1]` is the middle of the 3 × 3 grid, which is already inside the dark window. Nothing in the numbers says "window": a program has to find that pattern.
