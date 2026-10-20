---
slug: trace-list-running-total
type: trace
title: Change, append, then add up
lesson: lists-storing-many-values
difficulty: hard
updated: 2026-10-09
---

## Question

Trace the program by hand. What exactly does it print? Type one line of output per line.

## Code

```python
nums = [3, 8, 5]
nums.append(10)
nums[0] = nums[0] * 2
total = 0
for n in nums:
    total = total + n
    print(n, total)
print(len(nums), nums[-1])
```

## Answer

```output
6 6
8 14
5 19
10 29
4 10
```

## Hints

- Write down the whole List after line 2 and again after line 3, before the loop starts.
- `print(n, total)` prints both values on one line with a space between them.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 1 | make the List | nums = [3, 8, 5] | |
| 2 | `append(10)` adds 10 to the end | nums = [3, 8, 5, 10] | |
| 3 | item 0 becomes 3 * 2 | nums = [6, 8, 5, 10] | |
| 4 | the running total starts at 0 | total = 0 | |
| 5 | first round: `n` is the first item | n = 6; total = 0 | |
| 6 | 0 + 6 | n = 6; total = 6 | |
| 7 | print `n` and `total` | n = 6; total = 6 | 6 6\n |
| 6 | next round, `n` is 8: 6 + 8 | n = 8; total = 14 | |
| 7 | print `n` and `total` | n = 8; total = 14 | 8 14\n |
| 6 | next round, `n` is 5: 14 + 5 | n = 5; total = 19 | |
| 7 | print `n` and `total` | n = 5; total = 19 | 5 19\n |
| 6 | last round, `n` is 10: 19 + 10 | n = 10; total = 29 | |
| 7 | print `n` and `total` | n = 10; total = 29 | 10 29\n |
| 8 | the List has 4 items, and the last one is 10 | nums = [6, 8, 5, 10] | 4 10\n |

## Explanation

Before the loop, the List changes twice. `append(10)` adds a fourth item, giving `[3, 8, 5, 10]`. Then `nums[0] = nums[0] * 2` reads the first item (3), doubles it and puts 6 back in the same place: `[6, 8, 5, 10]`.

The loop visits the four items in order. `total` keeps a running sum, and the `print` is **inside** the loop, so it runs once per item: 6, then 6 + 8 = 14, then 19, then 29.

The last line runs once, after the loop: `len(nums)` is 4 and `nums[-1]` is the last item, 10.
