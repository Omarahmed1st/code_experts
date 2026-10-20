---
slug: final-m4-algo-trace-average-not-whole
type: trace
title: An average that is not a whole number
lesson: algorithms-steps-flowcharts-pseudocode
difficulty: medium
reserved: true
updated: 2026-10-10
---

## Question

Mona, Omar and Nour got 15, 8 and 23 marks in a quiz. This algorithm joins the lecture's two worked examples: it works out the average of the three marks, then makes two decisions with it. In pseudocode, `/` is ordinary division, so the average can have a decimal part. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```pseudocode
BEGIN
    N1 ← 15
    N2 ← 8
    N3 ← 23
    SUM ← N1 + N2 + N3
    AVERAGE ← SUM / 3
    IF N1 >= AVERAGE THEN
        PRINT "Mona: at least the average"
    ELSE
        PRINT "Mona: below the average"
    END IF
    IF N3 - AVERAGE > 7 THEN
        PRINT "Nour: far above the average"
    ELSE
        PRINT "Nour: close to the average"
    END IF
    PRINT SUM
END
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    float n1 = 15;
    float n2 = 8;
    float n3 = 23;
    float sum = n1 + n2 + n3;
    float average = sum / 3;
    if (n1 >= average)
    {
        cout << "Mona: at least the average" << endl;
    }
    else
    {
        cout << "Mona: below the average" << endl;
    }
    if (n3 - average > 7)
    {
        cout << "Nour: far above the average" << endl;
    }
    else
    {
        cout << "Nour: close to the average" << endl;
    }
    cout << sum << endl;
    return 0;
}
```

## Answer

```output
Mona: below the average
Nour: far above the average
46
```

## Hints

- 46 / 3 is not exactly 15. Is it a little more or a little less than 15?
- `>=` includes the boundary, but is 15 really **on** the boundary here?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | 15 + 8 + 23 | SUM = 46 | |
| 6 | 46 / 3 | SUM = 46; AVERAGE = 15.33 | |
| 7 | `15 >= 15.33` is FALSE | AVERAGE = 15.33 | |
| 10 | the ELSE path | AVERAGE = 15.33 | Mona: below the average\n |
| 12 | `23 - 15.33` is 7.67, and `7.67 > 7` is TRUE | AVERAGE = 15.33 | |
| 13 | the THEN path | AVERAGE = 15.33 | Nour: far above the average\n |
| 17 | print SUM | SUM = 46 | 46\n |

## Explanation

The sum is 15 + 8 + 23 = 46, and the average is 46 / 3 = 15.33… (15 and one third). It is **not** a whole number.

- **First decision:** is 15 at least 15.33? No: 15 is a little **less** than the average, so `15 >= 15.33` is FALSE and the ELSE path prints `Mona: below the average`. If you rounded the average down to 15, you would wrongly get TRUE, because `15 >= 15` includes the boundary.
- **Second decision:** 23 − 15.33 = 7.67, which is more than 7, so the THEN path prints `Nour: far above the average`.
- Only one path of each decision runs. Then `PRINT SUM` prints 46.

When a value is compared with a boundary, work out the value **exactly** first. A decimal part that looks small can decide which path runs.
