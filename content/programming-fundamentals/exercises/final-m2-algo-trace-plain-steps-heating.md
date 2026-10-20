---
slug: final-m2-algo-trace-plain-steps-heating
type: trace
title: Plain steps that jump back
lesson: algorithms-steps-flowcharts-pseudocode
difficulty: medium
reserved: true
updated: 2026-10-10
---

## Question

A room warms up by 2 degrees every 5 minutes. This algorithm is written as **plain-language steps**, the first of the three ways to write an algorithm. Step 3 jumps **forward** when its answer is TRUE, and step 7 jumps **back**. Follow the steps exactly, one at a time. What does it print? Type one value per line.

## Code

```pseudocode
1. Start.
2. Set T to 25 and minutes to 0.
3. If T > 30 is TRUE, go to step 8.
4. Print T.
5. Add 2 to T.
6. Add 5 to minutes.
7. Go back to step 3.
8. Print minutes.
9. Print T.
10. End.
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int t = 25;
    int minutes = 0;
    while (t <= 30)
    {
        cout << t << endl;
        t = t + 2;
        minutes = minutes + 5;
    }
    cout << minutes << endl;
    cout << t << endl;
    return 0;
}
```

## Answer

```output
25
27
29
15
31
```

## Hints

- Step 3 only jumps when `T > 30` is TRUE. Is `29 > 30` TRUE? Is `30` ever reached?
- Step 4 prints T **before** step 5 changes it.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 2 | set the starting values | T = 25; minutes = 0 | |
| 3 | `25 > 30` is FALSE, so no jump | T = 25; minutes = 0 | |
| 4 | print T | T = 25; minutes = 0 | 25\n |
| 5 | add 2 to T, add 5 to minutes, go back to step 3 | T = 27; minutes = 5 | |
| 3 | `27 > 30` is FALSE | T = 27; minutes = 5 | |
| 4 | print T | T = 27; minutes = 5 | 27\n |
| 5 | add 2 and 5, go back to step 3 | T = 29; minutes = 10 | |
| 3 | `29 > 30` is FALSE | T = 29; minutes = 10 | |
| 4 | print T | T = 29; minutes = 10 | 29\n |
| 5 | add 2 and 5, go back to step 3 | T = 31; minutes = 15 | |
| 3 | `31 > 30` is TRUE, so jump to step 8 | T = 31; minutes = 15 | |
| 8 | print minutes | T = 31; minutes = 15 | 15\n |
| 9 | print T | T = 31; minutes = 15 | 31\n |

## Explanation

Plain-language steps run in order, except where a step says "go to". Step 3 asks a question and jumps to step 8 only when the answer is TRUE; while it is FALSE, the steps 4 to 7 run and step 7 sends the algorithm back to step 3. So steps 3 to 7 repeat.

- T is printed **before** it grows, so the values printed are 25, 27 and 29.
- T goes 25 → 27 → 29 → 31. It jumps over 30, and `29 > 30` is still FALSE, so the steps repeat until T is 31.
- Steps 5 and 6 ran three times, so minutes is 3 × 5 = 15.

Then steps 8 and 9 print `15` and `31`. A common mistake is to print 30 at the end, but T never holds 30: it only ever changes by 2, starting from an odd number.
