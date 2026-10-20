---
slug: io-order-average-of-two
type: correct_code
ask: order
title: Put the average program in order
lesson: input-processing-and-output
difficulty: easy
updated: 2026-10-16
---

## Question

The program reads two marks and prints their average. Move the mixed-up lines into the right order: input, then processing, then output.

## Code

```python
# [order]
a = float(input())
b = float(input())
average = (a + b) / 2
print("Average:", average)
# [/order]
```

## Expected behavior

The user types two marks. For `70` and `85` the program prints `Average: 77.5`.

## Tests

### 70 and 85

```input
70
85
```

```output
Average: 77.5
```

### 90 and 90

```input
90
90
```

```output
Average: 90.0
```

## Also accepted

```python
b = float(input())
a = float(input())
average = (a + b) / 2
print("Average:", average)
```

## Hints

- A variable needs its value before a line can use it.
- Input comes first, output comes last.

## Explanation

The order follows **input → processing → output**:

1. Read the two marks (input). These two lines can swap: the average is the same whichever mark goes into `a`.
2. `average = (a + b) / 2` needs both marks, so it comes after them (processing).
3. `print` shows the result, so it comes last (output).

The brackets make Python add the marks before dividing; `/` always gives a float, so 90 and 90 give `90.0`.
