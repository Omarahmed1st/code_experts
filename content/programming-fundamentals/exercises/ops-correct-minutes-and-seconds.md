---
slug: ops-correct-minutes-and-seconds
type: correct_code
title: Fix the minutes and seconds
lesson: operators
difficulty: medium
updated: 2026-10-10
---

## Question

A song is 135 seconds long. This program should print its length in minutes and seconds, but it prints `15 minutes and 2 seconds`. Find the bug and fix the program.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int totalSeconds = 135;
    int minutes = totalSeconds % 60;
    int seconds = totalSeconds / 60;
    cout << minutes << " minutes and " << seconds << " seconds" << endl;
    return 0;
}
```

## Expected behavior

There are 60 seconds in a minute, so 135 seconds is 2 full minutes and 15 seconds left over. The program prints `2 minutes and 15 seconds`.

## Tests

### 135 seconds

```output
2 minutes and 15 seconds
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int totalSeconds = 135;
    int minutes = totalSeconds / 60;
    int seconds = totalSeconds % 60;
    cout << minutes << " minutes and " << seconds << " seconds" << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int totalSeconds = 135;
    int seconds = totalSeconds % 60;
    int minutes = totalSeconds / 60;
    cout << minutes << " minutes and " << seconds << " seconds" << endl;
    return 0;
}
```

## Hints

- Which operator tells you how many **full** groups of 60 there are?
- Which operator tells you what is **left over**?

## Explanation

The two operators are swapped. `/` gives the number of full groups and `%` gives the remainder:

- `135 / 60` is 2 (60 × 2 = 120), the full **minutes**.
- `135 % 60` is 15 (135 − 120 = 15), the **seconds** left over.

The broken program stores the remainder (15) in `minutes` and the whole part (2) in `seconds`. Using `/` for `minutes` and `%` for `seconds` fixes it.
