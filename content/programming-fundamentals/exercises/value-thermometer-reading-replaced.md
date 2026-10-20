---
slug: value-thermometer-reading-replaced
type: trace
ask: value
title: Which reading is in the box?
lesson: variables-named-boxes-in-memory
difficulty: easy
updated: 2026-10-10
---

## Question

A thermometer program stores readings during the day. What is the value of `reading` (small `r`) **when the last `cout` (the one that prints `Saved`) runs**? Type just the number.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    float reading = 21.5;
    cout << "Morning: " << reading << endl;
    reading = 26.5;
    cout << "Noon: " << reading << endl;
    reading = 19.5;
    float Reading = 33.5;
    cout << "Saved" << endl;
    return 0;
}
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    float reading = 21.5;
    reading = 26.5;
    reading = 19.5;
    float Reading = 33.5;
    cout << reading << endl;
    return 0;
}
```

## Answer

```output
19.5
```

## Hints

- A variable holds one value at a time. A new value replaces the old one.
- C++ names are case-sensitive: is `Reading` the same box as `reading`?

## Explanation

The box called `reading` gets three values, one after the other:

1. `float reading = 21.5;` stores 21.5.
2. `reading = 26.5;` replaces it with 26.5. The 21.5 is gone.
3. `reading = 19.5;` replaces it with 19.5.

The next line, `float Reading = 33.5;`, creates a **different** box. Names are case-sensitive, so `Reading` (capital R) and `reading` (small r) are two separate variables, and storing 33.5 in `Reading` doesn't touch `reading`.

So when `Saved` is printed, `reading` holds **19.5**.
