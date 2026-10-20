---
slug: value-runner-metres-and-laps
type: trace
ask: value
title: What is left in metres?
lesson: operators
difficulty: medium
updated: 2026-10-10
---

## Question

A runner ran 7450 metres. The program splits the distance into whole kilometres, then splits what is left into 200-metre laps of a track. What is the value of `metres` **when the `cout` line runs**? Type just the number.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int metres = 7450;
    int km = metres / 1000;
    metres = metres % 1000;
    int laps = metres / 200;
    metres = metres - laps * 200;
    cout << km << " km and " << laps << " laps" << endl;
    return 0;
}
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int metres = 7450;
    int km = metres / 1000;
    metres = metres % 1000;
    int laps = metres / 200;
    metres = metres - laps * 200;
    cout << metres << endl;
    return 0;
}
```

## Answer

```output
50
```

## Hints

- `/` between two `int` values keeps only the whole part; `%` gives the remainder.
- `metres` changes twice. Each time, work out the right side with the **old** value first.

## Explanation

Go line by line and keep track of every box:

| Line | What happens | metres | km | laps |
|---|---|---|---|---|
| `int metres = 7450;` | store 7450 | 7450 | | |
| `int km = metres / 1000;` | 7450 / 1000 is 7 (whole part only) | 7450 | 7 | |
| `metres = metres % 1000;` | the remainder of 7450 ÷ 1000 is 450 | 450 | 7 | |
| `int laps = metres / 200;` | 450 / 200 is 2 | 450 | 7 | 2 |
| `metres = metres - laps * 200;` | 450 − 2 × 200 = 450 − 400 | **50** | 7 | 2 |

So `metres` is **50** when the `cout` runs. The program prints `7 km and 2 laps`; the 50 metres left over are never printed. In the last line, `*` is worked out before `-`, so it is 450 − 400, not (450 − 2) × 200.
