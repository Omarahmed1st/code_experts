---
slug: ops-write-weeks-and-days
type: write_code
title: Weeks and days
lesson: numbers-operators-and-decisions
difficulty: medium
updated: 2026-10-16
---

## Question

Write a program that reads a whole number of days and prints how many whole weeks and extra days that is, in this form:

```
100 days is 14 weeks and 2 days
```

Use `//` and `%`.

## Code

```python
days = int(input())
# work out the weeks and the days left over

```

## Expected behavior

The user types a whole number of days. The program prints one line: the number, `days is`, the whole weeks, `weeks and`, the days left over and `days`.

## Tests

### 100 days

```input
100
```

```output
100 days is 14 weeks and 2 days
```

### exactly one week

```input
7
```

```output
7 days is 1 weeks and 0 days
```

### less than a week

```input
6
```

```output
6 days is 0 weeks and 6 days
```

## Solution

```python
days = int(input())
weeks = days // 7
left = days % 7
print(days, "days is", weeks, "weeks and", left, "days")
```

## Hints

- A week has 7 days. How many whole 7s fit into the number?
- `%` gives what is left over after the whole weeks.

## Explanation

`days // 7` counts the **whole** weeks and drops the rest: 100 // 7 is 14. `days % 7` is the **remainder**: 100 − 14 × 7 = 2. This is the same pattern as turning minutes into hours and minutes, with 7 instead of 60.

(The output says "1 weeks" to keep the program short; making it say "1 week" needs an `if`, which you can add as an extra.)
