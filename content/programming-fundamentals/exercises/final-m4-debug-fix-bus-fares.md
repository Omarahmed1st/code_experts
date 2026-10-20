---
slug: final-m4-debug-fix-bus-fares
type: correct_code
title: Fix the bus fares
lesson: loops-with-decisions-and-debugging
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A school trip pays for a bus. The program reads how many riders there are, then each rider's age. Children **under 6 ride free**; everyone else pays **8 pounds**. It should print the total fare. The program has **two** bugs. Find them and fix them without adding new variables.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n, age;
    int total = 0;
    cin >> n;
    for (int i = 1; i < n; i++)
    {
        cin >> age;
        if (age >= 6)
        {
            total = 8;
        }
    }
    cout << "Total fare: " << total << endl;
    return 0;
}
```

## Expected behavior

The user types the number of riders, then each age. The program prints `Total fare: ` and 8 pounds for every rider aged 6 or more.

## Tests

### four riders, one small child

```input
4
10 5 30 7
```

```output
Total fare: 24
```

### two adults

```input
2
40 41
```

```output
Total fare: 16
```

### one small child

```input
1
3
```

```output
Total fare: 0
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n, age;
    int total = 0;
    cin >> n;
    for (int i = 1; i <= n; i++)
    {
        cin >> age;
        if (age >= 6)
        {
            total = total + 8;
        }
    }
    cout << "Total fare: " << total << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n, age;
    int total = 0;
    cin >> n;
    for (int i = 1; i <= n; i++)
    {
        cin >> age;
        if (age >= 6)
        {
            total += 8;
        }
    }
    cout << "Total fare: " << total << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n, age;
    int total = 0;
    cin >> n;
    for (int i = 0; i < n; i++)
    {
        cin >> age;
        if (age >= 6)
        {
            total = total + 8;
        }
    }
    cout << "Total fare: " << total << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n, age;
    int total = 0;
    cin >> n;
    for (int i = 0; i < n; i++)
    {
        cin >> age;
        if (age >= 6)
        {
            total += 8;
        }
    }
    cout << "Total fare: " << total << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n, age;
    int total = 0;
    cin >> n;
    for (int i = 1; i <= n; i++)
    {
        cin >> age;
        if (age >= 6)
        {
            total = 8 + total;
        }
    }
    cout << "Total fare: " << total << endl;
    return 0;
}
```

## Hints

- With 4 riders, how many times does `for (int i = 1; i < n; i++)` run?
- `total = 8;` puts 8 in the box. Does it add anything to what was there?

## Explanation

1. **The loop runs one time too few.** Starting at 1 with `i < n` gives the values 1, 2, 3 for `n = 4`: only three ages are read. Use `i <= n` (or start at 0 and keep `i < n`). With one rider, the old loop doesn't run at all.
2. **The total is overwritten, not added to.** `total = 8;` replaces whatever was in `total`, so it can only ever be 0 or 8. An accumulator must add to itself: `total = total + 8;` (or `total += 8;`).

With the first test, the broken program reads only 10, 5 and 30 and prints `Total fare: 8`. Both bugs hide each other a little, which is why a test with several paying riders, and one with a single rider, are both needed.
