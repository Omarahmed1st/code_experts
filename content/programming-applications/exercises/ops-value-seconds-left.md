---
slug: ops-value-seconds-left
type: trace
ask: value
title: Hours, minutes and seconds
lesson: numbers-operators-and-decisions
difficulty: medium
updated: 2026-10-16
---

## Question

The program splits 3725 seconds into hours, minutes and seconds. What is the value of `seconds` **when the last line runs**? Type the number only.

## Code

```python
total = 3725
hours = total // 3600
rest = total % 3600
minutes = rest // 60
seconds = rest % 60
print(hours, "h", minutes, "min")
```

```python verify
total = 3725
hours = total // 3600
rest = total % 3600
minutes = rest // 60
seconds = rest % 60
print(seconds)
```

## Answer

```output
5
```

## Hints

- One hour is 3600 seconds. How many whole hours fit into 3725, and what is left over?
- Then split what is left into minutes and seconds the same way.

## Explanation

1. `3725 // 3600` is **1** whole hour.
2. `3725 % 3600` is what is left: 3725 − 3600 = **125** seconds.
3. `125 // 60` is **2** whole minutes.
4. `125 % 60` is what is left after 2 minutes (120 seconds): **5**.

So 3725 seconds is 1 hour, 2 minutes and 5 seconds. `//` gives "how many whole ones", `%` gives "how many are left over".
