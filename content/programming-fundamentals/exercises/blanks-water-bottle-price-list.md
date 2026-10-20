---
slug: blanks-water-bottle-price-list
type: correct_code
ask: blanks
title: Fill in the blanks for the water price list
lesson: for-loops
difficulty: easy
updated: 2026-10-10
---

## Question

A shop sells bottles of water in packs of 6, and each bottle costs 4 pounds. The program prints a price list for 6, 12, 18 … up to 36 bottles. Fill in the **three blanks**: a comparison operator, the **whole update part** of the `for` header, and a number.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    for (int bottles = 6; bottles ___ 36; ___)
    {
        cout << bottles << " bottles: " << bottles * ___ << " pounds" << endl;
    }
    return 0;
}
```

## Expected behavior

The program prints one line for each pack size from 6 to 36 bottles, going up by 6: the number of bottles, then the price (bottles × 4).

## Tests

### the price list

```output
6 bottles: 24 pounds
12 bottles: 48 pounds
18 bottles: 72 pounds
24 bottles: 96 pounds
30 bottles: 120 pounds
36 bottles: 144 pounds
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    for (int bottles = 6; bottles <= 36; bottles += 6)
    {
        cout << bottles << " bottles: " << bottles * 4 << " pounds" << endl;
    }
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    for (int bottles = 6; bottles <= 36; bottles = bottles + 6)
    {
        cout << bottles << " bottles: " << bottles * 4 << " pounds" << endl;
    }
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    for (int bottles = 6; bottles <= 36; bottles = 6 + bottles)
    {
        cout << bottles << " bottles: " << bottles * 4 << " pounds" << endl;
    }
    return 0;
}
```

## Hints

- Is 36 bottles on the list? Choose the comparison that includes it.
- The number of bottles goes up by 6 after each line.

## Explanation

1. `bottles <= 36`: the list must include 36. With `<`, the last line (36 bottles) would be missing.
2. `bottles += 6`: after each line the count jumps by 6. `bottles = bottles + 6` means the same thing and is accepted too. (`bottles++` would print 6, 7, 8 … instead.)
3. `4`: each bottle costs 4 pounds, so the price is `bottles * 4`.

`bottles` takes the values 6, 12, 18, 24, 30 and 36. Then it becomes 42, `42 <= 36` is FALSE, and the loop stops, so there are exactly 6 lines.
