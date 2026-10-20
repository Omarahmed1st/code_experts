---
slug: final-m4-io-fix-date-with-slashes
type: correct_code
title: Fix the date on the certificate
lesson: input-and-output-with-cout-and-cin
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A school prints the date on a certificate. The user types the day, the month and the year as three whole numbers, for example `15 3 2025`. The program should print `Date: 15/3/2025` and, on the next line, `Next year: 2026`. Instead it prints `Date: 0` and `Next year: year + 1`.

Both output lines have a bug about what belongs **inside** the quotes and what belongs **outside**. Fix the two `cout` lines. Keep the labels `Date: ` and `Next year: `, and don't add a new variable.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int day, month, year;
    cin >> day >> month >> year;
    cout << "Date: " << day / month / year << endl;
    cout << "Next year: " << "year + 1" << endl;
    return 0;
}
```

## Expected behavior

The user types three whole numbers: day, month, year. The program prints `Date: ` followed by the day, a `/`, the month, a `/` and the year, with no spaces. On the next line it prints `Next year: ` followed by the year plus 1.

## Tests

### 15 March 2025

```input
15 3 2025
```

```output
Date: 15/3/2025
Next year: 2026
```

### the first day of 2000

```input
1 1 2000
```

```output
Date: 1/1/2000
Next year: 2001
```

### the last day of 1999

```input
31 12 1999
```

```output
Date: 31/12/1999
Next year: 2000
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int day, month, year;
    cin >> day >> month >> year;
    cout << "Date: " << day << "/" << month << "/" << year << endl;
    cout << "Next year: " << year + 1 << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int day, month, year;
    cin >> day >> month >> year;
    cout << "Date: " << day << '/' << month << '/' << year << endl;
    cout << "Next year: " << year + 1 << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int day, month, year;
    cin >> day >> month >> year;
    cout << "Date: " << day << "/" << month << "/" << year << endl;
    cout << "Next year: " << (year + 1) << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int day, month, year;
    cin >> day >> month >> year;
    cout << "Date: " << day << '/' << month << '/' << year << endl;
    cout << "Next year: " << (year + 1) << endl;
    return 0;
}
```

## Hints

- Outside quotes, `/` is the division operator. What is `15 / 3 / 2025` with `int` values?
- Inside quotes, everything is printed exactly as written, even a name or a `+`.

## Explanation

`cout` prints two kinds of things, and the quotes decide which is which:

- **Text in quotes** is printed exactly as written. C++ doesn't look inside it.
- **Code outside quotes** (names, numbers, operators) is worked out first, and its **value** is printed.

**Line 7** has the slashes outside the quotes, so they are division: `15 / 3` is 5, and `5 / 2025` (int / int) is 0. The program prints `Date: 0`. The slashes are meant to be printed, so each one must be text: `day << "/" << month << "/" << year`. (A single character in single quotes, `'/'`, works too.)

**Line 8** has the opposite problem: `"year + 1"` is in quotes, so it is printed as the text `year + 1`. The calculation must be outside the quotes: `<< year + 1 <<`. Then C++ works out 2025 + 1 and prints 2026.
