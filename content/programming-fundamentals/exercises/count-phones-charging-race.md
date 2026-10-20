---
slug: count-phones-charging-race
type: trace
ask: count
title: How often is phone A ahead?
lesson: loops-with-decisions-and-debugging
difficulty: hard
updated: 2026-10-10
---

## Question

Two phones are charging. Phone A starts at 10% and gains 15% every 10 minutes. Phone B starts at 40% and gains 5% every 10 minutes. The program checks them 6 times. **How many times is `A is ahead` printed?** Type a number.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int a = 10;
    int b = 40;
    for (int check = 1; check <= 6; check++)
    {
        a = a + 15;
        b = b + 5;
        if (a > b)
        {
            cout << "A is ahead" << endl;
        }
        else
        {
            cout << "B is ahead or level" << endl;
        }
    }
    return 0;
}
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int a = 10;
    int b = 40;
    int aheadCount = 0;
    for (int check = 1; check <= 6; check++)
    {
        a = a + 15;
        b = b + 5;
        if (a > b)
        {
            aheadCount++;
        }
    }
    cout << aheadCount << endl;
    return 0;
}
```

## Answer

```output
3
```

## Hints

- Both phones charge **before** the comparison in each pass.
- Make a table with `a` and `b` after each pass. What happens when they are equal?

## Explanation

In each pass both phones charge first, then the decision compares them:

| check | a | b | a > b ? | Printed |
|---|---|---|---|---|
| 1 | 25 | 45 | FALSE | B is ahead or level |
| 2 | 40 | 50 | FALSE | B is ahead or level |
| 3 | 55 | 55 | FALSE | B is ahead or level |
| 4 | 70 | 60 | TRUE | A is ahead |
| 5 | 85 | 65 | TRUE | A is ahead |
| 6 | 100 | 70 | TRUE | A is ahead |

`A is ahead` is printed **3** times. The trap is check 3: both phones are at 55%, and `55 > 55` is FALSE, so the else path runs. If you said 4, you probably counted the tie as A being ahead.
