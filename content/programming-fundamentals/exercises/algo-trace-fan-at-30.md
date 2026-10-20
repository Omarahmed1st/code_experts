---
slug: algo-trace-fan-at-30
type: trace
title: The fan when T is exactly 30
lesson: algorithms-steps-flowcharts-pseudocode
difficulty: medium
updated: 2026-10-10
---

## Question

The sensor reads exactly 30 °C. Trace this pseudocode by hand. What exactly does it print? Type one line of output per line.

## Code

```pseudocode
BEGIN
    T ← 30
    IF T > 30 THEN
        PRINT "Fan ON"
    ELSE
        PRINT "Fan OFF"
    END IF
    PRINT "Done"
END
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    float t = 30;
    if (t > 30)
        cout << "Fan ON" << endl;
    else
        cout << "Fan OFF" << endl;
    cout << "Done" << endl;
    return 0;
}
```

## Answer

```output
Fan OFF
Done
```

## Hints

- Is 30 greater than 30?
- Only one of the two paths runs. What happens after `END IF`?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 2 | `T ← 30` | T = 30 | |
| 3 | `30 > 30` is FALSE, so the ELSE path runs | T = 30 | |
| 6 | print Fan OFF | T = 30 | Fan OFF\n |
| 7 | `END IF`: the decision is over | T = 30 | |
| 8 | print Done | T = 30 | Done\n |

## Explanation

`>` means "greater than", and 30 is **not** greater than 30, so the condition `T > 30` is FALSE. The ELSE path runs and prints `Fan OFF`. The THEN path is skipped completely: a decision creates two paths, and only one of them runs.

After `END IF`, both paths meet again, so `PRINT "Done"` runs every time, whatever the temperature. The fan would only turn on for a temperature above 30, such as 31.
