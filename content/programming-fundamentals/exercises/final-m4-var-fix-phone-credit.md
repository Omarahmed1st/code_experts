---
slug: final-m4-var-fix-phone-credit
type: correct_code
title: Fix the phone credit recharge
lesson: variables-named-boxes-in-memory
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A phone company gives a bonus when you recharge: 10% of the recharge, in whole pounds. This program reads the credit on the phone and the recharge amount. It should print the bonus and the new credit. For a credit of `15` and a recharge of `50` it should print `Bonus: 5` and `Credit: 70`, but it prints `Bonus: 6` and `Credit: 21`.

There is **one** bug, on **one** line, and it causes both wrong numbers. Fix it by changing that line only. Do not change the line that calculates `bonus`, and do not add a new variable.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int credit, recharge;
    cin >> credit >> recharge;
    recharge = credit + recharge;
    int bonus = recharge / 10;
    credit = credit + bonus;
    cout << "Bonus: " << bonus << endl;
    cout << "Credit: " << credit << endl;
    return 0;
}
```

## Expected behavior

The user types the credit and the recharge, both whole numbers of pounds. The bonus is the recharge divided by 10 (whole pounds). The new credit is the old credit plus the recharge plus the bonus. The program prints `Bonus: ` and the bonus, then `Credit: ` and the new credit.

## Tests

### credit 15, recharge 50

```input
15 50
```

```output
Bonus: 5
Credit: 70
```

### an empty phone

```input
0 100
```

```output
Bonus: 10
Credit: 110
```

### credit 40, recharge 25

```input
40 25
```

```output
Bonus: 2
Credit: 67
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int credit, recharge;
    cin >> credit >> recharge;
    credit = credit + recharge;
    int bonus = recharge / 10;
    credit = credit + bonus;
    cout << "Bonus: " << bonus << endl;
    cout << "Credit: " << credit << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int credit, recharge;
    cin >> credit >> recharge;
    credit = recharge + credit;
    int bonus = recharge / 10;
    credit = credit + bonus;
    cout << "Bonus: " << bonus << endl;
    cout << "Credit: " << credit << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int credit, recharge;
    cin >> credit >> recharge;
    credit += recharge;
    int bonus = recharge / 10;
    credit = credit + bonus;
    cout << "Bonus: " << bonus << endl;
    cout << "Credit: " << credit << endl;
    return 0;
}
```

## Hints

- Trace the program with `15 50`. After line 7, which box holds 65?
- `=` stores the value on the right in the variable on the **left**. Which box should receive the sum?

## Explanation

`=` works right to left: it works out the right side, then stores the result in the variable on the **left**. Line 7 adds the credit and the recharge correctly, but stores the sum in the wrong box:

- `recharge = credit + recharge;` puts 65 into `recharge`. The real recharge, 50, is gone, so line 8 calculates the bonus from 65 and gets 6.
- `credit` was never updated, so line 9 adds the bonus to the **old** credit: 15 + 6 = 21.

The fix is to store the sum in `credit`: `credit = credit + recharge;` (or `credit += recharge;`). Now `recharge` keeps 50, the bonus is 50 / 10 = 5, and the credit becomes 15 + 50 = 65, then 65 + 5 = 70.

One wrong name on the left of `=` caused two wrong results: it overwrote a value that was still needed, and it left the right box unchanged.
