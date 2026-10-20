---
slug: io-pens-calculations
type: trace
title: Printing calculations about pens
lesson: input-and-output-with-cout-and-cin
difficulty: hard
updated: 2026-10-10
---

## Question

Each line of this program prints a label and a calculation. Watch the types of the values. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int pens = 7;
    double price = 2.5;
    cout << "Pens: " << pens << endl;
    cout << "Cost: " << pens * price << endl;
    cout << "Pairs: " << pens / 2 << endl;
    cout << "Left: " << pens % 2 << endl;
    cout << "Half: " << pens / 2.0 << endl;
    return 0;
}
```

## Answer

```output
Pens: 7
Cost: 17.5
Pairs: 3
Left: 1
Half: 3.5
```

## Hints

- The text in quotes is printed as written. A calculation without quotes is worked out first, then its value is printed.
- `pens / 2` divides two `int` values. `pens / 2.0` divides by a decimal number. Do they give the same result?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `pens` starts at 7 | pens = 7 | |
| 6 | `price` starts at 2.5 | pens = 7; price = 2.5 | |
| 7 | print the label and the value of `pens` | pens = 7; price = 2.5 | Pens: 7\n |
| 8 | `7 * 2.5` is 17.5 (a `double` keeps the decimal) | pens = 7; price = 2.5 | Cost: 17.5\n |
| 9 | `7 / 2` is int / int, so the .5 is dropped | pens = 7; price = 2.5 | Pairs: 3\n |
| 10 | `7 % 2` is the remainder: 1 | pens = 7; price = 2.5 | Left: 1\n |
| 11 | `7 / 2.0` uses a decimal number, so it keeps .5 | pens = 7; price = 2.5 | Half: 3.5\n |

## Explanation

`cout` prints each piece in order, joined by `<<`. Text in quotes is printed exactly as written; a calculation is worked out first.

- `pens * price` is `7 * 2.5`. Because `price` is a `double`, the result keeps its decimal part: `17.5`.
- `pens / 2` is `7 / 2` with **two `int` values**, so the result is the whole part only: `3`. This is the classic integer-division surprise.
- `pens % 2` is the remainder of that division: 7 pens make 3 pairs with `1` pen left.
- `pens / 2.0` divides by a decimal number, so the result keeps the `.5`: `3.5`.

None of these lines changes `pens` or `price`. Printing a calculation does not store anything.
