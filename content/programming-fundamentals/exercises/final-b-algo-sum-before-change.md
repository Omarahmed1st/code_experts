---
slug: final-b-algo-sum-before-change
type: trace
title: The sum was stored before N3 changed
lesson: algorithms-steps-flowcharts-pseudocode
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This algorithm joins the two worked examples of the lecture: an average, then a decision. Watch line 6 carefully. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```pseudocode
BEGIN
    N1 ← 12
    N2 ← 7
    N3 ← 8
    SUM ← N1 + N2 + N3
    N3 ← 20
    AVERAGE ← SUM / 3
    IF AVERAGE > 9 THEN
        PRINT "Above 9"
    ELSE
        PRINT "Not above 9"
    END IF
    PRINT SUM
    PRINT N1 + N2 + N3
END
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    float n1 = 12;
    float n2 = 7;
    float n3 = 8;
    float sum = n1 + n2 + n3;
    n3 = 20;
    float average = sum / 3;
    if (average > 9)
    {
        cout << "Above 9" << endl;
    }
    else
    {
        cout << "Not above 9" << endl;
    }
    cout << sum << endl;
    cout << n1 + n2 + n3 << endl;
    return 0;
}
```

## Answer

```output
Not above 9
27
39
```

## Hints

- `SUM ← N1 + N2 + N3` stores a number in `SUM` once. Does `SUM` change by itself when `N3` changes later?
- `AVERAGE` is exactly 9. Is `9 > 9` TRUE or FALSE?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 2 | `N1 ← 12` | N1 = 12 | |
| 3 | `N2 ← 7` | N1 = 12; N2 = 7 | |
| 4 | `N3 ← 8` | N1 = 12; N2 = 7; N3 = 8 | |
| 5 | `SUM ← 12 + 7 + 8` | N1 = 12; N2 = 7; N3 = 8; SUM = 27 | |
| 6 | `N3 ← 20`; SUM keeps 27 | N1 = 12; N2 = 7; N3 = 20; SUM = 27 | |
| 7 | `AVERAGE ← 27 / 3` | N3 = 20; SUM = 27; AVERAGE = 9 | |
| 8 | `9 > 9` is FALSE, so the ELSE path runs | AVERAGE = 9 | |
| 11 | print "Not above 9" | AVERAGE = 9 | Not above 9\n |
| 13 | print SUM | SUM = 27 | 27\n |
| 14 | print 12 + 7 + 20 | N1 = 12; N2 = 7; N3 = 20 | 39\n |

## Explanation

An algorithm runs one step at a time, in order. On line 5, `SUM` gets the value `12 + 7 + 8 = 27`. It stores the **number** 27, not the formula. When `N3` becomes 20 on line 6, `SUM` does not change: it is still 27.

So `AVERAGE ← SUM / 3` gives `27 / 3 = 9`. The decision asks `9 > 9`, which is FALSE, because "greater than" does not include 9 itself. Only the ELSE path runs, and it prints `Not above 9`.

Then `PRINT SUM` prints the stored 27, while `PRINT N1 + N2 + N3` adds the **current** values, `12 + 7 + 20 = 39`. The same formula gives a different result because one variable changed in between.
