---
slug: final-m3-loop-pseudo-trace-water-tank
type: trace
title: A water tank that empties by 15 litres
lesson: loops-and-the-while-loop-in-pseudocode
difficulty: medium
reserved: true
updated: 2026-10-10
---

## Question

A roof water tank holds 50 litres, and a family uses 15 litres a day. The algorithm has **two** WHILE loops, one after the other. Trace it by hand, checking each condition before every pass. What exactly does it print? Type one line of output per line.

## Code

```pseudocode
BEGIN
    tank ← 50
    days ← 0
    WHILE tank >= 15 DO
        PRINT tank
        tank ← tank - 15
        days ← days + 1
    END WHILE
    PRINT days
    PRINT tank
    WHILE tank > 5 DO
        PRINT "Use a cup"
        tank ← tank - 1
    END WHILE
    PRINT "Done"
END
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int tank = 50;
    int days = 0;
    while (tank >= 15)
    {
        cout << tank << endl;
        tank = tank - 15;
        days = days + 1;
    }
    cout << days << endl;
    cout << tank << endl;
    while (tank > 5)
    {
        cout << "Use a cup" << endl;
        tank = tank - 1;
    }
    cout << "Done" << endl;
    return 0;
}
```

## Answer

```output
50
35
20
3
5
Done
```

## Hints

- `PRINT tank` comes **before** the subtraction in each pass. Which value is printed first?
- When the first loop stops, what is in `tank`? Is that value greater than 5?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 2 | initialization | tank = 50; days = 0 | |
| 4 | `50 >= 15` TRUE; print, then subtract | tank = 35; days = 1 | 50\n |
| 4 | `35 >= 15` TRUE; print, then subtract | tank = 20; days = 2 | 35\n |
| 4 | `20 >= 15` TRUE; print, then subtract | tank = 5; days = 3 | 20\n |
| 4 | `5 >= 15` FALSE: the first loop ends | tank = 5; days = 3 | |
| 9 | print days | tank = 5; days = 3 | 3\n |
| 10 | print tank | tank = 5; days = 3 | 5\n |
| 11 | `5 > 5` FALSE: the body runs 0 times | tank = 5; days = 3 | |
| 15 | print "Done" | tank = 5; days = 3 | Done\n |

## Explanation

The first loop prints the tank **before** taking 15 litres out, so it prints 50, 35 and 20. After the third pass the tank holds 5, and `5 >= 15` is FALSE, so the loop stops. Its body ran 3 times, so `days` is 3, and its condition was checked 4 times.

The second loop's condition is checked **before** its first pass: `5 > 5` is FALSE, because 5 is not greater than itself. So its body runs **zero** times, and `Use a cup` is never printed. A WHILE loop whose condition is FALSE at the very start is skipped completely, and the algorithm goes straight on to `PRINT "Done"`.
