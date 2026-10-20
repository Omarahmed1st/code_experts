---
slug: var-correct-case-sensitive-name
type: correct_code
title: Fix the name that doesn't match
lesson: variables-named-boxes-in-memory
difficulty: medium
updated: 2026-10-10
---

## Question

This program should print a student's marks and grade letter, but the compiler refuses it. There is **one** bug. Find it and fix the program.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int studentMarks = 85;
    char grade = 'B';
    cout << "Marks: " << studentmarks << endl;
    cout << "Grade: " << grade << endl;
    return 0;
}
```

## Expected behavior

The program prints `Marks: 85` on the first line and `Grade: B` on the second line.

## Tests

### Marks and grade

```output
Marks: 85
Grade: B
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int studentMarks = 85;
    char grade = 'B';
    cout << "Marks: " << studentMarks << endl;
    cout << "Grade: " << grade << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int studentmarks = 85;
    char grade = 'B';
    cout << "Marks: " << studentmarks << endl;
    cout << "Grade: " << grade << endl;
    return 0;
}
```

## Hints

- Compare the name on line 5 with the name on line 7, letter by letter.
- In C++, is `M` the same as `m`?

## Explanation

C++ names are **case-sensitive**: `studentMarks` (capital `M`) and `studentmarks` (small `m`) are two different names. Line 5 creates a box called `studentMarks`, but line 7 asks for a box called `studentmarks`, which was never declared, so the compiler stops with an error such as "'studentmarks' was not declared in this scope".

The fix is to use exactly the same spelling in both places. Changing line 7 to `studentMarks` is the usual fix, but renaming the declaration to `studentmarks` also works.
