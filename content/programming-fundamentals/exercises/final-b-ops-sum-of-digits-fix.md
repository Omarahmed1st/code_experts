---
slug: final-b-ops-sum-of-digits-fix
type: correct_code
title: Fix the sum of three digits
lesson: operators
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This program reads a three-digit number and should print the sum of its digits. For `472` the digits are 4, 7 and 2, so it should print `Sum of digits = 13`. It prints `Sum of digits = 126` instead. **Two** of the three digit lines use the wrong operator. Find them and fix the program.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    int ones = n / 10;
    int tens = (n / 10) % 10;
    int hundreds = n % 100;
    cout << "Sum of digits = " << ones + tens + hundreds << endl;
    return 0;
}
```

## Expected behavior

The user types a whole number from 100 to 999. The program prints `Sum of digits = ` followed by the sum of its three digits. For `472` it prints `Sum of digits = 13`.

## Tests

### 472

```input
472
```

```output
Sum of digits = 13
```

### 905

```input
905
```

```output
Sum of digits = 14
```

### 111

```input
111
```

```output
Sum of digits = 3
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    int ones = n % 10;
    int tens = (n / 10) % 10;
    int hundreds = n / 100;
    cout << "Sum of digits = " << ones + tens + hundreds << endl;
    return 0;
}
```

## Hints

- Divide 472 by 10. What is the whole part, and what is left over? Which of the two is the last digit?
- How many whole hundreds are in 472? Which operator gives that?

## Explanation

When you divide a number by 10, the **remainder** is its last digit and the whole part is everything else: `472 / 10` is 47 and `472 % 10` is 2.

- `ones` must be the remainder, `n % 10` (2). The program used `n / 10`, which gives 47.
- `tens` is correct: `n / 10` is 47, and `47 % 10` is 7.
- `hundreds` must be how many whole hundreds fit, `n / 100` (4). The program used `n % 100`, which is what is left over after the hundreds: 72.

That is why it printed `47 + 7 + 72 = 126`. With `%` and `/` in the right places, it adds `2 + 7 + 4 = 13`.
