---
slug: debug-fan-readings
type: trace
title: Fan control at fixed temperatures
lesson: loops-with-decisions-and-debugging
difficulty: medium
updated: 2026-10-10
---

## Question

This loop tests the fan decision with three temperatures instead of reading them from a sensor. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    for (int t = 26; t <= 34; t += 4)
    {
        cout << t << ": ";
        if (t > 30)
        {
            cout << "Fan ON" << endl;
        }
        else
        {
            cout << "Fan OFF" << endl;
        }
    }
    cout << "Done" << endl;
    return 0;
}
```

## Answer

```output
26: Fan OFF
30: Fan OFF
34: Fan ON
Done
```

## Hints

- First list the values of `t`: start at 26 and add 4 each time while `t <= 34`.
- The decision is made again in every pass. Is `30 > 30` true?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `t` starts at 26; `26 <= 34` is true | t = 26 | |
| 8 | print `26: `; `26 > 30` is false, so the ELSE path prints Fan OFF | t = 26 | 26: Fan OFF\n |
| 5 | `t += 4`; `30 <= 34` is true | t = 30 | |
| 8 | print `30: `; `30 > 30` is false, so Fan OFF | t = 30 | 30: Fan OFF\n |
| 5 | `t += 4`; `34 <= 34` is true | t = 34 | |
| 8 | print `34: `; `34 > 30` is true, so Fan ON | t = 34 | 34: Fan ON\n |
| 5 | `t += 4`; `38 <= 34` is false, so the loop ends | t = 38 | |
| 17 | print Done after the loop | t = 38 | Done\n |

## Explanation

The `if / else` is **inside** the loop, so the decision is made again for every value of `t`. The loop gives `t` the values 26, 30 and 34; then `t` becomes 38 and `38 <= 34` is false.

- 26: `26 > 30` is false → Fan OFF.
- 30: `30 > 30` is false → Fan OFF. This is the boundary value: `>` does not include 30 itself.
- 34: `34 > 30` is true → Fan ON.

Each line starts with `t` and `": "` from line 7, and the decision finishes the line with `endl`. If the fan should also turn on at exactly 30, the condition must be `t >= 30`.
