---
slug: mcq-division-and-remainder
type: mcq
title: Sharing 29 sweets between 6 children
lesson: operators
difficulty: easy
updated: 2026-10-09
---

## Question

29 sweets are shared equally between 6 children. The program prints how many sweets each child gets, then how many are left over. What does it print?

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int sweets = 29;
    int children = 6;
    cout << sweets / children << " " << sweets % children << endl;
    return 0;
}
```

## Options

- [x] `4 5`
  Right: 6 × 4 = 24, so each child gets 4, and 29 − 24 = 5 sweets are left over.
- [ ] `4.83333 5`
  Both values are `int`, so `/` keeps only the whole part. There is no decimal part here.
- [ ] `5 4`
  The order is swapped. `/` gives the whole part (4) and `%` gives the remainder (5).
- [ ] `4 1`
  `%` is not "the decimal part". It is what is left over after taking out 4 groups of 6: 29 − 24 = 5.

## Answer

```output
4 5
```

## Hints

- How many times does 6 fit into 29 completely?
- After taking out those groups of 6, how many are left?

## Explanation

When both numbers are `int`, `/` does whole-number division: `29 / 6` is `4`, and the decimal part is cut off. The `%` operator gives the **remainder**: 6 × 4 = 24, and 29 − 24 = 5, so `29 % 6` is `5`.

`/` and `%` work as a pair: one tells you how many full groups there are, the other tells you what is left over.
