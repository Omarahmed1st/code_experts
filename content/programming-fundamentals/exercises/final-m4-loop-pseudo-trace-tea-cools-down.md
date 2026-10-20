---
slug: final-m4-loop-pseudo-trace-tea-cools-down
type: trace
title: A cup of tea cools down
lesson: loops-and-the-while-loop-in-pseudocode
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A cup of tea at 89 °C stands in a room at 25 °C. Every 5 minutes it loses **half of the difference** between its temperature and the room's. Omar waits until the tea is 30 °C or cooler. Trace this WHILE loop by hand, checking the condition before every pass. What exactly does it print? Type one value per line.

## Code

```pseudocode
BEGIN
    tea ← 89
    minutes ← 0
    WHILE tea > 30 DO
        PRINT tea
        tea ← tea - (tea - 25) / 2
        minutes ← minutes + 5
    END WHILE
    PRINT minutes
    PRINT tea
END
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    float tea = 89;
    int minutes = 0;
    while (tea > 30)
    {
        cout << tea << endl;
        tea = tea - (tea - 25) / 2;
        minutes = minutes + 5;
    }
    cout << minutes << endl;
    cout << tea << endl;
    return 0;
}
```

## Answer

```output
89
57
41
33
20
29
```

## Hints

- In the update, the brackets come first: the difference `tea - 25`, then half of it, then subtract that from `tea`.
- `PRINT tea` comes **before** the update in each pass. The temperature that stops the loop is printed only once, after `END WHILE`.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 2 | initialization | tea = 89; minutes = 0 | |
| 4 | `89 > 30` TRUE | tea = 89; minutes = 0 | |
| 5 | print, then 89 − 64 / 2 | tea = 57; minutes = 5 | 89\n |
| 4 | `57 > 30` TRUE | tea = 57; minutes = 5 | |
| 5 | print, then 57 − 32 / 2 | tea = 41; minutes = 10 | 57\n |
| 4 | `41 > 30` TRUE | tea = 41; minutes = 10 | |
| 5 | print, then 41 − 16 / 2 | tea = 33; minutes = 15 | 41\n |
| 4 | `33 > 30` TRUE | tea = 33; minutes = 15 | |
| 5 | print, then 33 − 8 / 2 | tea = 29; minutes = 20 | 33\n |
| 4 | `29 > 30` FALSE, the loop ends | tea = 29; minutes = 20 | |
| 9 | print minutes | minutes = 20 | 20\n |
| 10 | print tea | tea = 29 | 29\n |

## Explanation

The loop has the three parts from the lecture: the **initialization** `tea ← 89` (and `minutes ← 0`), the **condition** `tea > 30`, checked before every pass, and the **update** that cools the tea.

In each pass the update works out the brackets first: the difference from the room, `tea - 25`, then half of it, and takes that off. So the difference halves each time: 64, 32, 16, 8, and the tea goes 89 → 57 → 41 → 33 → 29.

- The body runs 4 times, so 89, 57, 41 and 33 are printed and `minutes` grows to 20.
- The condition is checked 5 times. The fifth check, `29 > 30`, is FALSE and stops the loop. 29 is never printed **inside** the loop, because the update comes after `PRINT tea`. It is printed once, by the last line.

The update moves `tea` toward the stopping condition in every pass, which is what lets this loop end.
