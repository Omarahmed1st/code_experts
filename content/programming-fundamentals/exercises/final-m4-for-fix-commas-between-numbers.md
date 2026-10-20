---
slug: final-m4-for-fix-commas-between-numbers
type: correct_code
title: Fix the commas between the numbers
lesson: for-loops
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A queue machine in a bank shows the ticket numbers from 1 to `n` on one line, with a comma and a space **between** the numbers but **not** after the last one. For `5` it should print:

```output
1, 2, 3, 4, 5
```

Instead it prints `1, 2, 3, 4, ` (with a comma at the end and no 5). The program has **two** bugs, and fixing only one of them still gives a wrong line. Find both and fix them. Keep the `if` inside the loop: it is the part that decides whether a comma is printed.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    for (int i = 1; i < n; i++)
    {
        cout << i;
        if (i <= n)
        {
            cout << ", ";
        }
    }
    cout << endl;
    return 0;
}
```

## Expected behavior

The user types a whole number `n` (1 or more). The program prints the numbers 1 to `n` on one line, separated by `, ` (a comma and a space), with nothing after the last number, then ends the line.

## Tests

### five tickets

```input
5
```

```output
1, 2, 3, 4, 5
```

### one ticket

```input
1
```

```output
1
```

### three tickets

```input
3
```

```output
1, 2, 3
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
        cout << i;
        if (i < n)
        {
            cout << ", ";
        }
    }
    cout << endl;
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
    for (int i = 1; i <= n; i++)
    {
        cout << i;
        if (i != n)
        {
            cout << ", ";
        }
    }
    cout << endl;
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
        cout << i;
        if (i < n)
        {
            cout << ", ";
        }
    }
    cout << endl;
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
        cout << i;
        if (i != n)
        {
            cout << ", ";
        }
    }
    cout << endl;
    return 0;
}
```

## Hints

- Which values does `i` take with `i < n` when `n` is 5? Is 5 one of them?
- The comma must be printed after every number **except** the last one. For which value of `i` must `if ( … )` be FALSE?

## Explanation

**Bug 1: the loop stops one number too early.** With `i < n`, the check `5 < 5` is FALSE, so 5 is never printed. The numbers 1 to `n` need `i <= n` (or `i < n + 1`). This is the classic off-by-one error.

**Bug 2: the comma condition is always TRUE.** Every `i` inside the loop is at most `n`, so `i <= n` never stops a comma, and the last number gets one too. The comma belongs after every number except the last, so the condition must be FALSE only when `i` is `n`: `i < n` (or `i != n`).

Why fixing one bug is not enough:

| Header | Comma check | Output for 5 |
|---|---|---|
| `i < n` | `i <= n` | `1, 2, 3, 4, ` |
| `i < n` | `i < n` | `1, 2, 3, 4, ` (no difference: 5 is never reached) |
| `i <= n` | `i <= n` | `1, 2, 3, 4, 5, ` |
| `i <= n` | `i < n` | `1, 2, 3, 4, 5` |

The test with `1` is a good edge case: the loop runs once and must print `1` with no comma at all.
