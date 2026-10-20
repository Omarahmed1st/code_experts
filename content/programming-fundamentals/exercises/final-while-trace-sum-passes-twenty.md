---
slug: final-while-trace-sum-passes-twenty
type: trace
title: Adding until the sum passes 20
lesson: counters-accumulators-and-input-loops
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This loop is controlled by an **accumulator**, not by a counter. After the loop, it works out an average in two ways. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int sum = 0;
    int count = 0;
    int n = 1;
    while (sum <= 20)
    {
        sum += n;
        n += 3;
        count++;
    }
    cout << count << " " << sum << " " << n << endl;
    cout << sum / count << endl;
    float total = sum;
    cout << total / count << endl;
    return 0;
}
```

## Answer

```output
4 22 13
5
5.5
```

## Hints

- In each pass, `sum` grows by the **old** `n`, and then `n` grows by 3. Which value of `sum` first makes `sum <= 20` FALSE?
- `sum / count` divides two `int` values. `total / count` divides a `float` by an `int`.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | initialization | sum = 0; count = 0; n = 1 | |
| 8 | `0 <= 20` TRUE: add 1, then n + 3 | sum = 1; count = 1; n = 4 | |
| 8 | `1 <= 20` TRUE: add 4, then n + 3 | sum = 5; count = 2; n = 7 | |
| 8 | `5 <= 20` TRUE: add 7, then n + 3 | sum = 12; count = 3; n = 10 | |
| 8 | `12 <= 20` TRUE: add 10, then n + 3 | sum = 22; count = 4; n = 13 | |
| 8 | `22 <= 20` FALSE, the loop ends | sum = 22; count = 4; n = 13 | |
| 14 | print count, sum and n | sum = 22; count = 4; n = 13 | 4 22 13\n |
| 15 | `22 / 4`: int / int | sum = 22; count = 4 | 5\n |
| 16 | `total` is 22 as a float; `22 / 4` keeps the decimals | total = 22; count = 4 | 5.5\n |

## Explanation

The accumulator `sum` adds 1, 4, 7 and 10 (the values of `n`, which goes up by 3): 1, 5, 12, 22. The condition is only checked at the top of the loop, so when `sum` is 12 one more full pass runs and takes it past 20, to 22. Then `22 <= 20` is FALSE. The counter `count` went up once per pass, so it is 4, and `n` has already moved on to 13.

After the loop, `sum / count` divides two `int` values, so 22 / 4 gives only the whole part, `5`. Storing `sum` in the `float` variable `total` and dividing that by `count` keeps the decimal part: `5.5`. This is why an average is worked out with a `float`, once, after the loop.
