---
slug: correct-add-mark-and-total
type: correct_code
title: Fix the new mark and the total
lesson: lists-storing-many-values
difficulty: hard
updated: 2026-10-09
---

## Question

This program keeps a List of marks. It should read one new mark, add it to the end of the List, then print the List, how many marks there are, and their total. It has **two** bugs. Find them and fix the program.

## Code

```python
marks = [15, 18, 12]
new_mark = int(input())
marks = marks.append(new_mark)
total = 0
for mark in marks:
    total = mark
print(marks)
print("Count:", len(marks))
print("Total:", total)
```

## Expected behavior

The user types one whole number. The program adds it to the end of `marks` and prints three lines. For `20` it prints:

```
[15, 18, 12, 20]
Count: 4
Total: 65
```

## Tests

### new mark is 20

```input
20
```

```output
[15, 18, 12, 20]
Count: 4
Total: 65
```

### new mark is 0

```input
0
```

```output
[15, 18, 12, 0]
Count: 4
Total: 45
```

### new mark is 18 (the same as an old mark)

```input
18
```

```output
[15, 18, 12, 18]
Count: 4
Total: 63
```

## Solution

```python
marks = [15, 18, 12]
new_mark = int(input())
marks.append(new_mark)
total = 0
for mark in marks:
    total = total + mark
print(marks)
print("Count:", len(marks))
print("Total:", total)
```

## Also accepted

```python
marks = [15, 18, 12]
new_mark = int(input())
marks.append(new_mark)
total = 0
for mark in marks:
    total += mark
print(marks)
print("Count:", len(marks))
print("Total:", total)
```

```python
marks = [15, 18, 12]
new_mark = int(input())
marks.append(new_mark)
total = 0
for mark in marks:
    total = mark + total
print(marks)
print("Count:", len(marks))
print("Total:", total)
```

```python
marks = [15, 18, 12]
new_mark = int(input())
marks = marks + [new_mark]
total = 0
for mark in marks:
    total = total + mark
print(marks)
print("Count:", len(marks))
print("Total:", total)
```

## Hints

- Run it once. The error message points at the `for` line. What is in `marks` at that moment?
- After the first bug is fixed, follow `total` for each item. Does it keep the old sum?

## Explanation

1. **`marks = marks.append(new_mark)` throws the List away.** `append()` changes the List and returns `None`, and the `=` stores that `None` in `marks`. The loop then fails with `TypeError: 'NoneType' object is not iterable`. Call `marks.append(new_mark)` on its own line.
2. **`total = mark` forgets the old sum.** Each round replaces `total` with the current mark, so at the end it only holds the last mark. A running total must add to itself: `total = total + mark` (or `total += mark`).
