---
slug: order-tank-level-while
type: correct_code
ask: order
title: Put the water tank loop in order
lesson: while-loops-in-cpp
difficulty: easy
updated: 2026-10-10
---

## Question

A pump adds 30 litres of water to an empty 120-litre tank every minute. The program should print the amount of water after each minute, then print a message when the tank is full. Move the mixed-up lines into the right order.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int litres = 0;
    // [order]
    while (litres < 120)
    {
        litres = litres + 30;
        cout << litres << " litres" << endl;
    }
    cout << "The tank is full" << endl;
    // [/order]
    return 0;
}
```

## Expected behavior

The program prints the water level after each minute (30, 60, 90 and 120 litres), each on its own line, and then `The tank is full`.

## Tests

### fill the tank

```output
30 litres
60 litres
90 litres
120 litres
The tank is full
```

## Hints

- The first number printed is 30, not 0. Should the pump add water before or after the level is printed?
- The message about the full tank appears only once.

## Explanation

The order that matches the expected output:

1. `while (litres < 120)`: keep going while the tank is not full.
2. `{` opens the body.
3. `litres = litres + 30;` adds the water **first**.
4. `cout << litres << " litres" << endl;` then prints the new level.
5. `}` closes the body.
6. `cout << "The tank is full" << endl;` runs once, after the loop.

| Pass | litres before | Check | litres after | Printed |
|---|---|---|---|---|
| 1 | 0 | 0 < 120 TRUE | 30 | 30 litres |
| 2 | 30 | 30 < 120 TRUE | 60 | 60 litres |
| 3 | 60 | 60 < 120 TRUE | 90 | 90 litres |
| 4 | 90 | 90 < 120 TRUE | 120 | 120 litres |
| (check) | 120 | 120 < 120 FALSE | | |

If you print before adding, the output starts at `0 litres` and stops at `90 litres`. If the "full" message goes inside the braces, it is printed four times. No two lines can swap here.
