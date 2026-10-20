---
slug: final-m3-algo-steps-fan-checks-twice
type: trace
title: The fan algorithm checks twice
lesson: algorithms-steps-flowcharts-pseudocode
difficulty: medium
reserved: true
updated: 2026-10-10
---

## Question

This algorithm is written as **plain-language steps**, like the temperature example in the lecture. It checks the temperature twice, and step 4 changes `T` in between. Follow the steps in order, by hand. What exactly does it print? Type one line of output per line.

## Code

```pseudocode
1. Start.
2. Set T to 33.
3. Check if T > 30.
4. If true, print "Fan ON" and subtract 3 from T.
5. Otherwise, print "Fan OFF".
6. Print T.
7. Check if T > 30.
8. If true, print "Still hot".
9. Otherwise, print "Cool now".
10. End.
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int t = 33;
    if (t > 30)
    {
        cout << "Fan ON" << endl;
        t = t - 3;
    }
    else
    {
        cout << "Fan OFF" << endl;
    }
    cout << t << endl;
    if (t > 30)
    {
        cout << "Still hot" << endl;
    }
    else
    {
        cout << "Cool now" << endl;
    }
    return 0;
}
```

## Answer

```output
Fan ON
30
Cool now
```

## Hints

- Steps 3 to 5 are one decision: only one of step 4 or step 5 runs.
- At step 7, use the **new** value of `T`. Is 30 greater than 30?

## Explanation

Steps 3 to 5 are a decision. `33 > 30` is TRUE, so step 4 runs: it prints `Fan ON` and changes `T` to 33 − 3 = 30. Step 5 is skipped, because only one of the two paths runs each time.

Step 6 prints the value `T` has **now**: `30`.

Steps 7 to 9 are a second decision, made with the new value. `30 > 30` is FALSE (30 is not greater than itself), so step 8 is skipped and step 9 prints `Cool now`.

Two common mistakes: printing `33` at step 6 (the steps run in order, so the subtraction has already happened), and printing `Still hot` (greater than does not include the value itself; that would need `>=`).
