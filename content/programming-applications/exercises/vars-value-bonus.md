---
slug: vars-value-bonus
type: trace
ask: value
title: What is the bonus?
lesson: variables-and-data-types
difficulty: medium
updated: 2026-10-16
---

## Question

What is the value of `bonus` **when the last line runs**? Type the number only.

## Code

```python
score = 10
score = score + 5
bonus = score
score = score * 2
bonus = bonus - 1
print("Done")
```

```python verify
score = 10
score = score + 5
bonus = score
score = score * 2
bonus = bonus - 1
print(bonus)
```

## Answer

```output
14
```

## Hints

- Follow `score` line by line first. What does it hold when line 3 runs?
- Line 4 changes `score` only.

## Explanation

1. `score` starts at 10, then becomes 15.
2. `bonus = score` copies 15 into `bonus`.
3. `score = score * 2` makes `score` 30, but `bonus` keeps its own copy, 15.
4. `bonus = bonus - 1` makes `bonus` **14**.

A common wrong answer is 29: that would only be right if `bonus` followed `score` around, and variables never do that.
