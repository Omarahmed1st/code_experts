---
slug: flow-trace-pass-with-bonus
type: trace
title: A bonus and a decision
lesson: flowcharts
difficulty: medium
updated: 2026-10-10
---

## Question

This flowchart adds a bonus to a mark and then has a **diamond**, `mark >= 50?`, with a YES exit and a NO exit. Its shapes are written below as pseudocode, one shape per step. Follow the arrows from Start to End. What exactly does it print? Type one line of output per line.

## Code

```pseudocode
BEGIN
    mark ← 45
    bonus ← 5
    mark ← mark + bonus
    IF mark >= 50 THEN
        PRINT "Pass"
    ELSE
        PRINT "Fail"
    END IF
    PRINT mark
END
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int mark = 45;
    int bonus = 5;
    mark = mark + bonus;
    if (mark >= 50)
    {
        cout << "Pass" << endl;
    }
    else
    {
        cout << "Fail" << endl;
    }
    cout << mark << endl;
    return 0;
}
```

## Answer

```output
Pass
50
```

## Hints

- Work out `mark` **before** you reach the diamond. Which value does the diamond check?
- `>=` means "greater than or equal to". Is 50 at least 50?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 2 | `mark ← 45` | mark = 45 | |
| 3 | `bonus ← 5` | mark = 45; bonus = 5 | |
| 4 | `mark ← 45 + 5` | mark = 50; bonus = 5 | |
| 5 | diamond: `50 >= 50` is TRUE, so take the YES exit | mark = 50; bonus = 5 | |
| 6 | print Pass | mark = 50; bonus = 5 | Pass\n |
| 9 | the two paths join again | mark = 50; bonus = 5 | |
| 10 | print mark | mark = 50; bonus = 5 | 50\n |

## Explanation

The rectangle `mark ← mark + bonus` runs before the diamond, so the diamond checks the **new** mark: 45 + 5 = 50.

`50 >= 50` is TRUE, because `>=` includes the value 50 itself. So the YES path runs and prints `Pass`; the NO path (`Fail`) is skipped. Only one of the two paths ever runs.

After the decision the two paths join again, so `PRINT mark` runs either way and prints 50.
