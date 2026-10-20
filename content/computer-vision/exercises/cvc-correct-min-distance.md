---
slug: cvc-correct-min-distance
type: correct_code
title: Fix the minimum distance filter
lesson: finding-corners
difficulty: hard
updated: 2026-10-16
---

## Question

This program copies what `minDistance` does in `goodFeaturesToTrack`. It reads the minimum distance, the number of corners, then each corner as `x y`, strongest first. It keeps a corner only if it is at least the minimum distance away from **every** corner kept before it. One comparison is the wrong way round. Fix it.

## Code

```python
min_distance = int(input())
count = int(input())
kept = []
for i in range(count):
    parts = input().split()
    x = int(parts[0])
    y = int(parts[1])
    too_close = False
    for kx, ky in kept:
        d = ((x - kx) ** 2 + (y - ky) ** 2) ** 0.5
        if d > min_distance:
            too_close = True
    if not too_close:
        kept.append((x, y))
print(len(kept), "corners kept")
for kx, ky in kept:
    print(kx, ky)
```

## Expected behavior

A corner is dropped when it is **closer** than `min_distance` to a corner already kept. A corner exactly `min_distance` away is kept. The program prints how many corners are kept, then each one.

## Tests

### minimum distance 10

```input
10
5
710 319
714 322
52 88
60 88
52 100
```

```output
3 corners kept
710 319
52 88
52 100
```

### minimum distance 5

```input
5
5
710 319
714 322
52 88
60 88
52 100
```

```output
5 corners kept
710 319
714 322
52 88
60 88
52 100
```

### minimum distance 20

```input
20
5
710 319
714 322
52 88
60 88
52 100
```

```output
2 corners kept
710 319
52 88
```

## Solution

```python
min_distance = int(input())
count = int(input())
kept = []
for i in range(count):
    parts = input().split()
    x = int(parts[0])
    y = int(parts[1])
    too_close = False
    for kx, ky in kept:
        d = ((x - kx) ** 2 + (y - ky) ** 2) ** 0.5
        if d < min_distance:
            too_close = True
    if not too_close:
        kept.append((x, y))
print(len(kept), "corners kept")
for kx, ky in kept:
    print(kx, ky)
```

## Hints

- (714, 322) is 5 pixels from (710, 319): 4 across and 3 down. With a minimum distance of 10, should it be kept?
- "Too close" means the distance is **smaller** than the minimum.

## Explanation

`d` is the straight-line distance between two corners. A corner is too close when `d < min_distance`. The program had `d > min_distance`, so it threw away corners that were **far** from the kept ones and kept the ones bunched together, the opposite of what `minDistance` is for.

With `<`, a corner exactly `min_distance` away is kept, which is why (714, 322) stays in the second test: it is exactly 5 pixels from (710, 319).
