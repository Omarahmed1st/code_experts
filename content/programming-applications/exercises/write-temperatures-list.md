---
slug: write-temperatures-list
type: write_code
title: A List of three temperatures
lesson: lists-storing-many-values
difficulty: easy
updated: 2026-10-09
---

## Question

Write a program that reads three temperatures (whole numbers, one per line) and stores them in a List with `append()`. Then print the List, the total of the three values (add them up with a `for` loop), and the average.

## Code

```python
temps = []
# read three temperatures and append each one to temps

# add them up with a for loop

# print the List, the total and the average

```

## Expected behavior

For the inputs 30, 32 and 28 the program prints:

```
[30, 32, 28]
Total: 90
Average: 30.0
```

The average is the total divided by the number of items, using `/`, so it is always printed with a decimal point.

## Tests

### 30, 32 and 28

```input
30
32
28
```

```output
[30, 32, 28]
Total: 90
Average: 30.0
```

### below zero

```input
-2
0
5
```

```output
[-2, 0, 5]
Total: 3
Average: 1.0
```

### all zeros

```input
0
0
0
```

```output
[0, 0, 0]
Total: 0
Average: 0.0
```

## Solution

```python
temps = []
temps.append(int(input()))
temps.append(int(input()))
temps.append(int(input()))
total = 0
for t in temps:
    total = total + t
print(temps)
print("Total:", total)
print("Average:", total / len(temps))
```

## Hints

- `input()` gives text. Convert it with `int()` before you append it, or the List will hold Strings like `'30'`.
- Start `total` at 0 before the loop, and add one item each round.
- Divide by `len(temps)` instead of writing 3.

## Explanation

Each `temps.append(int(input()))` reads one line, turns it into a whole number and adds it to the end of the List. Call `append()` without `=`, because it returns nothing.

The `for` loop visits each item and keeps a running sum in `total`, which starts at 0. The average is `total / len(temps)`. The `/` operator always gives a float, so 90 / 3 prints as `30.0`. Using `len(temps)` instead of 3 means the line still works if you later store more temperatures.
