---
slug: count-ball-bounces-dowhile
type: trace
ask: count
title: How many times does the ball bounce?
lesson: do-while-and-choosing-a-loop
difficulty: medium
updated: 2026-10-10
---

## Question

A ball is dropped from 150 cm. After each bounce it reaches half its height (in whole centimetres). **How many times does the body of the `do-while` loop run?** Type a number.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int height = 150;
    int bounces = 0;
    do
    {
        height = height / 2;
        bounces++;
    }
    while (height > 10);
    cout << "Height now: " << height << " cm" << endl;
    return 0;
}
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int height = 150;
    int bounces = 0;
    do
    {
        height = height / 2;
        bounces++;
    }
    while (height > 10);
    cout << bounces << endl;
    return 0;
}
```

## Answer

```output
4
```

## Hints

- `height` is an `int`, so `height / 2` keeps only the whole part: 75 / 2 is 37.
- In a do-while the body runs first and the check comes after it.

## Explanation

The body runs first, then the condition is checked:

| Pass | height before | height after (÷ 2) | Check after the body |
|---|---|---|---|
| 1 | 150 | 75 | 75 > 10 TRUE |
| 2 | 75 | 37 | 37 > 10 TRUE |
| 3 | 37 | 18 | 18 > 10 TRUE |
| 4 | 18 | 9 | 9 > 10 FALSE |

The check after pass 4 is FALSE, so the body runs **4** times and the program prints `Height now: 9 cm`.

Remember that `int / int` drops the decimal part: 75 / 2 is 37, not 37.5, and 37 / 2 is 18.
