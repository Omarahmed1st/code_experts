---
slug: correct-count-passing-marks
type: correct_code
title: Fix the pass counter
lesson: loops-with-decisions-and-debugging
difficulty: medium
updated: 2026-10-09
---

## Question

This program should read the marks of **5** students and count how many passed. A mark of **50 or more** is a pass. It has **two** bugs. Find them and fix the program.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    int passed = 0;
    for (int i = 1; i < 5; i++)
    {
        cin >> mark;
        if (mark > 50)
        {
            passed++;
        }
    }
    cout << "Passed: " << passed << endl;
    return 0;
}
```

## Expected behavior

The user types 5 whole-number marks. The program prints `Passed: ` followed by how many of them are 50 or more. For `50 72 41 90 30` it prints `Passed: 3`.

## Tests

### one mark is exactly 50

```input
50 72 41 90 30
```

```output
Passed: 3
```

### only the last mark passes

```input
10 20 30 40 50
```

```output
Passed: 1
```

### everyone passes

```input
99 98 97 96 95
```

```output
Passed: 5
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    int passed = 0;
    for (int i = 1; i <= 5; i++)
    {
        cin >> mark;
        if (mark >= 50)
        {
            passed++;
        }
    }
    cout << "Passed: " << passed << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    int passed = 0;
    for (int i = 1; i < 6; i++)
    {
        cin >> mark;
        if (mark >= 50)
        {
            passed++;
        }
    }
    cout << "Passed: " << passed << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    int passed = 0;
    for (int i = 0; i < 5; i++)
    {
        cin >> mark;
        if (mark >= 50)
        {
            passed++;
        }
    }
    cout << "Passed: " << passed << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    int passed = 0;
    for (int i = 1; i <= 5; i++)
    {
        cin >> mark;
        if (mark > 49)
        {
            passed++;
        }
    }
    cout << "Passed: " << passed << endl;
    return 0;
}
```

## Hints

- Count the passes of the loop: which values does `i` take?
- Is a mark of exactly 50 counted? Try `50 > 50`.

## Explanation

1. **The loop runs 4 times, not 5.** With `i < 5`, `i` takes the values 1, 2, 3 and 4. When `i` is 5, `5 < 5` is false, so the fifth mark is never read. Use `i <= 5` (or `i < 6`, or start at 0 with `i < 5`).
2. **A mark of exactly 50 is counted as a fail.** "50 or more" means `mark >= 50`. With `mark > 50`, the check `50 > 50` is false. This is a boundary bug, and only a test with the value 50 can catch it.

Both are **off-by-one** errors: one in the loop condition, one in the decision. They are the most common bugs in loops and decisions, so always test the first and last pass and the boundary value.
