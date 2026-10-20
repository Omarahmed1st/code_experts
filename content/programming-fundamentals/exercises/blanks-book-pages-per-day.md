---
slug: blanks-book-pages-per-day
type: correct_code
ask: blanks
title: Fill in the blanks to count reading days
lesson: while-loops-in-cpp
difficulty: medium
updated: 2026-10-10
---

## Question

Salma reads 25 pages of a book every day. The program reads the number of pages in the book and prints how many days she needs to finish it. Fill in the **three blanks**: the first is a comparison operator, the other two are short calculations.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int pages;
    cin >> pages;
    int pagesRead = 0;
    int days = 0;
    while (pagesRead ___ pages)
    {
        pagesRead = ___;
        days = ___;
    }
    cout << "Days: " << days << endl;
    return 0;
}
```

## Expected behavior

The user types the number of pages. Each day Salma reads 25 more pages. The program prints `Days: ` followed by the number of days until she has read the whole book. On the last day she may read fewer than 25 pages, but it still counts as a day.

## Tests

### 100 pages

```input
100
```

```output
Days: 4
```

### 110 pages

```input
110
```

```output
Days: 5
```

### 20 pages

```input
20
```

```output
Days: 1
```

### 25 pages

```input
25
```

```output
Days: 1
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int pages;
    cin >> pages;
    int pagesRead = 0;
    int days = 0;
    while (pagesRead < pages)
    {
        pagesRead = pagesRead + 25;
        days = days + 1;
    }
    cout << "Days: " << days << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int pages;
    cin >> pages;
    int pagesRead = 0;
    int days = 0;
    while (pagesRead < pages)
    {
        pagesRead = 25 + pagesRead;
        days = days + 1;
    }
    cout << "Days: " << days << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int pages;
    cin >> pages;
    int pagesRead = 0;
    int days = 0;
    while (pagesRead < pages)
    {
        pagesRead = pagesRead + 25;
        days = 1 + days;
    }
    cout << "Days: " << days << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int pages;
    cin >> pages;
    int pagesRead = 0;
    int days = 0;
    while (pagesRead < pages)
    {
        pagesRead = 25 + pagesRead;
        days = 1 + days;
    }
    cout << "Days: " << days << endl;
    return 0;
}
```

## Hints

- She keeps reading while she has read **fewer** pages than the book has.
- Each pass of the loop is one day: 25 more pages, and one more day.

## Explanation

1. `pagesRead < pages`: keep reading while some pages are still unread. With `<=`, a 100-page book would take 5 days, because the loop would run once more when `pagesRead` is exactly 100.
2. `pagesRead + 25` (or `25 + pagesRead`): 25 more pages each day.
3. `days + 1` (or `1 + days`): one more day each pass.

Trace for 110 pages:

| Day | pagesRead before | Check | pagesRead after |
|---|---|---|---|
| 1 | 0 | 0 < 110 TRUE | 25 |
| 2 | 25 | 25 < 110 TRUE | 50 |
| 3 | 50 | 50 < 110 TRUE | 75 |
| 4 | 75 | 75 < 110 TRUE | 100 |
| 5 | 100 | 100 < 110 TRUE | 125 |
| | 125 | 125 < 110 FALSE | |

The loop ran 5 times, so `Days: 5`. On day 5 she only needed 10 pages, but it is still a day.
