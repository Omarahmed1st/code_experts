---
slug: cvn-trace-median-average
type: trace
title: Median and average of a noisy patch
lesson: smoothing-and-noise
difficulty: medium
updated: 2026-10-16
---

## Question

A 3 × 3 patch of a grey area near 90 has one white dot (255) and one black dot (0). What exactly does the program print?

## Code

```python
patch = [88, 92, 90,
         255, 91, 89,
         0, 93, 94]
values = sorted(patch)
print(values)
print("median:", values[4])
print("average:", round(sum(patch) / len(patch), 1))
```

## Answer

```output
[0, 88, 89, 90, 91, 92, 93, 94, 255]
median: 91
average: 99.1
```

## Hints

- `sorted()` gives a new List, smallest first.
- With 9 values, the middle one is at index 4.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 4 | sort the nine values | values = [0, 88, 89, 90, 91, 92, 93, 94, 255] | |
| 5 | print the sorted List | | [0, 88, 89, 90, 91, 92, 93, 94, 255]\n |
| 6 | the fifth value, index 4 | | median: 91\n |
| 7 | 892 ÷ 9 = 99.11…, rounded to one decimal | | average: 99.1\n |

## Explanation

After sorting, the two noisy values sit at the two ends of the List, so the median, **91**, is a normal grey value from the patch.

The average adds everything up. The 255 and the 0 don't cancel out: together they add 255, about 75 more than two normal pixels would, so the average becomes **99.1**, brighter than every normal pixel in the patch. This is why a median filter removes salt-and-pepper dots and an average filter only smears them.
