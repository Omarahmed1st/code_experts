---
slug: final-m3-exam-fix-one-mark-five-times
type: correct_code
title: One mark judged five times
lesson: exam-results-processor
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A teacher types the marks of **5** students. For each student the program should print `PASS` (50 or more) or `FAIL`, and at the end print how many passed and how many failed.

For the marks `72 45 50 38 90` it should print PASS, FAIL, PASS, FAIL, PASS, then `Passed: 3` and `Failed: 2`. Instead it prints `PASS` five times, then `Passed: 5` and `Failed: 1`.

The program has **two** bugs. Find them and fix the program. Keep the `while` loop and its counter, and don't add new variables.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int counter = 1;
    int passCount = 0;
    int mark;
    cin >> mark;
    while (counter <= 5)
    {
        if (mark >= 50)
        {
            cout << "PASS" << endl;
            passCount = passCount + 1;
        }
        else
        {
            cout << "FAIL" << endl;
        }
        counter = counter + 1;
    }
    cout << "Passed: " << passCount << endl;
    cout << "Failed: " << counter - passCount << endl;
    return 0;
}
```

## Expected behavior

The user types 5 whole-number marks. For each mark, in order, the program prints `PASS` if it is 50 or more, otherwise `FAIL`. Then it prints `Passed: ` and the number of passes, and `Failed: ` and the number of fails.

## Tests

### the lecture's test data

```input
72 45 50 38 90
```

```output
PASS
FAIL
PASS
FAIL
PASS
Passed: 3
Failed: 2
```

### everyone fails

```input
10 20 30 40 49
```

```output
FAIL
FAIL
FAIL
FAIL
FAIL
Passed: 0
Failed: 5
```

### everyone passes

```input
50 60 70 80 90
```

```output
PASS
PASS
PASS
PASS
PASS
Passed: 5
Failed: 0
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int counter = 1;
    int passCount = 0;
    int mark;
    while (counter <= 5)
    {
        cin >> mark;
        if (mark >= 50)
        {
            cout << "PASS" << endl;
            passCount = passCount + 1;
        }
        else
        {
            cout << "FAIL" << endl;
        }
        counter = counter + 1;
    }
    cout << "Passed: " << passCount << endl;
    cout << "Failed: " << 5 - passCount << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int counter = 1;
    int passCount = 0;
    int mark;
    while (counter <= 5)
    {
        cin >> mark;
        if (mark >= 50)
        {
            cout << "PASS" << endl;
            passCount = passCount + 1;
        }
        else
        {
            cout << "FAIL" << endl;
        }
        counter = counter + 1;
    }
    cout << "Passed: " << passCount << endl;
    cout << "Failed: " << counter - 1 - passCount << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int counter = 1;
    int passCount = 0;
    int mark;
    while (counter <= 5)
    {
        cin >> mark;
        if (mark >= 50)
        {
            cout << "PASS" << endl;
            passCount = passCount + 1;
        }
        else
        {
            cout << "FAIL" << endl;
        }
        counter = counter + 1;
    }
    cout << "Passed: " << passCount << endl;
    cout << "Failed: " << (counter - 1) - passCount << endl;
    return 0;
}
```

## Hints

- How many times does `cin >> mark;` run? Where must it be so that each pass gets a new mark?
- After the loop has finished, what is the value of `counter`: 5 or 6?

## Explanation

1. **The mark is read only once.** `cin >> mark;` is **before** the loop, so it runs once and reads 72. The loop then judges the same 72 five times: PASS, PASS, PASS, PASS, PASS. The other four marks are never read. The read must be the first line **inside** the loop body, so every pass reads a new mark and then makes the decision about it: read, process, repeat.
2. **The counter is one too big after the loop.** The loop stops when `counter <= 5` becomes FALSE, which happens when `counter` is **6**. So `counter - passCount` gives one fail too many. There were 5 students, so the number of fails is `5 - passCount` (or `counter - 1 - passCount`).

Fixing only the first bug is not enough: the lecture's marks would then print `Passed: 3` but `Failed: 3`, because 6 − 3 = 3, and 3 + 3 is more than the 5 students.
