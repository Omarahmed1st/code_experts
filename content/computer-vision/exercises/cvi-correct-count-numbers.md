---
slug: cvi-correct-count-numbers
type: correct_code
title: How many numbers does an image store?
lesson: what-is-computer-vision
difficulty: easy
updated: 2026-10-16
---

## Question

The program reads an image's width and height and prints how many numbers the computer stores for it: first as a grayscale image (one number per pixel), then as a colour image (three numbers per pixel). One line is wrong. Fix it.

## Code

```python
width = int(input())
height = int(input())
gray = width + height
color = gray * 3
print(gray, color)
```

## Expected behavior

The user types the width, then the height. For a 640 × 480 image the program prints `307200 921600`.

## Tests

### 640 × 480

```input
640
480
```

```output
307200 921600
```

### 4 × 3

```input
4
3
```

```output
12 36
```

### 2 × 2

```input
2
2
```

```output
4 12
```

## Solution

```python
width = int(input())
height = int(input())
gray = width * height
color = gray * 3
print(gray, color)
```

## Also accepted

```python
width = int(input())
height = int(input())
gray = height * width
color = gray * 3
print(gray, color)
```

## Hints

- Draw a 4 × 3 grid of squares and count them.
- A grid has `height` rows, and each row has `width` pixels.

## Explanation

An image is a grid: `height` rows of `width` pixels each, so it has **width × height** pixels. A grayscale image stores one number per pixel, and a colour image three.

The third test passes even with the bug, because 2 + 2 and 2 × 2 are both 4. That is why a program needs more than one test.
