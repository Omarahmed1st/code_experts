---
slug: trace-for-loop-steps-of-three
type: trace
title: A for loop that jumps by 3
lesson: for-loops
difficulty: medium
updated: 2026-10-09
---

## Question

Trace the program by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int sum = 0;
    for (int i = 1; i <= 7; i += 3)
    {
        sum += i;
        cout << i << " " << sum << endl;
    }
    cout << "Total: " << sum << endl;
    return 0;
}
```

## Answer

```output
1 1
4 5
7 12
Total: 12
```

## Hints

- Write `i` and `sum` in two columns. Which values does `i` take if it starts at 1 and jumps by 3?
- In each pass, `sum` changes **before** the `cout`, so the line shows the new total.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `sum` starts at 0 | sum = 0 | |
| 6 | initialization: `i` starts at 1; `1 <= 7` is true | sum = 0; i = 1 | |
| 8 | `sum += i`: 0 + 1 | sum = 1; i = 1 | |
| 9 | print `i` and `sum` | sum = 1; i = 1 | 1 1\n |
| 6 | update `i += 3`; `4 <= 7` is true | sum = 1; i = 4 | |
| 8 | `sum += i`: 1 + 4 | sum = 5; i = 4 | |
| 9 | print `i` and `sum` | sum = 5; i = 4 | 4 5\n |
| 6 | update `i += 3`; `7 <= 7` is true | sum = 5; i = 7 | |
| 8 | `sum += i`: 5 + 7 | sum = 12; i = 7 | |
| 9 | print `i` and `sum` | sum = 12; i = 7 | 7 12\n |
| 6 | update `i += 3`; `10 <= 7` is false, so the loop ends | sum = 12; i = 10 | |
| 11 | print the total | sum = 12 | Total: 12\n |

## Explanation

The header `for (int i = 1; i <= 7; i += 3)` makes `i` go 1, 4, 7, 10. The body runs for 1, 4 and 7. When `i` becomes 10, `10 <= 7` is false, so 10 is never added or printed.

`sum` is an accumulator: it starts at 0 and collects 1, then 4, then 7, so it goes 1, 5, 12. Each line in the loop shows `i` and the total **after** adding it. Note `7 <= 7` is true, because `<=` includes the end value.
