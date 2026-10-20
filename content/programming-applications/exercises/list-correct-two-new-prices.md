---
slug: list-correct-two-new-prices
type: correct_code
title: Fix the two new prices
lesson: lists-storing-many-values
difficulty: medium
updated: 2026-10-10
---

## Question

A shop keeps its prices (in pounds) in a List. This program reads two new prices, adds both to the end of the List, then prints the List, the last price and the average price. It has **two** bugs. Find them and fix the program.

## Code

```python
prices = [25, 40, 10]
a = int(input())
b = int(input())
prices.append(a, b)
total = 0
for p in prices:
    total = total + p
print(prices)
print("Last:", prices[len(prices)])
print("Average:", total / len(prices))
```

## Expected behavior

The user types two whole numbers, one per line. The program adds them to the end of `prices` (first `a`, then `b`) and prints three lines. For `30` and `15` it prints:

```
[25, 40, 10, 30, 15]
Last: 15
Average: 24.0
```

## Tests

### 30 and 15

```input
30
15
```

```output
[25, 40, 10, 30, 15]
Last: 15
Average: 24.0
```

### 0 and 5

```input
0
5
```

```output
[25, 40, 10, 0, 5]
Last: 5
Average: 16.0
```

### 7 and 8

```input
7
8
```

```output
[25, 40, 10, 7, 8]
Last: 8
Average: 18.0
```

## Solution

```python
prices = [25, 40, 10]
a = int(input())
b = int(input())
prices.append(a)
prices.append(b)
total = 0
for p in prices:
    total = total + p
print(prices)
print("Last:", prices[-1])
print("Average:", total / len(prices))
```

## Also accepted

```python
prices = [25, 40, 10]
a = int(input())
b = int(input())
prices.append(a)
prices.append(b)
total = 0
for p in prices:
    total = total + p
print(prices)
print("Last:", prices[len(prices) - 1])
print("Average:", total / len(prices))
```

## Hints

- Run it once and read the last line of the error. How many items can `append()` add in one call?
- After the first fix, `prices` has 5 items. Which indexes does it have? Is 5 one of them?

## Explanation

1. **`append()` adds one item at a time.** `prices.append(a, b)` raises `TypeError: list.append() takes exactly one argument (2 given)`. Call it twice, once for each price: `prices.append(a)` and then `prices.append(b)`.
2. **`prices[len(prices)]` is always out of range.** A List with 5 items has indexes 0 to 4, so index 5 raises `IndexError: list index out of range`. The last item is `prices[-1]`, or `prices[len(prices) - 1]`.

The average line was already right: `total / len(prices)` divides by the real number of items, and `/` always gives a float, so 120 / 5 prints as `24.0`.
