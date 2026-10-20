---
slug: final-m3-var-trace-print-is-not-store
type: trace
title: Printing a sum doesn't store it
lesson: variables-named-boxes-in-memory
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

Some lines of this program **print** a calculation, and some **store** one with `=`. Only one kind of line changes what is inside a box. Trace the program by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int credit = 10;
    int bonus = 3;
    cout << credit + bonus << endl;
    cout << credit << " " << bonus << endl;
    bonus = credit;
    credit = credit + bonus;
    cout << credit - bonus << endl;
    cout << credit << " " << bonus << endl;
    bonus = bonus + bonus;
    credit = bonus - credit;
    cout << credit << bonus << endl;
    return 0;
}
```

## Answer

```output
13
10 3
10
20 10
020
```

## Hints

- `cout << credit + bonus` works out 13 and shows it. Does it put 13 into any box?
- Each `=` line is worked out right to left, with the values the boxes hold at that moment.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | create `credit` | credit = 10 | |
| 6 | create `bonus` | credit = 10; bonus = 3 | |
| 7 | print 10 + 3; nothing is stored | credit = 10; bonus = 3 | 13\n |
| 8 | the boxes still hold 10 and 3 | credit = 10; bonus = 3 | 10 3\n |
| 9 | copy 10 into `bonus` | credit = 10; bonus = 10 | |
| 10 | 10 + 10, stored in `credit` | credit = 20; bonus = 10 | |
| 11 | print 20 − 10; nothing is stored | credit = 20; bonus = 10 | 10\n |
| 12 | print both boxes | credit = 20; bonus = 10 | 20 10\n |
| 13 | 10 + 10, stored in `bonus` | credit = 20; bonus = 20 | |
| 14 | 20 − 20, stored in `credit` | credit = 0; bonus = 20 | |
| 15 | 0, then 20, with nothing between | credit = 0; bonus = 20 | 020\n |

## Explanation

Only an assignment with `=` changes what is inside a box. A `cout` line can **calculate** something and print the answer, but the answer is not stored anywhere.

- Line 7 prints 13, but `credit` is still 10 and `bonus` is still 3, as line 8 shows.
- Line 9 copies 10 into `bonus` (the 3 is gone). Line 10 works out 10 + 10 = 20 and stores it in `credit`.
- Line 11 prints 20 − 10 = 10 without changing anything, so line 12 prints `20 10`.
- Line 13: `bonus` becomes 10 + 10 = 20. Line 14 uses the **new** `bonus`: 20 − 20 = 0, stored in `credit`.
- Line 15 prints 0 and then 20 with no space between them, so the last line is `020`.
