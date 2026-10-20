---
slug: final-m2-acc-which-inputs-three-calls
type: mcq
title: Which inputs give three calls?
lesson: counters-accumulators-and-input-loops
difficulty: hard
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

This program reads the lengths of phone calls in minutes, one after another, and the user types **0** to finish. It counts the calls and adds up the minutes.

For which typed lines does the program print exactly `Calls: 3 Total: 15`? Pick **all** of them.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int minutes;
    int calls = 0;
    int total = 0;
    cin >> minutes;
    while (minutes != 0)
    {
        calls++;
        total += minutes;
        cin >> minutes;
    }
    cout << "Calls: " << calls << " Total: " << total << endl;
    return 0;
}
```

## Options

- [x] `5 5 5 0`
  Right: three calls of 5 minutes are counted and added, 5 + 5 + 5 = 15. Then the 0 ends the loop; it is not counted.
- [x] `10 2 3 0 9`
  Right: 10, 2 and 3 are three calls, 15 minutes in all. The loop stops at the 0, so the 9 after it is never read.
- [ ] `7 8 0 0`
  The total is right, 7 + 8 = 15, but the loop stops at the **first** 0. Only 2 calls are counted: it prints `Calls: 2 Total: 15`.
- [ ] `4 0 6 5`
  The loop stops at the 0 right after the 4, so 6 and 5 are never read. It prints `Calls: 1 Total: 4`.
- [ ] `0 5 5 5 0`
  The first value is already 0, so `0 != 0` is FALSE before the first pass. The body never runs: it prints `Calls: 0 Total: 0`.

## Hints

- The first `cin` is before the loop. The loop checks each value **before** counting it.
- What happens to the values typed **after** the first 0?

## Explanation

This is an input loop that stops at a special value, 0. The first value is read **before** the loop, and each new value is read at the **end** of the body, so the condition `minutes != 0` checks every value before it is counted. That gives three rules:

1. The 0 is never counted and never added.
2. The loop stops at the **first** 0. Anything typed after it is never read.
3. If the very first value is 0, the body runs zero times.

So `5 5 5 0` and `10 2 3 0 9` both give 3 calls and 15 minutes. `7 8 0 0` gives the right total but only 2 calls, `4 0 6 5` stops after one call, and `0 5 5 5 0` stops before any call. Both the counter and the accumulator have to match, so check them separately.
