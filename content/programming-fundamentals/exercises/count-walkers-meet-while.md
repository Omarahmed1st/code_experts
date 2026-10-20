---
slug: count-walkers-meet-while
type: trace
ask: count
title: How many steps until the friends meet?
lesson: while-loops-in-cpp
difficulty: medium
updated: 2026-10-10
---

## Question

Ali and Mona walk towards each other along a 20-metre corridor. Ali starts at metre 0 and Mona at metre 20. Read the program. **How many times does the body of the `while` loop run?** Type a number.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int ali = 0;
    int mona = 20;
    while (ali < mona)
    {
        ali += 3;
        mona -= 2;
    }
    cout << "They meet at metre " << ali << endl;
    return 0;
}
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int ali = 0;
    int mona = 20;
    int runs = 0;
    while (ali < mona)
    {
        ali += 3;
        mona -= 2;
        runs++;
    }
    cout << runs << endl;
    return 0;
}
```

## Answer

```output
4
```

## Hints

- Both variables change in every pass: `ali` goes up by 3 and `mona` goes down by 2.
- Write both values before each check. The loop stops at the first check where `ali < mona` is FALSE.

## Explanation

`ali += 3` adds 3 to `ali`, and `mona -= 2` takes 2 away from `mona`. Each pass brings them 5 metres closer.

| Pass | ali before | mona before | Check | ali after | mona after |
|---|---|---|---|---|---|
| 1 | 0 | 20 | 0 < 20 TRUE | 3 | 18 |
| 2 | 3 | 18 | 3 < 18 TRUE | 6 | 16 |
| 3 | 6 | 16 | 6 < 16 TRUE | 9 | 14 |
| 4 | 9 | 14 | 9 < 14 TRUE | 12 | 12 |

The next check is `12 < 12`, which is FALSE: 12 is not less than itself. So the body runs **4** times and the program prints `They meet at metre 12`.
