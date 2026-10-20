---
slug: final-if-fix-ticket-price
type: correct_code
title: Fix the cinema ticket price
lesson: decisions-if-then-else
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A cinema ticket costs 75 pounds. Children aged **12 or younger** pay **half** price. This program reads an age and prints the type of ticket and its price. It has **two** bugs. Find them and fix the program.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int age;
    int price = 75;
    cin >> age;
    if (age < 12)
    {
        cout << "Child" << endl;
        price = price / 2;
    }
    else
    {
        cout << "Adult" << endl;
    }
    cout << "Price: " << price << endl;
    return 0;
}
```

## Expected behavior

The user types an age (a whole number). For an age of 12 or less, the program prints `Child`, then `Price: 37.5`. For any other age it prints `Adult`, then `Price: 75`.

## Tests

### a child of exactly 12

```input
12
```

```output
Child
Price: 37.5
```

### a young child

```input
5
```

```output
Child
Price: 37.5
```

### an adult

```input
30
```

```output
Adult
Price: 75
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int age;
    float price = 75;
    cin >> age;
    if (age <= 12)
    {
        cout << "Child" << endl;
        price = price / 2;
    }
    else
    {
        cout << "Adult" << endl;
    }
    cout << "Price: " << price << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int age;
    double price = 75;
    cin >> age;
    if (age <= 12)
    {
        cout << "Child" << endl;
        price = price / 2;
    }
    else
    {
        cout << "Adult" << endl;
    }
    cout << "Price: " << price << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int age;
    float price = 75;
    cin >> age;
    if (age < 13)
    {
        cout << "Child" << endl;
        price = price / 2;
    }
    else
    {
        cout << "Adult" << endl;
    }
    cout << "Price: " << price << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int age;
    double price = 75;
    cin >> age;
    if (age < 13)
    {
        cout << "Child" << endl;
        price = price / 2;
    }
    else
    {
        cout << "Adult" << endl;
    }
    cout << "Price: " << price << endl;
    return 0;
}
```

## Hints

- Test the boundary: is a 12-year-old a child? Try `12 < 12`.
- Half of 75 is 37.5. Can an `int` box hold 37.5?

## Explanation

1. **The boundary is wrong.** "12 or younger" includes 12, so the condition must be `age <= 12` (or `age < 13`, since ages are whole numbers). With `age < 12`, the check `12 < 12` is FALSE, so a 12-year-old gets an adult ticket.
2. **The price has the wrong data type.** Half of 75 is 37.5, but `price` is an `int`. `price / 2` is int / int, so it gives 37, and an `int` couldn't hold 37.5 anyway. Declare `price` as `float` (or `double`); then `price / 2` is float / int and keeps the decimal part.

The first bug only shows with the test age 12, and the second only on the child path. That is why good tests include the boundary value and every path of the decision.
