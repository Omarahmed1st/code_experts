---
slug: final-for-two-ifs-count
type: mcq
title: Two decisions in one loop
lesson: for-loops
difficulty: hard
updated: 2026-10-10
reserved: true
---

## Question

This `for` loop has **two separate** `if` statements inside it. Both are checked in every pass. What does the program print?

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int count = 0;
    for (int i = 1; i <= 20; i++)
    {
        if (i % 3 == 0)
        {
            count++;
        }
        if (i % 5 == 0)
        {
            count--;
        }
    }
    cout << count << endl;
    return 0;
}
```

## Options

- [x] `2`
  Right: 6 multiples of 3 add 1 each, and 4 multiples of 5 take 1 away each: 6 − 4 = 2.
- [ ] `3`
  This would be the answer if the second check were an `else`, so that 15 was only counted once. Here both `if`s run for 15: +1, then −1.
- [ ] `6`
  That is only the multiples of 3. The second `if` also runs in every pass and takes 1 away for each multiple of 5.
- [ ] `10`
  The second `if` uses `count--`, which **subtracts** 1. It does not add.

## Answer

```output
2
```

## Hints

- List the multiples of 3 from 1 to 20, then the multiples of 5. Does `i <= 20` include 20?
- 15 is a multiple of both. Two separate `if`s means both of them run for 15.

## Explanation

The loop runs for `i` = 1 to 20 (the `<=` includes 20). In every pass, both decisions are made, one after the other:

- `i % 3 == 0` is TRUE for 3, 6, 9, 12, 15 and 18: six times `count++`.
- `i % 5 == 0` is TRUE for 5, 10, 15 and 20: four times `count--`.

So `count` is 6 − 4 = 2. For 15, both conditions are TRUE: the first `if` adds 1 and the second takes it away again. Two separate `if` statements are independent; only an `if … else` makes the two paths exclude each other.
