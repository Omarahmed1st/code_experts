---
slug: flow-trace-area-and-perimeter
type: trace
title: Area and perimeter from a flowchart
lesson: flowcharts
difficulty: easy
updated: 2026-10-10
---

## Question

A flowchart for a rectangle has one shape per line below: `BEGIN` and `END` are the ovals, each `←` line is a rectangle, and each `PRINT` line is a parallelogram. Follow the arrows from Start to End. What exactly does it print? Type one value per line.

## Code

```pseudocode
BEGIN
    length ← 8
    width ← 5
    area ← length * width
    perimeter ← length + width
    perimeter ← perimeter * 2
    PRINT area
    PRINT perimeter
END
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int length = 8;
    int width = 5;
    int area = length * width;
    int perimeter = length + width;
    perimeter = perimeter * 2;
    cout << area << endl;
    cout << perimeter << endl;
    return 0;
}
```

## Answer

```output
40
26
```

## Hints

- Keep a box for each variable and update it after every rectangle.
- `perimeter ← perimeter * 2` uses the value `perimeter` has just before this line.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 2 | `length ← 8` | length = 8 | |
| 3 | `width ← 5` | length = 8; width = 5 | |
| 4 | `area ← 8 * 5` | length = 8; width = 5; area = 40 | |
| 5 | `perimeter ← 8 + 5` | length = 8; width = 5; area = 40; perimeter = 13 | |
| 6 | `perimeter ← 13 * 2` | length = 8; width = 5; area = 40; perimeter = 26 | |
| 7 | print area | length = 8; width = 5; area = 40; perimeter = 26 | 40\n |
| 8 | print perimeter | length = 8; width = 5; area = 40; perimeter = 26 | 26\n |

## Explanation

This is a straight-line flowchart: no diamond, so every shape runs once, from top to bottom, in the order of the arrows.

The area is 8 × 5 = 40. The perimeter is worked out in two rectangles: first `length + width` gives 13, then `perimeter ← perimeter * 2` takes that 13, doubles it, and stores 26 back in `perimeter`. The two parallelograms at the end print 40 and then 26.
