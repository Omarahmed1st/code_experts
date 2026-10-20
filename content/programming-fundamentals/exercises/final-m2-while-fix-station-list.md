---
slug: final-m2-while-fix-station-list
type: correct_code
title: Fix the station list
lesson: while-loops-in-cpp
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A metro screen lists the stations of a trip, numbered from 1 to `n`, then shows `Last stop`. For `n = 3` it should print `Station 1`, `Station 2`, `Station 3`, but it prints `Station 2` and `Station 3` only.

The program has **two** bugs, and fixing only one of them still gives a wrong list. Find both and fix the program. Keep `int i = 1;` as it is.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    int i = 1;
    while (i < n)
    {
        i++;
        cout << "Station " << i << endl;
    }
    cout << "Last stop" << endl;
    return 0;
}
```

## Expected behavior

The user types the number of stations `n` (1 or more). The program prints `Station 1` to `Station n`, one per line, and then `Last stop`.

## Tests

### three stations

```input
3
```

```output
Station 1
Station 2
Station 3
Last stop
```

### one station

```input
1
```

```output
Station 1
Last stop
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    int i = 1;
    while (i <= n)
    {
        cout << "Station " << i << endl;
        i++;
    }
    cout << "Last stop" << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    int i = 1;
    while (i < n + 1)
    {
        cout << "Station " << i << endl;
        i++;
    }
    cout << "Last stop" << endl;
    return 0;
}
```

## Hints

- Where does the update belong in a `while` loop: at the start of the body or at the end? What is `i` when the first `cout` runs?
- After you move the update, trace `n = 3` again. Is station 3 printed? Is `3 < 3` TRUE?

## Explanation

1. **The update is in the wrong place.** In a `while` loop the update goes at the **end** of the body. Here `i++` runs before the `cout`, so the first value printed is already 2, and station 1 is never shown.
2. **The condition stops one station early.** Once the update is moved, the loop prints `i` before increasing it, so it must still run when `i` equals `n`: the condition is `i <= n` (or `i < n + 1`). With `i < n`, the last station is missing; for `n = 1` the body wouldn't run at all.

The two bugs hid each other: printing **after** `i++` shifted every number up by one, which made `i < n` look right for the last station. Fixing one of them alone gives `Station 1`, `Station 2` (no station 3), or `Station 2` to `Station 4`. Only both fixes together give the right list. (Starting at `int i = 0;` would also work with the old loop, but the question asks you to keep `int i = 1;`.)
