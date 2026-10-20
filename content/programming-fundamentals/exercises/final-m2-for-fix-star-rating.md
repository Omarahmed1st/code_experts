---
slug: final-m2-for-fix-star-rating
type: correct_code
title: Fix the star rating
lesson: for-loops
difficulty: medium
reserved: true
updated: 2026-10-10
---

## Question

A koshary shop shows its rating as stars. The program reads the rating `n` and should print `n` stars **on one line**, followed by ` Rating: n`. For `3` it should print:

```output
*** Rating: 3
```

Instead it prints **four** stars, each on its own line, and then ` Rating: 3`. The `for` loop has **two** bugs. Fix them. Keep the last `cout` line as it is.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    for (int i = 0; i <= n; i++)
    {
        cout << "*" << endl;
    }
    cout << " Rating: " << n << endl;
    return 0;
}
```

## Expected behavior

The user types a whole number `n` from 1 to 5. The program prints exactly `n` stars with no spaces between them, then ` Rating: ` and `n`, all on one line. For `3` it prints `*** Rating: 3`.

## Tests

### three stars

```input
3
```

```output
*** Rating: 3
```

### one star

```input
1
```

```output
* Rating: 1
```

### five stars

```input
5
```

```output
***** Rating: 5
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    for (int i = 1; i <= n; i++)
    {
        cout << "*";
    }
    cout << " Rating: " << n << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    for (int i = 0; i < n; i++)
    {
        cout << "*";
    }
    cout << " Rating: " << n << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    for (int i = 1; i < n + 1; i++)
    {
        cout << "*";
    }
    cout << " Rating: " << n << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    for (int i = 0; i <= n - 1; i++)
    {
        cout << "*";
    }
    cout << " Rating: " << n << endl;
    return 0;
}
```

## Hints

- List the values `i` takes for `n = 3`: it starts at 0 and the condition is `i <= 3`. How many passes is that?
- Which part of the loop body starts a new line after every star?

## Explanation

1. **One pass too many.** Starting at 0 with `i <= n` gives `i` = 0, 1, 2, 3 for `n = 3`: four passes. Starting at 0 adds one extra pass. Use `int i = 1` with `i <= n` (or keep 0 and use `i < n`), so the body runs exactly `n` times.
2. **A new line after every star.** `endl` inside the loop runs in every pass, so each star ends up on its own line. Remove it: `cout << "*";`. The stars then stay on one line, and the last `cout` continues that same line with ` Rating: 3` and ends it with its own `endl`.

This is a classic off-by-one bug, together with an `endl` in the wrong place: always check how many times a loop runs, and what each pass prints.
