---
slug: final-exam-trace-mark-goes-up-and-down
type: trace
title: A mark that moves each pass
lesson: exam-results-processor
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This version of the exam results processor doesn't read marks. Instead, each decision **changes the mark** used in the next pass. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```pseudocode
BEGIN
    counter ← 1
    mark ← 40
    passCount ← 0
    WHILE counter <= 5 DO
        IF mark >= 50 THEN
            PRINT "PASS"
            passCount ← passCount + 1
            mark ← mark - 8
        ELSE
            PRINT "FAIL"
            mark ← mark + 6
        END IF
        counter ← counter + 1
    END WHILE
    PRINT passCount
    PRINT mark
END
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int counter = 1;
    int mark = 40;
    int passCount = 0;
    while (counter <= 5)
    {
        if (mark >= 50)
        {
            cout << "PASS" << endl;
            passCount = passCount + 1;
            mark = mark - 8;
        }
        else
        {
            cout << "FAIL" << endl;
            mark = mark + 6;
        }
        counter = counter + 1;
    }
    cout << passCount << endl;
    cout << mark << endl;
    return 0;
}
```

## Answer

```output
FAIL
FAIL
PASS
FAIL
PASS
2
42
```

## Hints

- Keep three columns: `counter`, `mark` and `passCount`. The decision in each pass uses the mark left by the pass before.
- Watch the boundary: is a mark of exactly 50 a pass?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 2 | initialization | counter = 1; mark = 40; passCount = 0 | |
| 6 | pass 1: `40 >= 50` FALSE, so FAIL and `mark ← 40 + 6` | counter = 1; mark = 46; passCount = 0 | FAIL\n |
| 14 | `counter ← 2` | counter = 2; mark = 46; passCount = 0 | |
| 6 | pass 2: `46 >= 50` FALSE, so FAIL and `mark ← 46 + 6` | counter = 2; mark = 52; passCount = 0 | FAIL\n |
| 14 | `counter ← 3` | counter = 3; mark = 52; passCount = 0 | |
| 6 | pass 3: `52 >= 50` TRUE, so PASS, count it, `mark ← 52 - 8` | counter = 3; mark = 44; passCount = 1 | PASS\n |
| 14 | `counter ← 4` | counter = 4; mark = 44; passCount = 1 | |
| 6 | pass 4: `44 >= 50` FALSE, so FAIL and `mark ← 44 + 6` | counter = 4; mark = 50; passCount = 1 | FAIL\n |
| 14 | `counter ← 5` | counter = 5; mark = 50; passCount = 1 | |
| 6 | pass 5: `50 >= 50` TRUE, so PASS, count it, `mark ← 50 - 8` | counter = 5; mark = 42; passCount = 2 | PASS\n |
| 14 | `counter ← 6` | counter = 6; mark = 42; passCount = 2 | |
| 5 | `6 <= 5` FALSE, the loop ends | counter = 6; mark = 42; passCount = 2 | |
| 16 | print passCount | passCount = 2 | 2\n |
| 17 | print mark | mark = 42 | 42\n |

## Explanation

The loop runs 5 times (counter 1 to 5), and the `IF … ELSE` inside it is decided again in every pass, using the **current** value of `mark`. Because each path changes `mark`, the result of one pass decides the mark of the next: 40 → 46 → 52 → 44 → 50 → 42.

Pass 5 is the boundary case: the mark is exactly 50, and `50 >= 50` is TRUE, so it is a PASS. That gives two passes in total (passes 3 and 5).

`passCount` starts at 0 before the loop and only goes up on the PASS path. The two `PRINT` lines are after `END WHILE`, so they run once, at the end, and show the final values: 2 and 42.
