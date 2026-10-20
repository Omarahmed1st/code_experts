---
slug: cvm-correct-good-count
type: correct_code
title: Fix the good-match counter
lesson: feature-matching
difficulty: medium
updated: 2026-10-16
---

## Question

The program reads a limit, then the distances of some matches on one line, and counts the **good** matches: those with a distance **below** the limit. One comparison is wrong. Fix it.

## Code

```python
limit = int(input())
distances = input().split()
good = 0
for text in distances:
    if int(text) > limit:
        good = good + 1
print(good, "good matches")
```

## Expected behavior

A match is good when its distance is smaller than the limit. For a limit of 10 and the distances `1 7 9 33 39 41 52 58 66 90`, three are good.

## Tests

### limit 10

```input
10
1 7 9 33 39 41 52 58 66 90
```

```output
3 good matches
```

### limit 60

```input
60
1 7 9 33 39 41 52 58 66 90
```

```output
8 good matches
```

### limit 40

```input
40
1 7 9 33 39 41 52 58 66 90
```

```output
5 good matches
```

## Solution

```python
limit = int(input())
distances = input().split()
good = 0
for text in distances:
    if int(text) < limit:
        good = good + 1
print(good, "good matches")
```

## Also accepted

```python
limit = int(input())
distances = input().split()
good = 0
for text in distances:
    if limit > int(text):
        good = good + 1
print(good, "good matches")
```

## Hints

- Is a small distance a good match or a bad one?
- For the limit 10, which three distances should be counted?

## Explanation

The distance counts differing bits, so **smaller is better**: a good match has `distance < limit`. With `>`, the program counted the bad matches instead. This is the same test as `good = [m for m in matches if m.distance < 40]` in the lecture.

The limit-40 test passes even with the bug, because exactly 5 distances are below 40 and 5 are above it.
