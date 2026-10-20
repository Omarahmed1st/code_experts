---
slug: final-m2-acc-trace-yearly-interest
type: trace
title: Interest in whole pounds
lesson: counters-accumulators-and-input-loops
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

Omar puts 100 pounds in a savings box. Every year he adds a tenth of what is in it, in **whole pounds only** (everything is `int`). The loop runs until he has at least 150 pounds. `money` grows from its own value, and `totalGain` adds up every year's gain. Trace the program by hand. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int money = 100;
    int years = 0;
    int gain;
    int totalGain = 0;
    while (money < 150)
    {
        gain = money / 10;
        money += gain;
        totalGain += gain;
        years++;
        cout << years << ": " << money << endl;
    }
    cout << "Gain: " << totalGain << endl;
    return 0;
}
```

## Answer

```output
1: 110
2: 121
3: 133
4: 146
5: 160
Gain: 60
```

## Hints

- Each year the gain is worked out from the **current** money. `121 / 10` is int / int: what is its whole part?
- Is `146 < 150` TRUE? Then one more year runs.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | initialization | money = 100; years = 0; totalGain = 0 | |
| 9 | `100 < 150` TRUE; gain = 100 / 10 | gain = 10; money = 110; totalGain = 10; years = 1 | |
| 15 | print year 1 | money = 110 | 1: 110\n |
| 9 | `110 < 150` TRUE; gain = 110 / 10 | gain = 11; money = 121; totalGain = 21; years = 2 | |
| 15 | print year 2 | money = 121 | 2: 121\n |
| 9 | `121 < 150` TRUE; gain = 121 / 10 | gain = 12; money = 133; totalGain = 33; years = 3 | |
| 15 | print year 3 | money = 133 | 3: 133\n |
| 9 | `133 < 150` TRUE; gain = 133 / 10 | gain = 13; money = 146; totalGain = 46; years = 4 | |
| 15 | print year 4 | money = 146 | 4: 146\n |
| 9 | `146 < 150` TRUE; gain = 146 / 10 | gain = 14; money = 160; totalGain = 60; years = 5 | |
| 15 | print year 5 | money = 160 | 5: 160\n |
| 9 | `160 < 150` FALSE, the loop ends | money = 160; totalGain = 60 | |
| 17 | print the total gain | totalGain = 60 | Gain: 60\n |

## Explanation

There are two accumulators here, and both start before the loop: `money` (starting at 100) and `totalGain` (starting at 0). In every pass, the gain is worked out from the money **at that moment**, so the gain grows as the money grows: 10, 11, 12, 13, 14.

Because everything is `int`, `money / 10` keeps only the whole part. A real tenth of 121 is 12.1, of 133 it is 13.3, of 146 it is 14.6, but the program adds 12, 13 and 14. The piastres are lost every year.

| year | gain | money after | totalGain |
|---|---|---|---|
| 1 | 10 | 110 | 10 |
| 2 | 11 | 121 | 21 |
| 3 | 12 | 133 | 33 |
| 4 | 13 | 146 | 46 |
| 5 | 14 | 160 | 60 |

After year 4, 146 is still less than 150, so a fifth year runs and takes the money to 160. Then `160 < 150` is FALSE. `totalGain` is 60, which matches 160 − 100: every pound of gain went into the box.
