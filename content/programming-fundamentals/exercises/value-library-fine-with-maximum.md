---
slug: value-library-fine-with-maximum
type: trace
ask: value
title: What is the library fine?
lesson: decisions-if-then-else
difficulty: medium
updated: 2026-10-10
---

## Question

A library charges 2 pounds a day for the first 7 days a book is late, then 5 pounds a day after that, and never more than 40 pounds in total. A book is 12 days late. What is the value of `fine` **when the program reaches `return 0;`**? Type just the number.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int daysLate = 12;
    int fine;
    if (daysLate > 7)
    {
        fine = 7 * 2 + (daysLate - 7) * 5;
    }
    else
    {
        fine = daysLate * 2;
    }
    if (fine > 40)
    {
        fine = 40;
        cout << "Maximum fine" << endl;
    }
    else
    {
        cout << "Normal fine" << endl;
    }
    return 0;
}
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int daysLate = 12;
    int fine;
    if (daysLate > 7)
    {
        fine = 7 * 2 + (daysLate - 7) * 5;
    }
    else
    {
        fine = daysLate * 2;
    }
    if (fine > 40)
    {
        fine = 40;
    }
    cout << fine << endl;
    return 0;
}
```

## Answer

```output
39
```

## Hints

- The first decision chooses how to calculate the fine; the second one checks it against the maximum.
- Inside the brackets first, then `*`, then `+`.

## Explanation

**First decision:** `12 > 7` is TRUE, so the TRUE path runs:

`fine = 7 * 2 + (12 - 7) * 5` = 14 + 5 × 5 = 14 + 25 = **39**.

**Second decision:** `39 > 40` is FALSE, so `fine` is **not** changed to 40. The else path prints `Normal fine`.

So `fine` is still **39** at `return 0;`. If you answered 40, you applied the maximum even though the fine is below it. If you answered 24 (12 × 2), you took the else path of the first decision, but 12 days is more than 7.
