---
slug: final-b-types-cost-into-int
type: trace
title: A cost squeezed into an int
lesson: data-types
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

Some of these boxes are `int` and some are `double`. Remember what happens when a decimal value is stored in an `int` box, and how `cout` prints a comparison. Trace the program by hand. What exactly does it print? Type one value per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int a = 9.99;
    double price = 12.5;
    int qty = 3;
    double cost = price * qty;
    int paid = cost;
    cout << a << endl;
    cout << cost << endl;
    cout << paid << endl;
    cout << (paid == cost) << endl;
    cout << cost - paid << endl;
    return 0;
}
```

## Answer

```output
9
37.5
37
0
0.5
```

## Hints

- An `int` box keeps only the whole part. Does C++ round 9.99 up to 10, or cut off the decimal part?
- `price` is a `double`, so `price * qty` keeps its decimal part. Which box later loses it?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | 9.99 goes into an `int`: the .99 is cut off | a = 9 | |
| 6 | `price` is a `double` | a = 9; price = 12.5 | |
| 7 | `qty` is an `int` | price = 12.5; qty = 3 | |
| 8 | `12.5 * 3` is 37.5 and a `double` keeps it | price = 12.5; qty = 3; cost = 37.5 | |
| 9 | 37.5 goes into an `int`: the .5 is cut off | cost = 37.5; paid = 37 | |
| 10 | print a | a = 9 | 9\n |
| 11 | print cost | cost = 37.5 | 37.5\n |
| 12 | print paid | paid = 37 | 37\n |
| 13 | `37 == 37.5` is FALSE, printed as 0 | cost = 37.5; paid = 37 | 0\n |
| 14 | `37.5 - 37` | cost = 37.5; paid = 37 | 0.5\n |

## Explanation

An `int` box can only hold whole numbers. When a decimal value is stored in it, C++ simply **drops** the decimal part. It does not round: 9.99 becomes 9, not 10.

`cost` is a `double`, so `12.5 * 3 = 37.5` is kept whole. Then `int paid = cost;` copies that value into an `int` box, and the .5 is lost: `paid` is 37, while `cost` is still 37.5.

The comparison `paid == cost` asks "is 37 equal to 37.5?". The answer is FALSE, and `cout` prints FALSE as `0`. The last line, `cost - paid`, shows exactly how much was lost: `0.5`. This is why money with decimals belongs in a `float` or `double`, never in an `int`.
