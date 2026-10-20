---
slug: final-for-which-readings-alarm
type: mcq
title: Which readings set off the alarm?
lesson: loops-with-decisions-and-debugging
difficulty: hard
multiple: true
updated: 2026-10-10
reserved: true
---

## Question

A sensor program reads **5** whole-number temperatures. It counts the hot readings inside the loop, then makes one more decision after the loop. For which typed lines does it print `Alarm`? Pick **all** the correct ones.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int temperature;
    int hot = 0;
    for (int i = 1; i <= 5; i++)
    {
        cin >> temperature;
        if (temperature > 30)
        {
            hot++;
        }
    }
    if (hot >= 3)
    {
        cout << "Alarm" << endl;
    }
    else
    {
        cout << "OK" << endl;
    }
    return 0;
}
```

## Options

- [x] `31 30 32 30 33`
  Right: 31, 32 and 33 are above 30, so `hot` is 3, and `3 >= 3` is TRUE.
- [ ] `30 30 30 31 35`
  Only 31 and 35 count: `30 > 30` is FALSE. `hot` is 2, and `2 >= 3` is FALSE, so it prints OK.
- [x] `35 40 29 31 20`
  Right: 35, 40 and 31 are hot. `hot` is 3, so it prints Alarm.
- [ ] `29 31 30 32 30`
  Only 31 and 32 are above 30. `hot` is 2, so it prints OK.

## Hints

- For each line, count only the readings that are **greater than** 30. Is 30 itself counted?
- The second decision runs once, after the loop, with the final value of `hot`.

## Explanation

The program has two decisions in two different places:

- The `if (temperature > 30)` is **inside** the loop, so it is made for each of the 5 readings. It only adds 1 to the counter `hot`, which starts at 0 before the loop.
- The `if (hot >= 3)` is **after** the loop, so it runs once, with the final count.

The trap is the boundary of the first decision: `>` does not include 30. In `30 30 30 31 35`, three readings look hot, but only two (31 and 35) are greater than 30, so the count is 2 and the program prints OK. The second decision uses `>=`, so a count of exactly 3 does give `Alarm`.
