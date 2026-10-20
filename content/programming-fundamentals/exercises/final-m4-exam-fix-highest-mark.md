---
slug: final-m4-exam-fix-highest-mark
type: correct_code
title: Fix the processor's highest mark
lesson: exam-results-processor
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This exam results processor reads the marks of **5** students (each from 0 to 100). For each one it prints `PASS` (50 or more) or `FAIL`. At the end it prints how many passed and the **highest** mark. For the lecture's test data `72 45 50 38 90` it should print PASS, FAIL, PASS, FAIL, PASS, then `Passed: 3` and `Highest: 90`. Instead it prints `FAIL` five times, then `Passed: 0` and `Highest: 100`.

The program has **two** bugs. Find them and fix the program. Keep the `while` loop and the check `if (mark > highest)` as they are.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int counter = 1;
    int passCount = 0;
    int highest = 100;
    int mark;
    while (counter <= 5)
    {
        cin >> mark;
        if (counter >= 50)
        {
            cout << "PASS" << endl;
            passCount = passCount + 1;
        }
        else
        {
            cout << "FAIL" << endl;
        }
        if (mark > highest)
        {
            highest = mark;
        }
        counter = counter + 1;
    }
    cout << "Passed: " << passCount << endl;
    cout << "Highest: " << highest << endl;
    return 0;
}
```

## Expected behavior

The user types 5 whole-number marks from 0 to 100. After each mark the program prints `PASS` if the mark is 50 or more, otherwise `FAIL`. After the loop it prints `Passed: ` and the number of passes, then `Highest: ` and the biggest mark that was typed.

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
Highest: 90
```

### a class where nobody passed

```input
30 20 10 40 25
```

```output
FAIL
FAIL
FAIL
FAIL
FAIL
Passed: 0
Highest: 40
```

### five zeros

```input
0 0 0 0 0
```

```output
FAIL
FAIL
FAIL
FAIL
FAIL
Passed: 0
Highest: 0
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int counter = 1;
    int passCount = 0;
    int highest = 0;
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
        if (mark > highest)
        {
            highest = mark;
        }
        counter = counter + 1;
    }
    cout << "Passed: " << passCount << endl;
    cout << "Highest: " << highest << endl;
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
    int highest = -1;
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
        if (mark > highest)
        {
            highest = mark;
        }
        counter = counter + 1;
    }
    cout << "Passed: " << passCount << endl;
    cout << "Highest: " << highest << endl;
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
    int highest = 0;
    int mark;
    while (counter <= 5)
    {
        cin >> mark;
        if (mark > 49)
        {
            cout << "PASS" << endl;
            passCount = passCount + 1;
        }
        else
        {
            cout << "FAIL" << endl;
        }
        if (mark > highest)
        {
            highest = mark;
        }
        counter = counter + 1;
    }
    cout << "Passed: " << passCount << endl;
    cout << "Highest: " << highest << endl;
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
    int highest = -1;
    int mark;
    while (counter <= 5)
    {
        cin >> mark;
        if (mark > 49)
        {
            cout << "PASS" << endl;
            passCount = passCount + 1;
        }
        else
        {
            cout << "FAIL" << endl;
        }
        if (mark > highest)
        {
            highest = mark;
        }
        counter = counter + 1;
    }
    cout << "Passed: " << passCount << endl;
    cout << "Highest: " << highest << endl;
    return 0;
}
```

## Hints

- Which variable should the PASS/FAIL decision look at: the one that counts the students, or the one that holds what was typed? What values does `counter` take?
- `highest` must start **below** every possible mark, so that the first mark always replaces it. Can any mark be bigger than 100?

## Explanation

**Bug 1: the decision tests the wrong variable.** `counter` only counts the students: it is 1, 2, 3, 4, 5. `counter >= 50` is never TRUE, so every student gets `FAIL` and `passCount` stays 0. The decision must test the mark that was just read: `if (mark >= 50)`.

**Bug 2: `highest` starts too high.** The check `if (mark > highest)` only replaces `highest` with a **bigger** mark. Starting at 100, no mark from 0 to 100 is ever bigger, so `highest` stays 100 whatever is typed. A "highest so far" box must start at a value that every real mark beats or equals. Marks are never below 0, so `int highest = 0;` works (or `-1`): the first mark replaces it, and every later mark is compared with the best one so far.

Trace of `highest` for `72 45 50 38 90` after the fix: 72, 72, 72, 72, 90. The test with five zeros checks that `0` is still a correct answer when every mark is 0.
