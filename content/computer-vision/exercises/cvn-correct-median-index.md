---
slug: cvn-correct-median-index
type: correct_code
title: Fix the median of five neighbours
lesson: smoothing-and-noise
difficulty: medium
updated: 2026-10-16
---

## Question

The program reads five neighbouring pixel values on one line and prints their median and their average. The median is often wrong. Fix it.

## Code

```python
numbers = []
for text in input().split():
    numbers.append(int(text))
median = numbers[2]
average = round(sum(numbers) / len(numbers), 1)
print("median:", median)
print("average:", average)
```

## Expected behavior

The user types five whole numbers separated by spaces. The median is the middle value **after sorting**. For `12 14 255 13 0` the program prints:

```
median: 13
average: 58.8
```

## Tests

### a white and a black dot

```input
12 14 255 13 0
```

```output
median: 13
average: 58.8
```

### already in order

```input
90 91 92 93 94
```

```output
median: 92
average: 92.0
```

### a white dot in the middle

```input
30 0 255 31 29
```

```output
median: 30
average: 69.0
```

## Solution

```python
numbers = []
for text in input().split():
    numbers.append(int(text))
numbers.sort()
median = numbers[2]
average = round(sum(numbers) / len(numbers), 1)
print("median:", median)
print("average:", average)
```

## Also accepted

```python
numbers = []
for text in input().split():
    numbers.append(int(text))
median = sorted(numbers)[2]
average = round(sum(numbers) / len(numbers), 1)
print("median:", median)
print("average:", average)
```

## Hints

- Is index 2 the middle value of `[12, 14, 255, 13, 0]`?
- Lists have a method that puts their items in order.

## Explanation

Index 2 is the middle **position**, but the median is the middle **value**, and that is only at index 2 after sorting. In the first test, index 2 holds the white dot, 255. Sorted, the list is `[0, 12, 13, 14, 255]` and index 2 holds **13**.

The second test passes even with the bug, because its values were already in order. Sorting doesn't change the average, since the sum stays the same.
