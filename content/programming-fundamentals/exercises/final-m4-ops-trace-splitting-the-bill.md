---
slug: final-m4-ops-trace-splitting-the-bill
type: trace
title: Six friends split a restaurant bill
lesson: operators
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

Six friends share a restaurant bill of 437 pounds. The program splits it with `/` and `%`, checks the split with a comparison, and then works out a share that is **rounded up** so the friends never pay too little. Later the bill changes to 432. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int bill = 437;
    int friends = 6;
    int share = bill / friends;
    int extra = bill % friends;
    cout << share << " " << extra << endl;
    cout << (share * friends + extra == bill) << endl;
    int roundedUp = (bill + friends - 1) / friends;
    cout << roundedUp << " " << roundedUp * friends - bill << endl;
    bill = 432;
    cout << (bill + friends - 1) / friends << " " << bill % friends << endl;
    return 0;
}
```

## Answer

```output
72 5
1
73 1
72 0
```

## Hints

- 6 × 72 = 432. How much of 437 is left over?
- On line 10, the comparison `==` is done last, after `share * friends + extra` has been worked out. On line 11, the brackets come first, then the int / int division.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 7 | `437 / 6` is int / int | bill = 437; friends = 6; share = 72 | |
| 8 | 437 − 432 left over | share = 72; extra = 5 | |
| 9 | print share and extra | share = 72; extra = 5 | 72 5\n |
| 10 | `72 * 6 + 5` is 437, `437 == 437` is TRUE | share = 72; extra = 5 | 1\n |
| 11 | `(437 + 6 - 1) / 6` is `442 / 6` | roundedUp = 73 | |
| 12 | `73 * 6 - 437` is 438 − 437 | roundedUp = 73 | 73 1\n |
| 13 | the bill changes | bill = 432 | |
| 14 | `437 / 6` is 72, and `432 % 6` is 0 | bill = 432 | 72 0\n |

## Explanation

`/` and `%` go together: `437 / 6` is the whole number of times 6 fits (72), and `437 % 6` is what is left over (437 − 432 = 5).

- **Line 10** checks the split. `*` comes before `+`, and the comparison comes last: 72 × 6 + 5 = 437, and `437 == 437` is TRUE, printed as `1`. This check is TRUE for any bill: whole part × divisor + remainder always gives the number back.
- **Line 11** is a trick for rounding **up**. Adding `friends - 1` (5) before dividing pushes any bill with a remainder past the next multiple of 6: `442 / 6` is 73 (73.67 with the decimals cut off). Paying 73 each, the friends pay 73 × 6 = 438, which is 1 pound more than the bill. That is the `1` on line 12.
- **Line 14:** for 432 the same trick gives `437 / 6` = 72 (72.83 cut off). 432 divides exactly by 6 (the remainder is 0), so no rounding up is needed, and the trick correctly keeps 72.

So `(bill + friends - 1) / friends` adds one extra pound per person only when there is a remainder, and never when the bill divides exactly.
