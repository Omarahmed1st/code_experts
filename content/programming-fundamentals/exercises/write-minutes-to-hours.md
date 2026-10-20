---
slug: write-minutes-to-hours
type: write_code
title: Turn minutes into hours and minutes
lesson: operators
difficulty: easy
updated: 2026-10-09
---

## Question

A video is 135 minutes long. It is easier to read as "2 h 15 min". Write a program that reads a whole number of minutes and prints it as hours and minutes, using `/` and `%`.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int minutes;
    cin >> minutes;
    // work out the hours and the minutes left over, then print them

    return 0;
}
```

## Expected behavior

The user types a whole number of minutes (0 or more). The program prints the hours, then ` h `, then the minutes left over, then ` min`. For 135 it prints `2 h 15 min`. For 45 it prints `0 h 45 min`.

## Tests

### 135 minutes

```input
135
```

```output
2 h 15 min
```

### exactly one hour

```input
60
```

```output
1 h 0 min
```

### less than one hour

```input
45
```

```output
0 h 45 min
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int minutes;
    cin >> minutes;
    int hours = minutes / 60;
    int rest = minutes % 60;
    cout << hours << " h " << rest << " min" << endl;
    return 0;
}
```

## Hints

- One hour is 60 minutes. How many **full** groups of 60 are in 135?
- Which operator gives what is left over after taking out those full hours?

## Explanation

This is the `/` and `%` pair again:

- `minutes / 60` is whole-number division (both are `int`), so it gives the number of **full** hours: `135 / 60` is `2`.
- `minutes % 60` is the **remainder**: the minutes left over. 2 hours are 120 minutes, and 135 − 120 = 15, so `135 % 60` is `15`.

Check the edge cases: for 60, `60 / 60` is 1 and `60 % 60` is 0. For 45, `45 / 60` is 0, because 60 doesn't fit into 45 even once, and `45 % 60` is 45.

Notice the spaces inside the quotes: `" h "` and `" min"`. Without them the numbers and words would stick together, like `2h15min`.
