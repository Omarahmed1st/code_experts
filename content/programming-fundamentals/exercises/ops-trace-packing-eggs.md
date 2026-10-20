---
slug: ops-trace-packing-eggs
type: trace
title: Packing eggs in boxes of 6
lesson: operators
difficulty: medium
updated: 2026-10-10
---

## Question

A farm packs 47 eggs in boxes of 6. Trace the program by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int eggs = 47;
    int boxes = eggs / 6;
    int left = eggs % 6;
    cout << boxes << " " << left << endl;
    int check = boxes * 6;
    check = check + left;
    cout << check << endl;
    cout << left % 2 << endl;
    return 0;
}
```

## Answer

```output
7 5
47
1
```

## Hints

- How many full groups of 6 fit into 47? How many eggs are left after that?
- `check = check + left` uses the old value of `check` on the right, then stores the result back.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `eggs` starts at 47 | eggs = 47 | |
| 6 | `47 / 6` is 7 (int / int: whole part) | eggs = 47; boxes = 7 | |
| 7 | `47 % 6` is 5 (6 × 7 = 42, 47 − 42 = 5) | eggs = 47; boxes = 7; left = 5 | |
| 8 | print boxes and left | eggs = 47; boxes = 7; left = 5 | 7 5\n |
| 9 | `7 * 6` is 42 | eggs = 47; boxes = 7; left = 5; check = 42 | |
| 10 | `42 + 5` is 47, stored back in `check` | eggs = 47; boxes = 7; left = 5; check = 47 | |
| 11 | print check | eggs = 47; boxes = 7; left = 5; check = 47 | 47\n |
| 12 | `5 % 2` is 1 | eggs = 47; boxes = 7; left = 5; check = 47 | 1\n |

## Explanation

`/` and `%` work as a pair. `47 / 6` is 7 full boxes (both values are `int`, so the decimal part is cut off), and `47 % 6` is the 5 eggs left over, because 6 × 7 = 42 and 47 − 42 = 5.

Lines 9 and 10 check the answer: 7 boxes of 6 is 42 eggs, plus the 5 left over gives back 47. Line 10 reads right to left: the old `check` (42) plus 5 is stored back in `check`.

Finally, `left % 2` is `5 % 2`, which is 1, so the number of eggs left over is odd.
