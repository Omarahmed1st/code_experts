---
slug: final-m4-flow-trace-friday-parking
type: trace
title: The Friday parking flowchart
lesson: flowcharts
difficulty: medium
reserved: true
updated: 2026-10-10
---

## Question

A garage charges 10 pounds for the first 3 hours and 4 pounds for every extra hour. On Fridays the fee is doubled. Today is Friday and a car stayed 7 hours. Here is the flowchart, shape by shape:

1. Oval: **Start**.
2. Rectangle: `hours ← 7`, `fee ← 10`.
3. Diamond: `hours > 3?`
4. The **YES** exit goes to the rectangle `fee ← fee + (hours - 3) * 4`, then to the parallelogram `Print "Long stay"`, then to the join point.
5. The **NO** exit goes to the parallelogram `Print "Short stay"`, then to the join point.
6. After the join point: rectangle `fee ← fee * 2`.
7. Parallelogram: `Print fee`.
8. Rectangle: `hours ← hours - 3`.
9. Parallelogram: `Print hours * 4`.
10. Oval: **End**.

The same flowchart is written below as pseudocode, one shape per line. Follow the arrows from Start to End. What exactly does it print? Type one line of output per line.

## Code

```pseudocode
BEGIN
    hours ← 7
    fee ← 10
    IF hours > 3 THEN
        fee ← fee + (hours - 3) * 4
        PRINT "Long stay"
    ELSE
        PRINT "Short stay"
    END IF
    fee ← fee * 2
    PRINT fee
    hours ← hours - 3
    PRINT hours * 4
END
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int hours = 7;
    int fee = 10;
    if (hours > 3)
    {
        fee = fee + (hours - 3) * 4;
        cout << "Long stay" << endl;
    }
    else
    {
        cout << "Short stay" << endl;
    }
    fee = fee * 2;
    cout << fee << endl;
    hours = hours - 3;
    cout << hours * 4 << endl;
    return 0;
}
```

## Answer

```output
Long stay
52
16
```

## Hints

- In the YES rectangle, the brackets come first, then `*`, then `+`.
- Shapes 6 to 9 come after the join point, so they run whichever exit the diamond took.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 2 | rectangle | hours = 7 | |
| 3 | rectangle | hours = 7; fee = 10 | |
| 4 | diamond: `7 > 3` is YES | hours = 7; fee = 10 | |
| 5 | 10 + (7 − 3) × 4 = 10 + 16 | hours = 7; fee = 26 | |
| 6 | parallelogram on the YES path | hours = 7; fee = 26 | Long stay\n |
| 10 | after the join: Friday doubles the fee | hours = 7; fee = 52 | |
| 11 | parallelogram | hours = 7; fee = 52 | 52\n |
| 12 | rectangle | hours = 4; fee = 52 | |
| 13 | parallelogram: 4 × 4 | hours = 4; fee = 52 | 16\n |

## Explanation

Follow the arrows one shape at a time.

- The diamond asks `7 > 3?`. The answer is YES, so the arrow goes to the YES path, and the `Print "Short stay"` shape on the NO path never runs.
- The YES rectangle works out the brackets first: 7 − 3 = 4 extra hours, × 4 = 16 pounds, + 10 = 26 pounds.
- Both paths meet at the join point, so the Friday rectangle runs either way: 26 × 2 = 52. Then `Print fee` prints 52.
- `hours ← hours - 3` changes `hours` to 4 (the extra hours), and the last parallelogram prints 4 × 4 = 16: what the extra hours cost before the Friday doubling.

Every shape after the join point belongs to **both** paths. A common mistake is to print 26 and forget the doubling, or to think the shapes after the YES path belong only to it.
