---
slug: final-m3-while-divide-by-three-checks
type: mcq
title: Dividing by 3 until 1 is left
lesson: while-loops-in-cpp
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A shop keeps one third of its 100 boxes each night (whole boxes only) and stops when there is one box or none. Study this loop. Which sentence is **completely** correct?

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int x = 100;
    int passes = 0;
    while (x > 1)
    {
        x = x / 3;
        passes++;
    }
    cout << passes << " " << x << endl;
    return 0;
}
```

## Options

- [x] The body runs 4 times, the condition is checked 5 times, and the program prints `4 1`.
  Right: `x` goes 100 → 33 → 11 → 3 → 1. That is 4 passes. The fifth check, `1 > 1`, is FALSE and stops the loop.
- [ ] The body runs 4 times, the condition is checked 4 times, and the program prints `4 1`.
  The output is right, but the condition is checked once more than the body runs: the last check is the FALSE one that ends the loop.
- [ ] The body runs 5 times, the condition is checked 6 times, and the program prints `5 0`.
  When `x` is 1, the check `1 > 1` is FALSE, so there is no pass that turns 1 into 0.
- [ ] The body runs 3 times, the condition is checked 4 times, and the program prints `3 3`.
  When `x` is 3, `3 > 1` is still TRUE, so there is one more pass: 3 / 3 = 1.

## Answer

```output
4 1
```

## Hints

- `x / 3` is int / int. Work out 100 / 3, 33 / 3 and 11 / 3 without decimals.
- Count the checks too: one before every pass, plus the one that is FALSE.

## Explanation

`x / 3` divides two `int` values, so only the whole part is kept:

| Check | `x > 1`? | x after the body | passes |
|---|---|---|---|
| 1 | `100 > 1` TRUE | 33 | 1 |
| 2 | `33 > 1` TRUE | 11 | 2 |
| 3 | `11 > 1` TRUE | 3 | 3 |
| 4 | `3 > 1` TRUE | 1 | 4 |
| 5 | `1 > 1` FALSE | (loop ends) | 4 |

So the body runs 4 times and the condition is checked 5 times. A `while` loop always checks its condition one more time than its body runs, because the last check is the one that is FALSE. The program prints `4 1`.
