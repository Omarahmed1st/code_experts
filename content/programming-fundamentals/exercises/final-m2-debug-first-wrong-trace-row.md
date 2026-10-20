---
slug: final-m2-debug-first-wrong-trace-row
type: mcq
title: The first wrong row of a trace
lesson: loops-with-decisions-and-debugging
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A student traced this loop by hand to predict its output, and wrote down `total` **after** each pass:

| i | total after the pass |
|---|---|
| 1 | -1 |
| 2 | -2 |
| 3 | 6 |
| 4 | 5 |
| 5 | 4 |
| 6 | 16 |

So the student predicted that the program prints `16`. But the program really prints `14`. Where is the student's **first** mistake?

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int total = 0;
    for (int i = 1; i <= 6; i++)
    {
        if (i % 3 == 0)
        {
            total += i * 2;
        }
        else
        {
            total -= 1;
        }
    }
    cout << total << endl;
    return 0;
}
```

## Options

- [x] The row for `i = 3`: `total` should be 4, not 6.
  Right: `total += i * 2` **adds** 6 to the old total, −2, so the result is 4. The student stored 6 as if the line were `total = i * 2`. The rows after it are worked out correctly, but from a wrong value.
- [ ] The row for `i = 1`: `total` should be 0, because `total` starts at 0.
  `1 % 3` is 1, not 0, so the `else` path runs in the first pass and takes 1 away: 0 − 1 = −1. That row is right.
- [ ] The row for `i = 4`: `total` should stay the same, because 4 is not a multiple of 3.
  When `4 % 3 == 0` is FALSE, the `else` path runs, and it **does** change `total`: it takes 1 away. Taking 1 from the value above is the right step.
- [ ] The row for `i = 6`: `total` should be 18.
  The student's step here is right: 4 + 6 × 2 = 16 adds 12 to the row above. The difference comes from an earlier row, so this is not the **first** mistake.

## Hints

- Check each row from the top, using the row above it as the old value. Which path runs for each `i`?
- `total += x` means `total = total + x`. Does the student's row for `i = 3` add anything to the old total?

## Explanation

To debug a trace, check the rows **in order**, each one from the row above it. Only `i` = 3 and 6 are multiples of 3; every other pass takes the `else` path and subtracts 1.

| i | path | correct total |
|---|---|---|
| 1 | else: −1 | −1 |
| 2 | else: −1 | −2 |
| 3 | if: + 3 × 2 | 4 |
| 4 | else: −1 | 3 |
| 5 | else: −1 | 2 |
| 6 | if: + 6 × 2 | 14 |

The student's first two rows match. In row 3 the student wrote 6, replacing the total instead of adding to it. Every later row then carries that mistake along: each step after it is done correctly, but from a value that is 2 too high, so the prediction ends at 16 instead of 14. A trace table finds a bug fastest when you look for the **first** row that goes wrong, not the last.
