---
slug: correct-contrast-formula
type: correct_code
title: Fix the contrast formula
lesson: brightness-and-contrast
difficulty: medium
updated: 2026-10-09
---

## Question

This program should apply **new = alpha × old + beta** to a row of grayscale pixels, round each result to a whole number and keep it between 0 and 255 (like `cv2.convertScaleAbs`, for results that are not negative). It reads `alpha` and then `beta`. One line has a bug. Find it and fix the program.

## Code

```python
row = [0, 100, 150, 200]
alpha = float(input())
beta = int(input())
new_row = []
for old in row:
    new = round(alpha * (old + beta))
    new = max(0, min(255, new))
    new_row.append(new)
print(new_row)
```

## Expected behavior

The user types `alpha` (it may have a decimal point) and then `beta` (a whole number). The program prints the new row. For `alpha = 1.5` and `beta = 10`:

- 1.5 × 0 + 10 = 10
- 1.5 × 100 + 10 = 160
- 1.5 × 150 + 10 = 235
- 1.5 × 200 + 10 = 310, which is clipped to 255

so it prints `[10, 160, 235, 255]`.

## Tests

### alpha 1.5, beta 10

```input
1.5
10
```

```output
[10, 160, 235, 255]
```

### alpha 2.0, beta -110 (both limits are reached)

```input
2.0
-110
```

```output
[0, 90, 190, 255]
```

### alpha 0.5, beta 0 (less contrast)

```input
0.5
0
```

```output
[0, 50, 75, 100]
```

## Solution

```python
row = [0, 100, 150, 200]
alpha = float(input())
beta = int(input())
new_row = []
for old in row:
    new = round(alpha * old + beta)
    new = max(0, min(255, new))
    new_row.append(new)
print(new_row)
```

## Also accepted

```python
row = [0, 100, 150, 200]
alpha = float(input())
beta = int(input())
new_row = []
for old in row:
    new = round(old * alpha + beta)
    new = max(0, min(255, new))
    new_row.append(new)
print(new_row)
```

```python
row = [0, 100, 150, 200]
alpha = float(input())
beta = int(input())
new_row = []
for old in row:
    new = round(beta + alpha * old)
    new = max(0, min(255, new))
    new_row.append(new)
print(new_row)
```

## Hints

- Work out the first test by hand for the pixel 0. The formula says 1.5 × 0 + 10. What does the program compute?
- Brackets change the order of the operations.

## Explanation

The formula is **alpha × old + beta**: multiply first, then add. The brackets in `alpha * (old + beta)` add `beta` **first** and then multiply it too, so the brightness change gets stretched by the contrast. For the pixel 0 with `alpha = 1.5` and `beta = 10`, the program computes 1.5 × 10 = 15 instead of 10.

Remove the brackets: `alpha * old + beta`. Python already multiplies before it adds.

The third test passes even with the bug, because when `beta` is 0 the brackets make no difference. That's why one test is never enough.
