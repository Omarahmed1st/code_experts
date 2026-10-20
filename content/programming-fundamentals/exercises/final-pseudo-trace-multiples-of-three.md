---
slug: final-pseudo-trace-multiples-of-three
type: trace
title: Odd steps, multiples of 3
lesson: loops-and-the-while-loop-in-pseudocode
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This pseudocode has a WHILE loop with a decision inside it. Trace it by hand. What exactly does it print? Type one value per line.

## Code

```pseudocode
BEGIN
    n ← 1
    total ← 0
    count ← 0
    WHILE n <= 12 DO
        IF n % 3 == 0 THEN
            total ← total + n
        ELSE
            count ← count + 1
        END IF
        n ← n + 2
    END WHILE
    PRINT total
    PRINT count
    PRINT n
END
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int n = 1;
    int total = 0;
    int count = 0;
    while (n <= 12)
    {
        if (n % 3 == 0)
        {
            total = total + n;
        }
        else
        {
            count = count + 1;
        }
        n = n + 2;
    }
    cout << total << endl;
    cout << count << endl;
    cout << n << endl;
    return 0;
}
```

## Answer

```output
12
4
13
```

## Hints

- First list every value `n` takes: it starts at 1 and goes up by 2. Which is the first value that makes `n <= 12` FALSE?
- For each value, ask one question: is `n % 3 == 0`? Only one of the two paths runs each time.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 2 | initialization | n = 1; total = 0; count = 0 | |
| 5 | `1 <= 12` TRUE; `1 % 3` is 1, so ELSE | n = 1; total = 0; count = 1 | |
| 11 | `n ← 1 + 2` | n = 3; total = 0; count = 1 | |
| 5 | `3 <= 12` TRUE; `3 % 3` is 0, so THEN | n = 3; total = 3; count = 1 | |
| 11 | `n ← 3 + 2` | n = 5; total = 3; count = 1 | |
| 5 | `5 <= 12` TRUE; `5 % 3` is 2, so ELSE | n = 5; total = 3; count = 2 | |
| 11 | `n ← 5 + 2` | n = 7; total = 3; count = 2 | |
| 5 | `7 <= 12` TRUE; `7 % 3` is 1, so ELSE | n = 7; total = 3; count = 3 | |
| 11 | `n ← 7 + 2` | n = 9; total = 3; count = 3 | |
| 5 | `9 <= 12` TRUE; `9 % 3` is 0, so THEN | n = 9; total = 12; count = 3 | |
| 11 | `n ← 9 + 2` | n = 11; total = 12; count = 3 | |
| 5 | `11 <= 12` TRUE; `11 % 3` is 2, so ELSE | n = 11; total = 12; count = 4 | |
| 11 | `n ← 11 + 2` | n = 13; total = 12; count = 4 | |
| 5 | `13 <= 12` FALSE, so the loop ends | n = 13; total = 12; count = 4 | |
| 13 | print total | n = 13; total = 12; count = 4 | 12\n |
| 14 | print count | n = 13; total = 12; count = 4 | 4\n |
| 15 | print n | n = 13; total = 12; count = 4 | 13\n |

## Explanation

`n` starts at 1 and the update adds 2, so `n` takes the values 1, 3, 5, 7, 9, 11. At 13 the condition `13 <= 12` is FALSE and the loop stops. So the body runs 6 times.

The decision is **inside** the loop, so it is made again for every value of `n`. Only 3 and 9 leave no remainder when divided by 3, so the THEN path adds them to `total`: 3 + 9 = 12. The other four values (1, 5, 7, 11) take the ELSE path, so `count` ends at 4.

The three `PRINT` lines are **after** `END WHILE`, so they run once. The last one prints 13, not 11: the loop only stops after `n` has already moved past 12.
