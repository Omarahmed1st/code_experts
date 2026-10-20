---
slug: final-ops-trace-piastres-to-pounds
type: trace
title: Piastres into pounds and coins
lesson: operators
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

One Egyptian pound is 100 piastres. This program changes 1785 piastres into pounds, then counts 25-piastre coins. Watch the **type** of every value in each division. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int piastres = 1785;
    int pounds = piastres / 100;
    int rest = piastres % 100;
    cout << pounds << " " << rest << endl;
    float exact = piastres / 100;
    cout << exact << endl;
    exact = piastres / 100.0;
    cout << exact << endl;
    int coins = rest / 25;
    rest = rest % 25;
    cout << coins << " " << rest << endl;
    return 0;
}
```

## Answer

```output
17 85
17
17.85
3 10
```

## Hints

- `int / int` keeps only the whole part, even when the result is stored in a `float`. The division happens first; the storing happens after.
- `rest` changes on line 14. Which value of `rest` does line 13 use?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 6 | `1785 / 100`: int / int, whole part only | piastres = 1785; pounds = 17 | |
| 7 | `1785 % 100`: the remainder | pounds = 17; rest = 85 | |
| 8 | print pounds and rest | pounds = 17; rest = 85 | 17 85\n |
| 9 | `1785 / 100` is still int / int, so 17 is stored | exact = 17 | |
| 10 | print exact | exact = 17 | 17\n |
| 11 | `1785 / 100.0`: one value has a decimal point | exact = 17.85 | |
| 12 | print exact | exact = 17.85 | 17.85\n |
| 13 | `85 / 25` | coins = 3; rest = 85 | |
| 14 | `85 % 25` | coins = 3; rest = 10 | |
| 15 | print coins and rest | coins = 3; rest = 10 | 3 10\n |

## Explanation

`/` and `%` work as a pair. `1785 / 100` is 17 (how many full pounds) and `1785 % 100` is 85 (the piastres left over).

Line 9 is the trap. `exact` is a `float`, but the right side is worked out **first**, and `1785 / 100` divides two `int` values, so the result is already 17 before it is stored. The decimal part is lost, and `cout` prints `17`. On line 11 the value `100.0` has a decimal point, so the division keeps the decimals and `exact` becomes 17.85.

Finally, 85 piastres hold three 25-piastre coins (3 × 25 = 75), and 85 − 75 = 10 piastres are left. Line 13 uses the old `rest` (85); line 14 then replaces it with 10.
