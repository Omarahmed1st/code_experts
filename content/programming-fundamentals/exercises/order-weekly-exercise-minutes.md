---
slug: order-weekly-exercise-minutes
type: correct_code
ask: order
title: Put the weekly exercise program in order
lesson: for-loops
difficulty: medium
updated: 2026-10-10
---

## Question

Youssef writes down how many minutes he exercised on each of the 7 days of a week. The program should ask for each day's minutes, add them up, then print the week's total and the daily average. Move the mixed-up lines into the right order.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int minutes;
    int total = 0;
    // [order]
    for (int day = 1; day <= 7; day++)
    {
        cout << "Day " << day << ": ";
        cin >> minutes;
        total = total + minutes;
    }
    cout << "Week total: " << total << endl;
    cout << "Daily average: " << total / 7.0 << endl;
    // [/order]
    return 0;
}
```

## Expected behavior

For each day from 1 to 7 the program prints `Day 1: `, `Day 2: ` … and reads that day's minutes. After the 7 days it prints `Week total: ` with the sum, then `Daily average: ` with the sum divided by 7 (decimals kept).

## Tests

### a normal week

```input
30 0 45 20 60 15 40
```

```output
Day 1: Day 2: Day 3: Day 4: Day 5: Day 6: Day 7: Week total: 210
Daily average: 30
```

### ten minutes every day

```input
10 10 10 10 10 10 10
```

```output
Day 1: Day 2: Day 3: Day 4: Day 5: Day 6: Day 7: Week total: 70
Daily average: 10
```

### only the first day

```input
5 0 0 0 0 0 0
```

```output
Day 1: Day 2: Day 3: Day 4: Day 5: Day 6: Day 7: Week total: 5
Daily average: 0.714286
```

## Hints

- Inside the loop the pattern is: ask, read, add.
- The total and the average are printed once, after all 7 days, and the total comes first.

## Explanation

Inside the loop the order is **ask, read, add**:

1. `for (int day = 1; day <= 7; day++)` repeats 7 times.
2. `{` opens the body.
3. `cout << "Day " << day << ": ";` asks for that day's minutes.
4. `cin >> minutes;` reads them.
5. `total = total + minutes;` adds them to the running total. This must come **after** the `cin`, otherwise it adds the old value of `minutes`.
6. `}` closes the body.
7. `cout << "Week total: " ...` prints the total once, after the loop.
8. `cout << "Daily average: " ...` prints `total / 7.0`. The `7.0` keeps the decimals, so 5 / 7.0 is 0.714286 and not 0.

If either of the last two lines goes inside the braces, it is printed 7 times. They can't swap with each other either, because the total must be printed first. (Putting the prompt after the `cin` would print the same text in the tests, but the user would have to type before seeing the question, so the prompt always comes first.)
