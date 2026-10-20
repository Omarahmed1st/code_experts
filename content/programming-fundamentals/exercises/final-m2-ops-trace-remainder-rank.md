---
slug: final-m2-ops-trace-remainder-rank
type: trace
title: Where % fits in the order
lesson: operators
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

`%` has the **same rank as `*` and `/`**: it is done before `+` and `-`, and when `*`, `/` and `%` meet, they go from left to right. Brackets still come first. A clock shows 22:00; what time is it 5 hours later? Trace the program by hand. What exactly does it print? Type one value per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int hour = 22;
    int wait = 5;
    cout << hour + wait % 24 << endl;
    cout << (hour + wait) % 24 << endl;
    int minutes = 135;
    cout << minutes / 60 % 2 << endl;
    cout << minutes % 60 / 10 << endl;
    cout << 100 - minutes % 100 * 2 << endl;
    return 0;
}
```

## Answer

```output
27
3
0
1
30
```

## Hints

- On line 7, which runs first: `hour + wait` or `wait % 24`?
- On lines 10 and 11, `/` and `%` have the same rank, so go from left to right. On line 12, `-` comes last.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `hour` starts at 22 | hour = 22 | |
| 6 | `wait` starts at 5 | hour = 22; wait = 5 | |
| 7 | `5 % 24` is 5 first, then `22 + 5` | hour = 22; wait = 5 | 27\n |
| 8 | brackets first: `27 % 24` | hour = 22; wait = 5 | 3\n |
| 9 | `minutes` starts at 135 | minutes = 135 | |
| 10 | left to right: `135 / 60` is 2, then `2 % 2` | minutes = 135 | 0\n |
| 11 | left to right: `135 % 60` is 15, then `15 / 10` | minutes = 135 | 1\n |
| 12 | `135 % 100` is 35, `35 * 2` is 70, then `100 - 70` | minutes = 135 | 30\n |

## Explanation

`%` belongs to the same family as `*` and `/`, so it runs **before** `+` and `-`.

- **Line 7:** without brackets, only `wait` is divided: `5 % 24` is 5 (5 is smaller than 24, so all of it is left over), and then `22 + 5 = 27`. A clock never shows 27.
- **Line 8:** the brackets make the addition happen first: `27 % 24 = 3`. Five hours after 22:00 it is 3:00. This is the line the programmer wanted.
- **Line 10:** `/` and `%` have the same rank, so they go left to right: `135 / 60` is 2 (int / int), and `2 % 2` is 0.
- **Line 11:** again left to right: `135 % 60` is 15, and `15 / 10` is 1.
- **Line 12:** `%` and `*` first, from left to right: `135 % 100` is 35, `35 * 2` is 70. The subtraction comes last: `100 - 70 = 30`.
