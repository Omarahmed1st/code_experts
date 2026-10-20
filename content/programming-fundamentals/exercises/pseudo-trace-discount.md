---
slug: pseudo-trace-discount
type: trace
title: A discount decision
lesson: pseudocode-planning-before-code
difficulty: hard
updated: 2026-10-10
---

## Question

A shop gives 50 pounds off when the total is more than 300 pounds. Trace this pseudocode by hand. What exactly does it print? Type one line of output per line.

## Code

```pseudocode
BEGIN
    price ← 120
    qty ← 3
    total ← price * qty
    IF total > 300 THEN
        PRINT "Discount"
        final ← total - 50
    ELSE
        PRINT "No discount"
        final ← total
    END IF
    PRINT total
    PRINT final
END
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    float price = 120;
    float qty = 3;
    float total = price * qty;
    float final_price;
    if (total > 300)
    {
        cout << "Discount" << endl;
        final_price = total - 50;
    }
    else
    {
        cout << "No discount" << endl;
        final_price = total;
    }
    cout << total << endl;
    cout << final_price << endl;
    return 0;
}
```

## Answer

```output
Discount
360
310
```

## Hints

- Work out `total` first. Is it more than 300?
- The THEN path changes `final`, not `total`. Which value does each `PRINT` show?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 2 | `price ← 120` | price = 120 | |
| 3 | `qty ← 3` | price = 120; qty = 3 | |
| 4 | `total ← 120 * 3` | price = 120; qty = 3; total = 360 | |
| 5 | `360 > 300` is TRUE, so the THEN path runs | total = 360 | |
| 6 | print Discount | total = 360 | Discount\n |
| 7 | `final ← 360 - 50` | total = 360; final = 310 | |
| 11 | `END IF`: the ELSE path was skipped | total = 360; final = 310 | |
| 12 | print total | total = 360; final = 310 | 360\n |
| 13 | print final | total = 360; final = 310 | 310\n |

## Explanation

`total` is 120 × 3 = 360. The condition `360 > 300` is TRUE, so only the THEN path runs: it prints `Discount` and stores 360 − 50 = 310 in `final`. The ELSE path, with `No discount`, is skipped completely.

The discount is stored in a **different** name, `final`. The value of `total` does not change, so `PRINT total` still shows 360, and `PRINT final` shows 310. The two `PRINT` lines come after `END IF`, so they run whichever path was taken.
