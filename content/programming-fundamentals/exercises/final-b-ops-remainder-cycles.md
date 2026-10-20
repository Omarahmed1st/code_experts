---
slug: final-b-ops-remainder-cycles
type: trace
title: Days of the week with %
lesson: operators
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

The days of the week are numbered 0 to 6, so day 5 plus 10 days must wrap around. The program also splits 50 hours into days and hours, and finds three more remainders. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int day = 5;
    int later = (day + 10) % 7;
    int weeks = (day + 10) / 7;
    cout << later << " " << weeks << endl;
    int hours = 50;
    cout << hours / 24 << " days " << hours % 24 << " hours" << endl;
    cout << 3 % 5 << " " << 5 % 3 << " " << 6 % 6 << endl;
    return 0;
}
```

## Answer

```output
1 2
2 days 2 hours
3 2 0
```

## Hints

- `day + 10` is 15. How many full weeks of 7 fit in 15, and what is left over?
- `3 % 5`: how many times does 5 fit into 3? Then what is left over?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `day` starts at 5 | day = 5 | |
| 6 | `15 % 7`: 7 × 2 = 14, 1 left over | day = 5; later = 1 | |
| 7 | `15 / 7` is 2 (int) | day = 5; later = 1; weeks = 2 | |
| 8 | print later and weeks | later = 1; weeks = 2 | 1 2\n |
| 9 | `hours` starts at 50 | hours = 50 | |
| 10 | `50 / 24` is 2, `50 % 24` is 2 (48 + 2) | hours = 50 | 2 days 2 hours\n |
| 11 | `3 % 5` is 3, `5 % 3` is 2, `6 % 6` is 0 | hours = 50 | 3 2 0\n |

## Explanation

`/` and `%` belong together: `/` gives how many whole times one number fits into another, and `%` gives what is **left over**.

- `day + 10` is 15. Seven fits into 15 twice (14), with 1 left over. So 15 days later is 2 full weeks (`weeks = 2`) and day number 1 (`later = 1`). The `%` keeps the day number inside 0 to 6.
- 50 hours: 24 fits twice (48), with 2 hours left over: `2 days 2 hours`.
- `3 % 5`: 5 fits into 3 **zero** times, so all of the 3 is left over. The answer is 3, not 2 and not 0. Swapping the numbers matters: `5 % 3` is 2. And `6 % 6` is 0, because 6 divides 6 with nothing left over.
