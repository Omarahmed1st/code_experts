---
slug: final-m3-acc-trace-before-and-after
type: trace
title: Adding before or after the count
lesson: counters-accumulators-and-input-loops
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

Mona and Nour both plan to save "5 piastres times the day number". They share one counter, `day`, but Mona adds to her total **before** the counter changes and Nour adds **after** it. Trace the program by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int day = 0;
    int mona = 0;
    int nour = 0;
    while (day < 4)
    {
        mona += day * 5;
        day++;
        nour += day * 5;
    }
    cout << mona << " " << nour << endl;
    cout << nour - mona << endl;
    cout << day << endl;
    return 0;
}
```

## Answer

```output
30 50
20
4
```

## Hints

- In the first pass, `day` is 0 on line 10 and 1 on line 12.
- `mona += day * 5` means `mona = mona + day * 5`, and `*` is done before the addition.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | initialization | day = 0; mona = 0; nour = 0 | |
| 10 | pass 1: mona adds 0 × 5, day becomes 1, nour adds 1 × 5 | day = 1; mona = 0; nour = 5 | |
| 10 | pass 2: mona adds 1 × 5, day becomes 2, nour adds 2 × 5 | day = 2; mona = 5; nour = 15 | |
| 10 | pass 3: mona adds 2 × 5, day becomes 3, nour adds 3 × 5 | day = 3; mona = 15; nour = 30 | |
| 10 | pass 4: mona adds 3 × 5, day becomes 4, nour adds 4 × 5 | day = 4; mona = 30; nour = 50 | |
| 8 | `4 < 4` FALSE, the loop ends | day = 4; mona = 30; nour = 50 | |
| 14 | print both totals | day = 4; mona = 30; nour = 50 | 30 50\n |
| 15 | 50 − 30 | day = 4; mona = 30; nour = 50 | 20\n |
| 16 | print day | day = 4 | 4\n |

## Explanation

The loop runs 4 times: `day` is 0, 1, 2, 3 at the start of the passes, and when it becomes 4, `4 < 4` is FALSE.

- Mona's line runs **before** `day++`, so she adds 0, 5, 10 and 15: her total is 30. Her first "saving" is 0 piastres.
- Nour's line runs **after** `day++`, so she adds 5, 10, 15 and 20: her total is 50.

Both accumulators start at 0 before the loop and add in every pass; the only difference is the position of one line. Each of Nour's additions is 5 bigger than Mona's in the same pass, so the difference is 4 × 5 = 20. After the loop, `day` is 4.
