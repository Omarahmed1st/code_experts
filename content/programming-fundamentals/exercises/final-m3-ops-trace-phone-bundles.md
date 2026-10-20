---
slug: final-m3-ops-trace-phone-bundles
type: trace
title: Buying phone bundles with the credit
lesson: operators
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

Youssef has 47 pounds of phone credit. One internet bundle costs 15 pounds, and he buys as many as he can, then recharges 20 pounds and buys again. The program uses `/`, `%`, assignment and comparisons. Trace it by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int credit = 47;
    int price = 15;
    int bundles = credit / price;
    credit = credit - bundles * price;
    cout << bundles << " " << credit << endl;
    credit = credit + 20;
    cout << (credit >= price) << (credit % price == 7) << endl;
    bundles = bundles + credit / price;
    credit = credit % price;
    cout << bundles << " " << credit << endl;
    cout << (credit % 2 == 0) << endl;
    return 0;
}
```

## Answer

```output
3 2
11
4 7
0
```

## Hints

- On line 8, which happens first: the `-` or the `*`?
- On line 11, two comparisons are printed with **nothing** between them. Each one prints as `1` or `0`.
- Every assignment uses the values the variables hold **at that moment**.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 7 | 47 / 15 is 3 (int / int) | credit = 47; price = 15; bundles = 3 | |
| 8 | `3 * 15` first, then 47 − 45 | credit = 2; bundles = 3 | |
| 9 | print bundles and credit | credit = 2; bundles = 3 | 3 2\n |
| 10 | 2 + 20 | credit = 22; bundles = 3 | |
| 11 | `22 >= 15` TRUE; `22 % 15` is 7, so `7 == 7` TRUE | credit = 22; bundles = 3 | 11\n |
| 12 | 22 / 15 is 1, so 3 + 1 | credit = 22; bundles = 4 | |
| 13 | 22 % 15 is 7 | credit = 7; bundles = 4 | |
| 14 | print bundles and credit | credit = 7; bundles = 4 | 4 7\n |
| 15 | `7 % 2` is 1, so `1 == 0` is FALSE | credit = 7; bundles = 4 | 0\n |

## Explanation

- Line 7: `47 / 15` is int / int, so it keeps only the whole part: 3 bundles (3 × 15 = 45).
- Line 8: `*` comes before `-`, so it is 47 − (3 × 15) = 47 − 45 = 2. This is the same as `47 % 15`. The first line is `3 2`.
- Line 10: the right side is worked out with the old value and stored back: `credit` becomes 22.
- Line 11: `22 >= 15` is TRUE and `22 % 15 == 7` is TRUE (22 = 15 + 7). `cout` prints TRUE as `1`, and there is no space between the two values, so the line is `11`, not `1 1`.
- Line 12: `credit / price` is 22 / 15 = 1, so `bundles` becomes 3 + 1 = 4.
- Line 13: the remainder 22 % 15 = 7 is stored in `credit`.
- Line 15: 7 is odd, so `7 % 2` is 1 and `1 == 0` is FALSE, printed as `0`.
