---
slug: cvd-correct-threshold-rule
type: correct_code
title: Fix Canny's two-threshold rule
lesson: features-and-edges
difficulty: medium
updated: 2026-10-16
---

## Question

The program decides, for one pixel, whether Canny keeps it as an edge. It reads the strength of the change, the low and high thresholds, and `yes` or `no` for whether the pixel connects to a sure edge. One word on the `elif` line is wrong. Fix it.

## Code

```python
strength = int(input())
low = int(input())
high = int(input())
connected = input()
if strength > high:
    print("edge")
elif strength > low or connected == "yes":
    print("edge")
else:
    print("not an edge")
```

## Expected behavior

- stronger than `high`: `edge`
- between `low` and `high`: `edge` only if it connects to a sure edge, otherwise `not an edge`
- weaker than `low`: `not an edge`, even when it connects

## Tests

### a strong change

```input
250
100
200
no
```

```output
edge
```

### a medium change that connects

```input
150
100
200
yes
```

```output
edge
```

### a medium change on its own

```input
150
100
200
no
```

```output
not an edge
```

### a weak change next to an edge

```input
50
100
200
yes
```

```output
not an edge
```

## Solution

```python
strength = int(input())
low = int(input())
high = int(input())
connected = input()
if strength > high:
    print("edge")
elif strength > low and connected == "yes":
    print("edge")
else:
    print("not an edge")
```

## Also accepted

```python
strength = int(input())
low = int(input())
high = int(input())
connected = input()
if strength > high:
    print("edge")
elif strength >= low and connected == "yes":
    print("edge")
else:
    print("not an edge")
```

## Hints

- For a medium change, **both** things must be true: it is above `low`, and it connects.
- Try the third test by hand. Which part of the `elif` makes it `edge`?

## Explanation

A medium change is kept only when it is above `low` **and** connects to a sure edge, so the two conditions must be joined with `and`. With `or`, every change above `low` became an edge (third test), and even weak changes became edges whenever they touched one (fourth test).
