---
slug: value-phone-bill-pseudocode
type: trace
ask: value
title: What is the phone bill?
lesson: pseudocode-planning-before-code
difficulty: easy
updated: 2026-10-10
---

## Question

A phone plan costs 40 pounds a month and includes 100 minutes. Every extra minute costs 2 pounds. If fewer minutes are used, there is a 5-pound discount. Trace the plan: what is the value of `bill` **when the algorithm reaches `END`**? Type just the number.

## Code

```pseudocode
BEGIN
    minutes ← 130
    bill ← 40
    IF minutes > 100 THEN
        extra ← minutes - 100
        bill ← bill + extra * 2
    ELSE
        bill ← bill - 5
    END IF
    PRINT "Bill is ready"
END
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int minutes = 130;
    int bill = 40;
    int extra;
    if (minutes > 100)
    {
        extra = minutes - 100;
        bill = bill + extra * 2;
    }
    else
    {
        bill = bill - 5;
    }
    cout << bill << endl;
    return 0;
}
```

## Answer

```output
100
```

## Hints

- Which path does the IF take when `minutes` is 130?
- `←` works out the right side first, then stores the result on the left.

## Explanation

1. `minutes ← 130` and `bill ← 40` store the starting values.
2. `130 > 100` is TRUE, so the THEN path runs and the ELSE path is skipped.
3. `extra ← 130 - 100` stores 30.
4. `bill ← bill + extra * 2` is 40 + 30 × 2 = 40 + 60 = **100**. The multiplication comes first.
5. `PRINT "Bill is ready"` prints only the message, not the bill.

So `bill` is **100** at `END`. The 5-pound discount on the ELSE path never happens here.
