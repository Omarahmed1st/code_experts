---
slug: cvf-correct-clip
type: correct_code
title: Fix the 0 to 255 limit
lesson: sharpening-images
difficulty: medium
updated: 2026-10-16
---

## Question

The program reads a pixel and its four neighbours on one line (centre, above, below, left, right), applies the sharpening kernel and keeps the result between 0 and 255. It prints 0 for almost everything. Fix it.

## Code

```python
values = input().split()
centre = int(values[0])
above = int(values[1])
below = int(values[2])
left = int(values[3])
right = int(values[4])
new = 5 * centre - above - below - left - right
new = min(0, max(255, new))
print(new)
```

## Expected behavior

The program prints **5 × centre − above − below − left − right**, but a result below 0 becomes 0 and a result above 255 becomes 255.

## Tests

### the dark side of an edge

```input
50 50 50 50 200
```

```output
0
```

### the bright side of an edge

```input
200 200 200 50 200
```

```output
255
```

### a flat area

```input
90 90 90 90 90
```

```output
90
```

### next to a darker pixel

```input
90 90 90 50 90
```

```output
130
```

## Solution

```python
values = input().split()
centre = int(values[0])
above = int(values[1])
below = int(values[2])
left = int(values[3])
right = int(values[4])
new = 5 * centre - above - below - left - right
new = max(0, min(255, new))
print(new)
```

## Also accepted

```python
values = input().split()
centre = int(values[0])
above = int(values[1])
below = int(values[2])
left = int(values[3])
right = int(values[4])
new = 5 * centre - above - below - left - right
new = min(255, max(0, new))
print(new)
```

## Hints

- Work out `max(255, 90)`, then `min(0, …)` of that.
- Which function stops values from going **above** 255: `min` or `max`?

## Explanation

`min(255, new)` gives the smaller of the two, so it stops values **above** 255. `max(0, …)` gives the bigger, so it stops values **below** 0. The program had them swapped: `max(255, new)` is always at least 255, and `min(0, …)` of that is always 0.

The first test passes even with the bug, because its correct answer happens to be 0.
