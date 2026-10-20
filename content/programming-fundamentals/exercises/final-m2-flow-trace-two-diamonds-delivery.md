---
slug: final-m2-flow-trace-two-diamonds-delivery
type: trace
title: Two diamonds and a delivery fee
lesson: flowcharts
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

An online shop's flowchart is written below shape by shape, from top to bottom. The shape is in square brackets. Each diamond has a YES exit and a NO exit, and after each diamond the two paths **join again** before the next shape. Follow the arrows from Start to End. What exactly does it print? Type one line of output per line.

## Code

```pseudocode
[oval]           Start
[rectangle]      total ← 120 * 4
[diamond]        total >= 500 ?
    YES exit →   [parallelogram]  Print "Free delivery"
    NO exit  →   [rectangle]      total ← total + 30
                 [parallelogram]  Print "Delivery: 30"
                 (the two paths join here)
[diamond]        total > 500 ?
    YES exit →   [parallelogram]  Print "Gift"
    NO exit  →   (no shape: the arrow goes straight on)
                 (the two paths join here)
[parallelogram]  Print total
[oval]           End
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int total = 120 * 4;
    if (total >= 500)
    {
        cout << "Free delivery" << endl;
    }
    else
    {
        total = total + 30;
        cout << "Delivery: 30" << endl;
    }
    if (total > 500)
    {
        cout << "Gift" << endl;
    }
    cout << total << endl;
    return 0;
}
```

## Answer

```output
Delivery: 30
Gift
510
```

## Hints

- Work out the first rectangle before the first diamond. Is 480 at least 500?
- The second diamond checks `total` **after** the first decision, so use the value it has at that moment.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 2 | rectangle: `120 * 4` | total = 480 | |
| 3 | diamond: `480 >= 500` is FALSE, take the NO exit | total = 480 | |
| 5 | rectangle: `480 + 30` | total = 510 | |
| 6 | parallelogram: print the fee | total = 510 | Delivery: 30\n |
| 8 | diamond: `510 > 500` is TRUE, take the YES exit | total = 510 | |
| 9 | parallelogram: print Gift | total = 510 | Gift\n |
| 12 | parallelogram: print total | total = 510 | 510\n |

## Explanation

Follow the arrows one shape at a time, and keep track of `total`.

1. The first rectangle stores 120 × 4 = 480.
2. The first diamond asks `480 >= 500`. That is FALSE, so the **NO** exit is taken: `Free delivery` is never printed. On the NO path, the rectangle adds the fee (480 + 30 = 510) and the parallelogram prints `Delivery: 30`.
3. The paths join, and the second diamond asks `510 > 500`. The fee pushed the total over 500, so the answer is TRUE and `Gift` is printed.
4. The last parallelogram prints the total, 510.

The trap is to decide both diamonds with 480. Each diamond checks the value **at the moment the arrow reaches it**, and the shapes on the NO path of the first diamond changed `total` before the second question was asked.
