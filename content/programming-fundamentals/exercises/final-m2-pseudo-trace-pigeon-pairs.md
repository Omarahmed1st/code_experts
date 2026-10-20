---
slug: final-m2-pseudo-trace-pigeon-pairs
type: trace
title: Pigeon pairs on the roof
lesson: loops-and-the-while-loop-in-pseudocode
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

Pigeons live on a roof in Cairo. In this made-up story, the number of pairs each month is the number of the month before **plus** the number of the month before that. The loop keeps two values, `before` and `now`, and moves them along by one month in every pass. Trace the pseudocode by hand. What exactly does it print? Type one value per line.

## Code

```pseudocode
BEGIN
    before ← 1
    now ← 1
    month ← 1
    WHILE now < 20 DO
        next ← before + now
        before ← now
        now ← next
        month ← month + 1
        PRINT now
    END WHILE
    PRINT month
    PRINT before
END
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int before = 1;
    int now = 1;
    int month = 1;
    int next;
    while (now < 20)
    {
        next = before + now;
        before = now;
        now = next;
        month = month + 1;
        cout << now << endl;
    }
    cout << month << endl;
    cout << before << endl;
    return 0;
}
```

## Answer

```output
2
3
5
8
13
21
7
13
```

## Hints

- In each pass, work out `next` with the **old** `before` and `now`, then move: `before` gets the old `now`, and `now` gets `next`.
- `now` is printed after it changes. The condition is only checked at the top of the loop, so a value of 20 or more can still be printed once.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 2 | initialization | before = 1; now = 1; month = 1 | |
| 5 | `1 < 20` is TRUE | before = 1; now = 1; month = 1 | |
| 6 | next = 1 + 1, then move along | next = 2; before = 1; now = 2; month = 2 | |
| 10 | print now | now = 2 | 2\n |
| 5 | `2 < 20` is TRUE | before = 1; now = 2; month = 2 | |
| 6 | next = 1 + 2, then move along | next = 3; before = 2; now = 3; month = 3 | |
| 10 | print now | now = 3 | 3\n |
| 5 | `3 < 20` is TRUE | before = 2; now = 3; month = 3 | |
| 6 | next = 2 + 3, then move along | next = 5; before = 3; now = 5; month = 4 | |
| 10 | print now | now = 5 | 5\n |
| 5 | `5 < 20` is TRUE | before = 3; now = 5; month = 4 | |
| 6 | next = 3 + 5, then move along | next = 8; before = 5; now = 8; month = 5 | |
| 10 | print now | now = 8 | 8\n |
| 5 | `8 < 20` is TRUE | before = 5; now = 8; month = 5 | |
| 6 | next = 5 + 8, then move along | next = 13; before = 8; now = 13; month = 6 | |
| 10 | print now | now = 13 | 13\n |
| 5 | `13 < 20` is TRUE | before = 8; now = 13; month = 6 | |
| 6 | next = 8 + 13, then move along | next = 21; before = 13; now = 21; month = 7 | |
| 10 | print now | now = 21 | 21\n |
| 5 | `21 < 20` is FALSE, the loop ends | before = 13; now = 21; month = 7 | |
| 12 | print month | month = 7 | 7\n |
| 13 | print before | before = 13 | 13\n |

## Explanation

Each pass does three things in order: it works out `next` from the **current** two values, then shifts them along (`before` takes the old `now`, `now` takes `next`), then counts the month. The order matters: if `before ← now` ran first, the old value of `before` would be lost before it was added.

| Pass | before | now | month | printed |
|---|---|---|---|---|
| 1 | 1 | 2 | 2 | 2 |
| 2 | 2 | 3 | 3 | 3 |
| 3 | 3 | 5 | 4 | 5 |
| 4 | 5 | 8 | 5 | 8 |
| 5 | 8 | 13 | 6 | 13 |
| 6 | 13 | 21 | 7 | 21 |

At the start of pass 6, `13 < 20` is TRUE, so the body runs and prints 21, even though 21 is not less than 20. The condition is only checked **before** each pass; then `21 < 20` is FALSE and the loop stops. After the loop, `month` is 7 and `before` is 13.
