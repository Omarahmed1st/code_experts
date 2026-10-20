---
slug: final-m4-for-trace-four-headers
type: trace
title: Four for headers that look alike
lesson: for-loops
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

These four `for` loops each add their values of `i` to their own total. The headers look alike, but the start, the condition and the update are different in each. For each loop, find the values `i` takes **before** the condition becomes FALSE. Trace the program by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int up = 0;
    int down = 0;
    int never = 0;
    int exact = 0;
    for (int i = 1; i <= 10; i += 4)
    {
        up += i;
    }
    for (int i = 10; i >= 1; i -= 4)
    {
        down += i;
    }
    for (int i = 10; i <= 1; i -= 4)
    {
        never += i;
    }
    for (int i = 2; i != 14; i += 3)
    {
        exact += i;
    }
    cout << "up: " << up << endl;
    cout << "down: " << down << endl;
    cout << "never: " << never << endl;
    cout << "exact: " << exact << endl;
    return 0;
}
```

## Answer

```output
up: 15
down: 18
never: 0
exact: 26
```

## Hints

- The condition is checked **before** the first pass too. In the third loop, is `10 <= 1` TRUE?
- In the fourth loop, the condition is `i != 14`. List the values 2, 5, 8 … and check whether one of them is exactly 14.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 9 | i = 1, 5, 9; then `13 <= 10` is FALSE | up = 15 | |
| 13 | i = 10, 6, 2; then `-2 >= 1` is FALSE | down = 18 | |
| 17 | `10 <= 1` is FALSE at the first check: 0 passes | never = 0 | |
| 21 | i = 2, 5, 8, 11; then `14 != 14` is FALSE | exact = 26 | |
| 25 | print up | up = 15 | up: 15\n |
| 26 | print down | down = 18 | down: 18\n |
| 27 | print never | never = 0 | never: 0\n |
| 28 | print exact | exact = 26 | exact: 26\n |

## Explanation

For every `for` loop: the initialization runs once, the condition is checked **before each pass** (the first one included), and the update runs after each pass.

- **Loop 1** (`i = 1; i <= 10; i += 4`): `i` is 1, 5, 9. The next value, 13, fails the condition. Total: 1 + 5 + 9 = 15.
- **Loop 2** (`i = 10; i >= 1; i -= 4`): it covers the same range downward, but starting from 10 gives different values: 10, 6, 2. Then −2 fails. Total: 18. Counting down is not just counting up backwards; the values depend on where you start.
- **Loop 3** (`i = 10; i <= 1; i -= 4`): the very first check, `10 <= 1`, is FALSE, so the body runs **zero** times and `never` stays 0. (If the check had been TRUE, `i -= 4` would have moved `i` the wrong way.)
- **Loop 4** (`i = 2; i != 14; i += 3`): `i` is 2, 5, 8, 11, and then exactly 14, so `14 != 14` is FALSE and the loop stops. Total: 2 + 5 + 8 + 11 = 26. A `!=` condition only works when the steps land **exactly** on the stop value; with a start of 1 it would jump over 14 and never stop.
