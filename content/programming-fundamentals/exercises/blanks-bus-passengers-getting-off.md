---
slug: blanks-bus-passengers-getting-off
type: correct_code
ask: blanks
title: Fill in the blanks for the bus passengers
lesson: counters-accumulators-and-input-loops
difficulty: medium
updated: 2026-10-10
---

## Question

A bus leaves the station with 40 passengers. At each of its **4 stops** some passengers get off, and nobody gets on. The program reads how many get off at each stop and prints how many are still on the bus. Fill in the **three blanks**: a starting value, a comparison operator, and a short calculation.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int passengers = 40;
    int off;
    int stop = ___;
    while (stop ___ 4)
    {
        cin >> off;
        passengers = ___;
        stop++;
    }
    cout << "Still on the bus: " << passengers << endl;
    return 0;
}
```

## Expected behavior

The user types 4 whole numbers, one for each stop. The program subtracts each one from 40 and prints `Still on the bus: ` followed by the number left. Any number typed after the fourth one must be ignored.

## Tests

### 5, 12, 3 and 8 get off (then an extra 6 that must be ignored)

```input
5 12 3 8 6
```

```output
Still on the bus: 12
```

### nobody gets off (then an extra 9 that must be ignored)

```input
0 0 0 0 9
```

```output
Still on the bus: 40
```

### everyone gets off by the last stop (then an extra 1 that must be ignored)

```input
10 10 10 10 1
```

```output
Still on the bus: 0
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int passengers = 40;
    int off;
    int stop = 1;
    while (stop <= 4)
    {
        cin >> off;
        passengers = passengers - off;
        stop++;
    }
    cout << "Still on the bus: " << passengers << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int passengers = 40;
    int off;
    int stop = 0;
    while (stop < 4)
    {
        cin >> off;
        passengers = passengers - off;
        stop++;
    }
    cout << "Still on the bus: " << passengers << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int passengers = 40;
    int off;
    int stop = 0;
    while (stop != 4)
    {
        cin >> off;
        passengers = passengers - off;
        stop++;
    }
    cout << "Still on the bus: " << passengers << endl;
    return 0;
}
```

## Hints

- How many times must the loop run? Choose a start for `stop` and a comparison that give exactly 4 passes.
- The number on the bus goes **down** by the number who got off.

## Explanation

**Blanks 1 and 2.** Together, the start value and the comparison must make the loop run exactly **4** times:

- `stop = 1` with `stop <= 4` gives the passes 1, 2, 3, 4.
- `stop = 0` with `stop < 4` gives 0, 1, 2, 3, which is also 4 passes. (`stop = 0` with `stop != 4` works too.)
- Mixing them up is the classic off-by-one bug: `1` with `<` gives only 3 passes, and `0` with `<=` gives 5.

**Blank 3.** `passengers - off`: the passengers left go down by the number who got off. This is an accumulator that subtracts instead of adds.

Trace of the first test, with `stop` starting at 1:

| stop | off | passengers after |
|---|---|---|
| 1 | 5 | 40 − 5 = 35 |
| 2 | 12 | 35 − 12 = 23 |
| 3 | 3 | 23 − 3 = 20 |
| 4 | 8 | 20 − 8 = 12 |

Then `stop` is 5, `5 <= 4` is FALSE, and the program prints `Still on the bus: 12`. The extra 6 is never read; a loop that runs 5 times would read it and print 6.
