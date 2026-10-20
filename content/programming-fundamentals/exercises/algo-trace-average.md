---
slug: algo-trace-average
type: trace
title: Tracing the average of three numbers
lesson: algorithms-steps-flowcharts-pseudocode
difficulty: easy
updated: 2026-10-10
---

## Question

Trace this pseudocode by hand. What exactly does it print? Type one value per line.

## Code

```pseudocode
BEGIN
    N1 ← 7
    N2 ← 9
    N3 ← 14
    SUM ← N1 + N2 + N3
    PRINT SUM
    AVERAGE ← SUM / 3
    PRINT AVERAGE
END
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    float n1 = 7;
    float n2 = 9;
    float n3 = 14;
    float sum = n1 + n2 + n3;
    cout << sum << endl;
    float average = sum / 3;
    cout << average << endl;
    return 0;
}
```

## Answer

```output
30
10
```

## Hints

- `←` means "store the value on the right in the name on the left".
- Work out SUM first. AVERAGE uses SUM.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 2 | `N1 ← 7` | N1 = 7 | |
| 3 | `N2 ← 9` | N1 = 7; N2 = 9 | |
| 4 | `N3 ← 14` | N1 = 7; N2 = 9; N3 = 14 | |
| 5 | `SUM ← 7 + 9 + 14` | N1 = 7; N2 = 9; N3 = 14; SUM = 30 | |
| 6 | print SUM | SUM = 30 | 30\n |
| 7 | `AVERAGE ← 30 / 3` | SUM = 30; AVERAGE = 10 | |
| 8 | print AVERAGE | SUM = 30; AVERAGE = 10 | 10\n |

## Explanation

The steps run from top to bottom, in order. The arrow `←` stores the value on the right in the name on the left. So SUM gets 7 + 9 + 14 = 30, and line 6 prints 30.

Line 7 then divides SUM by 3 and stores 10 in AVERAGE, and line 8 prints 10. Because SUM was worked out on its own line first, the whole sum is divided by 3, not just N3.
