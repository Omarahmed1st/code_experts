---
slug: final-m2-exam-fix-inside-the-loop
type: correct_code
title: Two lines in the wrong place
lesson: exam-results-processor
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This is the exam results processor in C++. For each of 5 students it reads a mark and prints `PASS` (50 or more) or `FAIL`. At the end it should print how many passed and how many failed, **once**.

Two lines are in the wrong place: one of them should not be inside the loop at all, and the other should come **after** the loop. Fix the program by deleting one line and moving one line. Don't change anything else.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    int counter = 1;
    int passCount = 0;
    int failCount = 0;
    while (counter <= 5)
    {
        passCount = 0;
        cin >> mark;
        if (mark >= 50)
        {
            cout << "PASS" << endl;
            passCount++;
        }
        else
        {
            cout << "FAIL" << endl;
            failCount++;
        }
        counter++;
        cout << "Passed: " << passCount << endl;
    }
    cout << "Failed: " << failCount << endl;
    return 0;
}
```

## Expected behavior

The user types 5 whole-number marks. For each mark the program prints `PASS` or `FAIL`. After the fifth mark it prints `Passed: ` and the number of passes, then `Failed: ` and the number of fails. For `55 40 90 30 20` it prints PASS, FAIL, PASS, FAIL, FAIL, then `Passed: 2` and `Failed: 3`.

## Tests

### the last student fails

```input
55 40 90 30 20
```

```output
PASS
FAIL
PASS
FAIL
FAIL
Passed: 2
Failed: 3
```

### the last student passes

```input
45 30 80 20 50
```

```output
FAIL
FAIL
PASS
FAIL
PASS
Passed: 2
Failed: 3
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    int counter = 1;
    int passCount = 0;
    int failCount = 0;
    while (counter <= 5)
    {
        cin >> mark;
        if (mark >= 50)
        {
            cout << "PASS" << endl;
            passCount++;
        }
        else
        {
            cout << "FAIL" << endl;
            failCount++;
        }
        counter++;
    }
    cout << "Passed: " << passCount << endl;
    cout << "Failed: " << failCount << endl;
    return 0;
}
```

## Hints

- How many times does line 11 run? What does it do to the passes counted in the earlier passes?
- How many times should `Passed: ` be printed? Is line 23 inside or outside the `{ }` of the loop?

## Explanation

Every line of a loop program belongs in one of three places: **before** the loop (runs once), **inside** it (runs every pass), or **after** it (runs once, at the end).

1. **`passCount = 0;` is inside the loop.** A counter gets its starting value **once, before** the loop; that is already done on line 7. Inside the loop, the line wipes out the count at the start of every pass, so at the end `passCount` only shows whether the **last** student passed (1 or 0). Delete it.
2. **The `Passed:` line is inside the loop.** It runs in every pass, so it is printed 5 times with half-finished counts. The total is only known after the last mark, so the line must move **after** the loop, before the `Failed:` line.

`failCount` was right all along: it starts at 0 before the loop and is only increased inside it. Compare it with `passCount` to see the pattern for every counter.
