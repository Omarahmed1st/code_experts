---
slug: blanks-step-goal-days
type: correct_code
ask: blanks
title: Fill in the blanks to count step-goal days
lesson: loops-with-decisions-and-debugging
difficulty: medium
updated: 2026-10-10
---

## Question

Hoda's goal is to walk **at least** 10000 steps a day. The program reads her steps for 5 days, says for each day whether she reached the goal, and at the end prints on how many days she did. Fill in the **three blanks**: a starting value, a comparison operator, and a whole statement that counts one more goal day.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int steps;
    int goalDays = ___;
    for (int day = 1; day <= 5; day++)
    {
        cin >> steps;
        if (steps ___ 10000)
        {
            cout << "Day " << day << ": goal reached" << endl;
            ___;
        }
        else
        {
            cout << "Day " << day << ": not yet" << endl;
        }
    }
    cout << "Goal days: " << goalDays << endl;
    return 0;
}
```

## Expected behavior

The user types 5 step counts. For each day the program prints `Day 1: goal reached` (10000 steps or more) or `Day 1: not yet`, with the right day number. At the end it prints `Goal days: ` followed by how many days reached the goal.

## Tests

### a mixed week

```input
12000 8000 10000 9999 15000
```

```output
Day 1: goal reached
Day 2: not yet
Day 3: goal reached
Day 4: not yet
Day 5: goal reached
Goal days: 3
```

### a lazy week

```input
500 2000 3000 0 7000
```

```output
Day 1: not yet
Day 2: not yet
Day 3: not yet
Day 4: not yet
Day 5: not yet
Goal days: 0
```

### every day on target

```input
10000 10001 20000 10000 11000
```

```output
Day 1: goal reached
Day 2: goal reached
Day 3: goal reached
Day 4: goal reached
Day 5: goal reached
Goal days: 5
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int steps;
    int goalDays = 0;
    for (int day = 1; day <= 5; day++)
    {
        cin >> steps;
        if (steps >= 10000)
        {
            cout << "Day " << day << ": goal reached" << endl;
            goalDays++;
        }
        else
        {
            cout << "Day " << day << ": not yet" << endl;
        }
    }
    cout << "Goal days: " << goalDays << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int steps;
    int goalDays = 0;
    for (int day = 1; day <= 5; day++)
    {
        cin >> steps;
        if (steps >= 10000)
        {
            cout << "Day " << day << ": goal reached" << endl;
            goalDays += 1;
        }
        else
        {
            cout << "Day " << day << ": not yet" << endl;
        }
    }
    cout << "Goal days: " << goalDays << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int steps;
    int goalDays = 0;
    for (int day = 1; day <= 5; day++)
    {
        cin >> steps;
        if (steps >= 10000)
        {
            cout << "Day " << day << ": goal reached" << endl;
            goalDays = goalDays + 1;
        }
        else
        {
            cout << "Day " << day << ": not yet" << endl;
        }
    }
    cout << "Goal days: " << goalDays << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int steps;
    int goalDays = 0;
    for (int day = 1; day <= 5; day++)
    {
        cin >> steps;
        if (steps >= 10000)
        {
            cout << "Day " << day << ": goal reached" << endl;
            goalDays = 1 + goalDays;
        }
        else
        {
            cout << "Day " << day << ": not yet" << endl;
        }
    }
    cout << "Goal days: " << goalDays << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int steps;
    int goalDays = 0;
    for (int day = 1; day <= 5; day++)
    {
        cin >> steps;
        if (steps >= 10000)
        {
            cout << "Day " << day << ": goal reached" << endl;
            ++goalDays;
        }
        else
        {
            cout << "Day " << day << ": not yet" << endl;
        }
    }
    cout << "Goal days: " << goalDays << endl;
    return 0;
}
```

## Hints

- A counter starts at a value that means "nothing counted yet".
- "At least 10000" includes 10000 itself.
- The counter goes up by 1 only on the TRUE path.

## Explanation

1. `goalDays = 0`: a counter starts at 0, because no goal days have been counted yet.
2. `steps >= 10000`: "at least 10000" includes exactly 10000. With `>`, day 3 of the first test (10000 steps) would wrongly say `not yet`.
3. `goalDays++`: one more goal day. `goalDays += 1` and `goalDays = goalDays + 1` do the same job and are accepted too.

The decision is inside the loop, so it is made again for every day's steps, and the counter only grows on the TRUE path. Trace of the first test:

| day | steps | steps >= 10000? | goalDays after |
|---|---|---|---|
| 1 | 12000 | TRUE | 1 |
| 2 | 8000 | FALSE | 1 |
| 3 | 10000 | TRUE | 2 |
| 4 | 9999 | FALSE | 2 |
| 5 | 15000 | TRUE | 3 |
