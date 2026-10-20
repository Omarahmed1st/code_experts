---
slug: ops-trace-fan-boundary
type: trace
title: The fan at exactly 30 degrees
lesson: numbers-operators-and-decisions
difficulty: medium
updated: 2026-10-16
---

## Question

What exactly does this program print? Type one line of output per line.

## Code

```python
temp = 30
if temp > 30:
    print("Fan ON")
else:
    print("Fan OFF")
temp = temp + 1
if temp > 30:
    print("Fan ON")
else:
    print("Fan OFF")
```

## Answer

```output
Fan OFF
Fan ON
```

## Hints

- Is 30 greater than 30?
- Line 6 changes `temp` before the second `if`.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 2 | 30 > 30 is False | temp = 30 | |
| 5 | the else branch runs | temp = 30 | Fan OFF\n |
| 6 | 30 + 1 = 31 | temp = 31 | |
| 7 | 31 > 30 is True | temp = 31 | |
| 8 | the if branch runs | temp = 31 | Fan ON\n |

## Explanation

`>` means "strictly greater than", so `30 > 30` is `False` and the first `if` prints `Fan OFF`. After `temp = temp + 1`, `temp` is 31, and `31 > 30` is `True`, so the second `if` prints `Fan ON`.

In each `if`/`else`, exactly one branch runs. To switch the fan on at 30 as well, the condition would be `temp >= 30`.
