---
slug: if-price-boundary-pseudocode
type: trace
title: A price on the boundary
lesson: decisions-if-then-else
difficulty: medium
updated: 2026-10-10
---

## Question

Trace this pseudocode by hand. What exactly does it print? Type one value per line.

## Code

```pseudocode
BEGIN
    price ← 120
    IF price >= 100 THEN
        price ← price - 20
    ELSE
        price ← price + 10
    END IF
    PRINT price
    IF price >= 100 THEN
        PRINT "EXPENSIVE"
    ELSE
        PRINT "CHEAP"
    END IF
END
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int price = 120;
    if (price >= 100)
    {
        price = price - 20;
    }
    else
    {
        price = price + 10;
    }
    cout << price << endl;
    if (price >= 100)
    {
        cout << "EXPENSIVE" << endl;
    }
    else
    {
        cout << "CHEAP" << endl;
    }
    return 0;
}
```

## Answer

```output
100
EXPENSIVE
```

## Hints

- Only one path of each IF runs. Which one runs for 120?
- After the first IF, `price` is exactly 100. Is `100 >= 100` TRUE or FALSE?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 2 | store 120 in `price` | price = 120 | |
| 3 | `120 >= 100` is TRUE | price = 120 | |
| 4 | the THEN path: `price ← 120 - 20` | price = 100 | |
| 8 | print `price` | price = 100 | 100\n |
| 9 | `100 >= 100` is TRUE | price = 100 | |
| 10 | the THEN path prints EXPENSIVE | price = 100 | EXPENSIVE\n |

## Explanation

In the first IF, `120 >= 100` is TRUE, so only the THEN path runs: `price` becomes 100. The ELSE path (`price + 10`) is skipped completely.

The second IF tests the **boundary** value. `100 >= 100` is TRUE, because the `=` in `>=` includes 100 itself. So the program prints `EXPENSIVE`, not `CHEAP`. If the condition were `price > 100`, the answer would change to `CHEAP`. This is why you should always test the boundary value of a decision.
