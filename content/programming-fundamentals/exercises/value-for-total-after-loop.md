---
slug: value-for-total-after-loop
type: trace
ask: value
title: What is total when the loop ends?
lesson: for-loops
difficulty: medium
updated: 2026-10-10
---

## Question

What is the value of `total` **right after the loop ends** (on the `cout` line)? Type just the number.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int total = 0;
    for (int i = 1; i <= 7; i = i + 2)
    {
        total = total + i;
    }
    cout << "Done" << endl;
    return 0;
}
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int total = 0;
    for (int i = 1; i <= 7; i = i + 2)
    {
        total = total + i;
    }
    cout << total << endl;
    return 0;
}
```

## Answer

```output
16
```

## Hints

- Which values does `i` take? It starts at 1 and goes up by 2.
- Add each of those values to `total`.

## Explanation

`i` takes the values 1, 3, 5 and 7. The next value, 9, fails `i <= 7`, so the loop stops.

`total` grows like this: 0 + 1 = 1, then 1 + 3 = 4, then 4 + 5 = 9, then 9 + 7 = **16**.

The program itself only prints `Done`, so you have to trace the variable to find its value.
