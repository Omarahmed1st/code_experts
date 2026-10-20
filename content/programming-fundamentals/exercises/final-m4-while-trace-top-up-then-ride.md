---
slug: final-m4-while-trace-top-up-then-ride
type: trace
title: Top up the card, then ride
lesson: while-loops-in-cpp
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A metro card has 5 pounds on it. The first loop adds 7 pounds at a time until the card holds at least 30 pounds, printing the balance after each top-up. The second loop then takes 8-pound trips while the balance can pay for one. Watch where the update sits in each loop. Trace the program by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int balance = 5;
    int trips = 0;
    while (balance < 30)
    {
        balance += 7;
        cout << balance << endl;
    }
    while (balance >= 8)
    {
        balance -= 8;
        trips++;
    }
    cout << trips << " " << balance << endl;
    return 0;
}
```

## Answer

```output
12
19
26
33
4 1
```

## Hints

- In the first loop, `balance += 7;` comes **before** the `cout`. So the value printed in a pass is the value **after** that pass's top-up.
- The second loop starts with whatever balance the first loop left behind. Check `balance >= 8` before every trip.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | initialization | balance = 5; trips = 0 | |
| 7 | `5 < 30` TRUE | balance = 5 | |
| 9 | top up, then print | balance = 12 | 12\n |
| 7 | `12 < 30` TRUE | balance = 12 | |
| 9 | top up, then print | balance = 19 | 19\n |
| 7 | `19 < 30` TRUE | balance = 19 | |
| 9 | top up, then print | balance = 26 | 26\n |
| 7 | `26 < 30` TRUE | balance = 26 | |
| 9 | top up, then print | balance = 33 | 33\n |
| 7 | `33 < 30` FALSE, the first loop ends | balance = 33 | |
| 12 | `33 >= 8` TRUE: one trip | balance = 25; trips = 1 | |
| 12 | `25 >= 8` TRUE: one trip | balance = 17; trips = 2 | |
| 12 | `17 >= 8` TRUE: one trip | balance = 9; trips = 3 | |
| 12 | `9 >= 8` TRUE: one trip | balance = 1; trips = 4 | |
| 12 | `1 >= 8` FALSE, the second loop ends | balance = 1; trips = 4 | |
| 17 | print trips and balance | balance = 1; trips = 4 | 4 1\n |

## Explanation

**The first loop** checks `balance < 30` before every pass. Inside, the update `balance += 7` comes **first** and the `cout` second, so each pass prints the new balance: 12, 19, 26, 33. When the balance is 26 the condition is still TRUE, so one more top-up happens and 33 is printed, even though 33 is above 30. The loop only notices at the next check, `33 < 30`, which is FALSE.

**The second loop** uses `balance -= 8`, which moves the balance down toward the stopping condition. 33 → 25 → 17 → 9 → 1: four trips. The check `9 >= 8` is TRUE (9 pounds can pay for an 8-pound trip), and `1 >= 8` is FALSE, so 1 pound is left on the card.

The last line prints `4 1`. Compare the two loops: in the first the update comes before the print, so the last printed value has already passed the limit of 30. The order of the lines inside a loop body matters.
