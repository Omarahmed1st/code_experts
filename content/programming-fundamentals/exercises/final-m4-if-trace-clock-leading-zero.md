---
slug: final-m4-if-trace-clock-leading-zero
type: trace
title: A clock that needs a zero
lesson: decisions-if-then-else
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A bus timetable stores each time as the number of minutes after midnight. The program turns it into hours and minutes, and uses a decision to write a `0` in front of a one-digit minute, so that 9 hours and 5 minutes looks like a clock. The last time is shown on a 12-hour clock. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int total = 545;
    int hour = total / 60;
    int minute = total % 60;
    if (minute < 10)
    {
        cout << hour << ":0" << minute << endl;
    }
    else
    {
        cout << hour << ":" << minute << endl;
    }
    total = total + 50;
    hour = total / 60;
    minute = total % 60;
    if (minute < 10)
    {
        cout << hour << ":0" << minute << endl;
    }
    else
    {
        cout << hour << ":" << minute << endl;
    }
    total = total * 2 + 15;
    hour = total / 60;
    minute = total % 60;
    if (hour > 12)
    {
        hour = hour - 12;
    }
    cout << hour << ":" << minute << endl;
    return 0;
}
```

## Answer

```output
9:05
9:55
8:5
```

## Hints

- In `":0"`, the 0 is part of the text in quotes, so it is printed as a character before the minute.
- The last `cout` (line 34) is not inside any decision. Which values do `hour` and `minute` hold by then?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | 545 minutes after midnight | total = 545 | |
| 6 | 545 / 60 and 545 % 60 | total = 545; hour = 9; minute = 5 | |
| 8 | `5 < 10` is TRUE | hour = 9; minute = 5 | |
| 10 | print with `":0"` | hour = 9; minute = 5 | 9:05\n |
| 16 | 545 + 50 | total = 595 | |
| 17 | 595 / 60 and 595 % 60 | total = 595; hour = 9; minute = 55 | |
| 19 | `55 < 10` is FALSE | hour = 9; minute = 55 | |
| 25 | the ELSE path, `":"` | hour = 9; minute = 55 | 9:55\n |
| 27 | 595 × 2 + 15 | total = 1205 | |
| 28 | 1205 / 60 and 1205 % 60 | total = 1205; hour = 20; minute = 5 | |
| 30 | `20 > 12` is TRUE: 20 − 12 | hour = 8; minute = 5 | |
| 34 | no decision about the minute | hour = 8; minute = 5 | 8:5\n |

## Explanation

`total / 60` gives the whole hours and `total % 60` the minutes left over.

- **545 minutes:** 545 / 60 = 9 and 545 % 60 = 5. `5 < 10` is TRUE, so the THEN path prints `9`, then the text `:0`, then `5`: `9:05`.
- **595 minutes:** 9 hours and 55 minutes. `55 < 10` is FALSE, so the ELSE path prints `9:55`, with no extra 0. Only one path runs, so it is never `9:055`.
- **1205 minutes:** 595 × 2 + 15 = 1205 (`*` before `+`). That is 20 hours and 5 minutes. The decision on lines 30 to 33 has no ELSE: `20 > 12` is TRUE, so `hour` becomes 8. But the last `cout` has **no** leading-zero decision, so it prints `8:5`, not `8:05`.

The decision is what makes a one-digit minute look right. Where the program forgets to make it, the clock shows `8:5`.
