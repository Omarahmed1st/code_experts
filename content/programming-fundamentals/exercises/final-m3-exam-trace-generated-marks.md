---
slug: final-m3-exam-trace-generated-marks
type: trace
title: Marks made by the counter
lesson: exam-results-processor
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This version of the exam results processor doesn't read the marks. It makes each student's mark from the counter with `(counter * 37) % 100`. It counts the passes and adds up the **failing** marks. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```pseudocode
BEGIN
    counter ← 1
    passCount ← 0
    failTotal ← 0
    WHILE counter <= 5 DO
        mark ← (counter * 37) % 100
        PRINT mark
        IF mark >= 50 THEN
            PRINT "PASS"
            passCount ← passCount + 1
        ELSE
            PRINT "FAIL"
            failTotal ← failTotal + mark
        END IF
        counter ← counter + 1
    END WHILE
    PRINT passCount
    PRINT failTotal
END
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int counter = 1;
    int passCount = 0;
    int failTotal = 0;
    int mark;
    while (counter <= 5)
    {
        mark = (counter * 37) % 100;
        cout << mark << endl;
        if (mark >= 50)
        {
            cout << "PASS" << endl;
            passCount = passCount + 1;
        }
        else
        {
            cout << "FAIL" << endl;
            failTotal = failTotal + mark;
        }
        counter = counter + 1;
    }
    cout << passCount << endl;
    cout << failTotal << endl;
    return 0;
}
```

## Answer

```output
37
FAIL
74
PASS
11
FAIL
48
FAIL
85
PASS
2
96
```

## Hints

- Work out the brackets first: `counter * 37`, then the remainder after dividing by 100. For 111, what is left over?
- `failTotal` only changes on the FAIL path, and `passCount` only on the PASS path.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 6 | counter 1: 37 % 100 = 37 | counter = 1; mark = 37 | 37\n |
| 12 | `37 >= 50` FALSE | passCount = 0; failTotal = 37 | FAIL\n |
| 6 | counter 2: 74 % 100 = 74 | counter = 2; mark = 74 | 74\n |
| 9 | `74 >= 50` TRUE | passCount = 1; failTotal = 37 | PASS\n |
| 6 | counter 3: 111 % 100 = 11 | counter = 3; mark = 11 | 11\n |
| 12 | `11 >= 50` FALSE | passCount = 1; failTotal = 48 | FAIL\n |
| 6 | counter 4: 148 % 100 = 48 | counter = 4; mark = 48 | 48\n |
| 12 | `48 >= 50` FALSE | passCount = 1; failTotal = 96 | FAIL\n |
| 6 | counter 5: 185 % 100 = 85 | counter = 5; mark = 85 | 85\n |
| 9 | `85 >= 50` TRUE | passCount = 2; failTotal = 96 | PASS\n |
| 5 | counter is 6: `6 <= 5` FALSE, the loop ends | counter = 6 | |
| 17 | print passCount | passCount = 2 | 2\n |
| 18 | print failTotal | failTotal = 96 | 96\n |

## Explanation

The counter goes 1 to 5, so the body runs 5 times. In each pass the mark is `(counter * 37) % 100`: the brackets are worked out first, and `% 100` keeps only the last two digits.

| counter | counter × 37 | mark | result |
|---|---|---|---|
| 1 | 37 | 37 | FAIL |
| 2 | 74 | 74 | PASS |
| 3 | 111 | 11 | FAIL |
| 4 | 148 | 48 | FAIL |
| 5 | 185 | 85 | PASS |

The decision is inside the loop, so it is made again for every mark. Two marks pass, so `passCount` is 2. The failing marks are added up on the FAIL path only: 37 + 11 + 48 = 96. A mark of 48 is close, but `48 >= 50` is FALSE.

The two `PRINT` lines after `END WHILE` run once, after all five students: `2`, then `96`.
