---
slug: final-m2-debug-trace-rising-days
type: trace
title: Was day 1 really warmer?
lesson: loops-with-decisions-and-debugging
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This program makes up a temperature for each of 6 days with a formula, and compares each day with the day **before** it, kept in `prev`. Watch the order of `*` and `%` in the formula, and the starting value of `prev`. Trace the program by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int t;
    int prev = 0;
    int rises = 0;
    for (int day = 1; day <= 6; day++)
    {
        t = 20 + day * 7 % 10;
        if (t > prev)
        {
            cout << day << ": " << t << " up" << endl;
            rises++;
        }
        else
        {
            cout << day << ": " << t << " down" << endl;
        }
        prev = t;
    }
    cout << "Rises: " << rises << endl;
    return 0;
}
```

## Answer

```output
1: 27 up
2: 24 down
3: 21 down
4: 28 up
5: 25 down
6: 22 down
Rises: 2
```

## Hints

- `day * 7 % 10`: `*` and `%` have the same rank, so go from left to right, and add 20 last. For day 2: 14, then 4, then 24.
- `prev = t` runs at the end of each pass. On day 1, what is in `prev`?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 6 | `prev` starts at 0 | prev = 0; rises = 0 | |
| 10 | day 1: 20 + 7 % 10 | day = 1; t = 27 | |
| 11 | `27 > 0` TRUE | t = 27; prev = 0 | 1: 27 up\n |
| 20 | rises 1, prev = 27 | prev = 27; rises = 1 | |
| 10 | day 2: 20 + 14 % 10 | day = 2; t = 24 | |
| 11 | `24 > 27` FALSE | t = 24; prev = 27 | 2: 24 down\n |
| 20 | prev = 24 | prev = 24; rises = 1 | |
| 10 | day 3: 20 + 21 % 10 | day = 3; t = 21 | |
| 11 | `21 > 24` FALSE | t = 21; prev = 24 | 3: 21 down\n |
| 20 | prev = 21 | prev = 21; rises = 1 | |
| 10 | day 4: 20 + 28 % 10 | day = 4; t = 28 | |
| 11 | `28 > 21` TRUE | t = 28; prev = 21 | 4: 28 up\n |
| 20 | rises 2, prev = 28 | prev = 28; rises = 2 | |
| 10 | day 5: 20 + 35 % 10 | day = 5; t = 25 | |
| 11 | `25 > 28` FALSE | t = 25; prev = 28 | 5: 25 down\n |
| 20 | prev = 25 | prev = 25; rises = 2 | |
| 10 | day 6: 20 + 42 % 10 | day = 6; t = 22 | |
| 11 | `22 > 25` FALSE | t = 22; prev = 25 | 6: 22 down\n |
| 20 | prev = 22 | prev = 22; rises = 2 | |
| 8 | `7 <= 6` FALSE, the loop ends | rises = 2 | |
| 22 | print rises | rises = 2 | Rises: 2\n |

## Explanation

**The formula.** `*` and `%` have the same rank and go left to right, and `+` comes last. So for each day, `day * 7` is worked out, then `% 10` keeps its last digit, then 20 is added: 27, 24, 21, 28, 25, 22.

**The decision.** Each pass compares today's `t` with `prev`, and only **after** the decision does `prev = t` save today's value for tomorrow. So day 2 is compared with 27, day 3 with 24, and so on: only day 4 (28 after 21) is a real rise.

**Day 1.** On the first pass `prev` still holds its starting value, 0, so `27 > 0` is TRUE and day 1 is printed as `up` and counted. That is why `rises` is 2, not 1. There is no day before day 1, so this rise is not real: it comes from the starting value. This is the "wrong starting value" mistake from the debugging lecture. One fix is to start `prev` at a very high value such as 100, so the first comparison is always FALSE.
