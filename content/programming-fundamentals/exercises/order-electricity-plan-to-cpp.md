---
slug: order-electricity-plan-to-cpp
type: correct_code
ask: order
title: Turn the electricity bill plan into C++
lesson: pseudocode-planning-before-code
difficulty: hard
updated: 2026-10-10
---

## Question

Here is the plan for an electricity bill. When a home uses more than 100 units, every unit costs 3 pounds; otherwise every unit costs 2 pounds.

```pseudocode
BEGIN
    INPUT units
    IF units > 100 THEN
        price ← 3
    ELSE
        price ← 2
    END IF
    bill ← units * price
    PRINT bill
END
```

The C++ lines below follow this plan, but they are mixed up. Move them into the right order.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int units, price, bill;
    // [order]
    cin >> units;
    if (units > 100)
    {
        price = 3;
    }
    else
    {
        price = 2;
    }
    bill = units * price;
    cout << "Bill: " << bill << endl;
    // [/order]
    return 0;
}
```

## Expected behavior

The program reads the number of units. It uses a price of 3 pounds per unit when the units are more than 100, and 2 pounds otherwise. It prints `Bill: ` followed by units × price.

## Tests

### 80 units

```input
80
```

```output
Bill: 160
```

### 150 units

```input
150
```

```output
Bill: 450
```

### exactly 100 units

```input
100
```

```output
Bill: 200
```

## Hints

- Go through the plan one line at a time and find the C++ line for each.
- `IF … THEN` becomes `if ( )` followed by a block in `{ }`; `ELSE` becomes `else` followed by its own block.

## Explanation

Each pseudocode line has a C++ partner, in the same order:

| Pseudocode | C++ |
|---|---|
| `INPUT units` | `cin >> units;` |
| `IF units > 100 THEN` | `if (units > 100)` then `{` |
| `price ← 3` | `price = 3;` then `}` |
| `ELSE` | `else` then `{` |
| `price ← 2` | `price = 2;` then `}` |
| `END IF` | (the closing `}` of the else block) |
| `bill ← units * price` | `bill = units * price;` |
| `PRINT bill` | `cout << "Bill: " << bill << endl;` |

The units must be read before the decision, and the bill can only be calculated after the decision has chosen the price. `price = 3;` belongs to the TRUE path and `price = 2;` to the FALSE path: swap them and 150 units would cost 300 instead of 450. No two lines can swap here.

Check the boundary: for exactly 100 units, `100 > 100` is FALSE, so the price is 2 and the bill is 200.
