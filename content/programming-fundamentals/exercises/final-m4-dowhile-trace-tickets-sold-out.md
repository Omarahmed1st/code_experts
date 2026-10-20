---
slug: final-m4-dowhile-trace-tickets-sold-out
type: trace
title: Tickets sold out
lesson: do-while-and-choosing-a-loop
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A cinema has 5 tickets left. Each day it sells one more ticket than the day before. Trace the program by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int tickets = 5;
    int day = 0;
    do
    {
        day++;
        tickets = tickets - day;
        cout << "Day " << day << ": " << tickets << endl;
    } while (tickets > 0);
    cout << "Sold out after " << day << " days" << endl;
    return 0;
}
```

## Answer

```output
Day 1: 4
Day 2: 2
Day 3: -1
Sold out after 3 days
```

## Hints

- In a do-while, the body runs first and the condition is checked at the end of each pass.
- On day 3 the program subtracts 3 from 2. Nothing stops `tickets` going below 0.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | tickets starts at 5 | tickets = 5 | |
| 6 | day starts at 0 | tickets = 5; day = 0 | |
| 9 | day goes up | tickets = 5; day = 1 | |
| 10 | 5 - 1 | tickets = 4; day = 1 | |
| 11 | print | tickets = 4; day = 1 | Day 1: 4\n |
| 12 | 4 > 0 is TRUE: go again | tickets = 4; day = 1 | |
| 9 | day goes up | tickets = 4; day = 2 | |
| 10 | 4 - 2 | tickets = 2; day = 2 | |
| 11 | print | tickets = 2; day = 2 | Day 2: 2\n |
| 12 | 2 > 0 is TRUE: go again | tickets = 2; day = 2 | |
| 9 | day goes up | tickets = 2; day = 3 | |
| 10 | 2 - 3 | tickets = -1; day = 3 | |
| 11 | print | tickets = -1; day = 3 | Day 3: -1\n |
| 12 | -1 > 0 is FALSE: leave the loop | tickets = -1; day = 3 | |
| 13 | print the summary | tickets = -1; day = 3 | Sold out after 3 days\n |

## Explanation

Each pass does three things in order: add 1 to `day`, subtract `day` from `tickets`, then print. Only **after** printing does the do-while check `tickets > 0`.

- Day 1: 5 − 1 = 4. 4 > 0, so the loop runs again.
- Day 2: 4 − 2 = 2. 2 > 0, so it runs again.
- Day 3: 2 − 3 = **−1**. The line is printed with −1, because the check only comes at the end of the pass. Now −1 > 0 is FALSE, so the loop stops.

After the loop, `day` is still 3, so the last line is `Sold out after 3 days`.

The trap is to stop at day 2 because "only 2 tickets are left": the program doesn't know that. It subtracts 3 anyway and prints a negative number. A real program would check before selling, for example with an `if` inside the loop.
