---
slug: ops-compare-after-update
type: mcq
title: Comparing after a change
lesson: operators
difficulty: medium
updated: 2026-10-10
---

## Question

What does this program print?

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int x = 7;
    x = x + 2;
    cout << (x != 7) << " " << (x >= 10) << " " << (x == 9) << endl;
    return 0;
}
```

## Options

- [x] `1 0 1`
  Right: `x` is 9. 9 is not 7 (TRUE), 9 is not at least 10 (FALSE), and 9 equals 9 (TRUE).
- [ ] `0 0 0`
  These are the answers for `x` = 7. But line 6 changed `x`: it is 9 when the comparisons run.
- [ ] `true false true`
  The TRUE/FALSE pattern is right, but `cout` prints TRUE as `1` and FALSE as `0`.
- [ ] `1 1 1`
  `9 >= 10` is FALSE: 9 is less than 10, and `>=` means "greater than or equal to".

## Answer

```output
1 0 1
```

## Hints

- First find the value of `x` after line 6. Read `x = x + 2` from right to left.
- Answer each comparison with TRUE or FALSE. How does `cout` print TRUE and FALSE?

## Explanation

Line 6 reads from right to left: take the old value of `x` (7), add 2, and store 9 back in `x`.

Then each comparison is a question with a TRUE or FALSE answer:

- `x != 7`: is 9 not equal to 7? TRUE, printed as `1`.
- `x >= 10`: is 9 greater than or equal to 10? FALSE, printed as `0`.
- `x == 9`: is 9 equal to 9? TRUE, printed as `1`.

The brackets around each comparison are needed inside `cout`.
