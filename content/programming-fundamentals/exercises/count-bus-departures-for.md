---
slug: count-bus-departures-for
type: trace
ask: count
title: How many buses leave in two hours?
lesson: for-loops
difficulty: easy
updated: 2026-10-10
---

## Question

A bus leaves the station every 25 minutes, starting at minute 0, for the next two hours (120 minutes). **How many times does the `cout` line inside the loop run?** Type a number.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    for (int minute = 0; minute <= 120; minute += 25)
    {
        cout << "Bus at minute " << minute << endl;
    }
    return 0;
}
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int runs = 0;
    for (int minute = 0; minute <= 120; minute += 25)
    {
        runs++;
    }
    cout << runs << endl;
    return 0;
}
```

## Answer

```output
5
```

## Hints

- List the values of `minute`: it starts at 0, not at 25.
- Stop at the first value that is more than 120.

## Explanation

`minute` takes the values **0, 25, 50, 75 and 100**. That is 5 values, so the `cout` runs 5 times.

The next value is 125, and `125 <= 120` is FALSE, so the loop stops. 120 itself is never reached, because the steps of 25 jump from 100 straight to 125.

A common slip is to work out 120 / 25 = 4 and stop there: that forgets the bus at minute 0. Listing the values is the safe way to count.
