---
slug: final-io-trace-receipt-lines
type: trace
title: Printing a small receipt
lesson: input-and-output-with-cout-and-cin
difficulty: medium
reserved: true
updated: 2026-10-10
---

## Question

This program prints a small receipt. Some `cout` statements end with `endl` and some don't, and one `endl` is in the middle of a chain. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int items = 3;
    double price = 12.5;
    cout << "Items: " << items;
    cout << " x " << price << endl;
    cout << "Total: " << items * price << endl << "Pairs: " << items / 2;
    cout << " Left: " << items % 2 << endl;
    cout << items / 2.0 << endl;
    cout << (items * price > 37) << endl;
    return 0;
}
```

## Answer

```output
Items: 3 x 12.5
Total: 37.5
Pairs: 1 Left: 1
1.5
1
```

## Hints

- A new line starts only where there is an `endl`. Follow the `endl`s, not the `cout`s.
- `items * price` is int × double. `items / 2` is int / int. `items / 2.0` is int / double.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 7 | print `Items: 3`, no `endl`, so the line goes on | items = 3; price = 12.5 | |
| 8 | the same line continues with ` x 12.5`, then `endl` | items = 3; price = 12.5 | Items: 3 x 12.5\n |
| 9 | 3 × 12.5 = 37.5, then `endl`, then `Pairs: ` and 3 / 2 = 1, no `endl` at the end | items = 3; price = 12.5 | Total: 37.5\n |
| 10 | ` Left: ` and 3 % 2 = 1 finish the `Pairs: 1` line | items = 3; price = 12.5 | Pairs: 1 Left: 1\n |
| 11 | 3 / 2.0 keeps the decimals | items = 3; price = 12.5 | 1.5\n |
| 12 | `37.5 > 37` is TRUE, printed as 1 | items = 3; price = 12.5 | 1\n |

## Explanation

`cout` never starts a new line by itself. Only `endl` does, wherever it appears in a chain. So line 7 and line 8 print one line together, and the `endl` in the **middle** of line 9 splits it: `Total: 37.5` ends there, and `Pairs: 1` starts the next line, which line 10 then finishes.

The calculations depend on the types: `3 * 12.5` uses a `double`, so it is 37.5. `3 / 2` divides two `int` values, so it is 1, and `3 % 2` is the remainder, 1. `3 / 2.0` has a decimal value in it, so it is 1.5.

The last line prints a comparison. `37.5 > 37` is TRUE, and `cout` shows TRUE as `1`.
