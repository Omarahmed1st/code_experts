---
slug: final-m3-debug-fix-hot-days-outside-loop
type: correct_code
title: Fix the hot days counter
lesson: loops-with-decisions-and-debugging
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A weather station in Aswan records the temperature on **5** days. This program should count the **hot days** (above 35 degrees) and add up the temperatures of those hot days.

For `36 30 40 20 38` it should print `Hot days: 3` and `Hot total: 114`. Instead it prints `Hot days: 1` and `Hot total: 6`. The program has **two** bugs. Trace it, find them and fix the program. Keep `int i;` and the loop header as they are.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int t;
    int i;
    int hot = 0;
    int hotSum = 0;
    for (i = 1; i <= 5; i++)
    {
        cin >> t;
    }
    if (t > 35)
    {
        hot++;
        hotSum += i;
    }
    cout << "Hot days: " << hot << endl;
    cout << "Hot total: " << hotSum << endl;
    return 0;
}
```

## Expected behavior

The user types 5 whole-number temperatures. The program prints `Hot days: ` and how many of them are above 35, then `Hot total: ` and the sum of only those temperatures.

## Tests

### three hot days

```input
36 30 40 20 38
```

```output
Hot days: 3
Hot total: 114
```

### no hot day

```input
30 31 32 33 34
```

```output
Hot days: 0
Hot total: 0
```

### the last day is cool

```input
40 36 20 50 10
```

```output
Hot days: 3
Hot total: 126
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int t;
    int i;
    int hot = 0;
    int hotSum = 0;
    for (i = 1; i <= 5; i++)
    {
        cin >> t;
        if (t > 35)
        {
            hot++;
            hotSum += t;
        }
    }
    cout << "Hot days: " << hot << endl;
    cout << "Hot total: " << hotSum << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int t;
    int i;
    int hot = 0;
    int hotSum = 0;
    for (i = 1; i <= 5; i++)
    {
        cin >> t;
        if (t > 35)
        {
            hot++;
            hotSum = hotSum + t;
        }
    }
    cout << "Hot days: " << hot << endl;
    cout << "Hot total: " << hotSum << endl;
    return 0;
}
```

## Hints

- Which lines are between the `{ }` of the `for` loop? How many times does the `if` run?
- After the loop, what are the values of `t` and `i`? Which one is a temperature?

## Explanation

Trace the first test: the loop reads 36, 30, 40, 20 and 38, but it does **nothing** with them except store each one in `t`, replacing the one before. When the loop ends, `t` holds only the last value, 38, and `i` is 6.

1. **The decision is outside the loop.** The `if` comes after the loop's closing `}`, so it runs **once**, for the last temperature only. 38 is above 35, so `hot` becomes 1. The decision must be **inside** the loop, right after `cin >> t;`, so it is made again for every day. Move the loop's closing `}` below the `if`.
2. **The wrong variable is added.** `hotSum += i` adds the loop counter, not the temperature. After the loop `i` is 6, which is where `Hot total: 6` came from. It must be `hotSum += t`.

The third test shows why one test is not enough: its last day is 10, so the broken program prints `Hot days: 0`, even though three days were hot.
