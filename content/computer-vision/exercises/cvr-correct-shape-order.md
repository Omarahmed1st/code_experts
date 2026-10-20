---
slug: cvr-correct-shape-order
type: correct_code
title: Width and height from the shape
lesson: reading-and-showing-images
difficulty: medium
updated: 2026-10-16
---

## Question

The program reads the three numbers of an image's `img.shape` on one line, such as `540 960 3`, and prints the width, the height, and whether the image is wider than it is tall. It gets the width and height the wrong way round. Fix it.

## Code

```python
numbers = input().split()
width = int(numbers[0])
height = int(numbers[1])
print("Width:", width)
print("Height:", height)
if width > height:
    print("Landscape")
else:
    print("Portrait")
```

## Expected behavior

The user types the shape as three numbers separated by spaces, in OpenCV's order. For `540 960 3` the program prints:

```
Width: 960
Height: 540
Landscape
```

## Tests

### street.png, 540 960 3

```input
540 960 3
```

```output
Width: 960
Height: 540
Landscape
```

### a phone photo, 1280 720 3

```input
1280 720 3
```

```output
Width: 720
Height: 1280
Portrait
```

## Solution

```python
numbers = input().split()
height = int(numbers[0])
width = int(numbers[1])
print("Width:", width)
print("Height:", height)
if width > height:
    print("Landscape")
else:
    print("Portrait")
```

## Also accepted

```python
numbers = input().split()
width = int(numbers[1])
height = int(numbers[0])
print("Width:", width)
print("Height:", height)
if width > height:
    print("Landscape")
else:
    print("Portrait")
```

## Hints

- In `(540, 960, 3)`, which number is the number of rows?
- `split()` keeps the numbers in the order they were typed.

## Explanation

`img.shape` is always **(height, width, channels)**: rows first, then columns. So `numbers[0]` is the height and `numbers[1]` is the width. With the bug, `street.png` would be reported as 540 wide, 960 tall and "Portrait", which is the opposite of the picture.
