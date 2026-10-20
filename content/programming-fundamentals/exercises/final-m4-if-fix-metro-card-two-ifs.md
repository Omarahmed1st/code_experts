---
slug: final-m4-if-fix-metro-card-two-ifs
type: correct_code
title: Fix the metro card gate
lesson: decisions-if-then-else
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A metro trip costs 10 pounds. The gate reads the balance on a card. If the balance is 10 or more, it takes the fare off and prints `Trip OK`; otherwise it prints `Recharge first`. Then it prints the balance. Exactly **one** of the two messages must appear.

The programmer tested it with a balance of `25` and `6`, and both tests were right. But for a balance of `14` it prints **both** messages. Find the bug and fix it. Don't add a new variable, and keep the fare line `balance = balance - 10;` as it is.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int balance;
    cin >> balance;
    if (balance >= 10)
    {
        balance = balance - 10;
        cout << "Trip OK" << endl;
    }
    if (balance < 10)
    {
        cout << "Recharge first" << endl;
    }
    cout << "Balance: " << balance << endl;
    return 0;
}
```

## Expected behavior

The user types the balance (whole pounds). If it is 10 or more, the program prints `Trip OK` and the balance after paying 10. Otherwise it prints `Recharge first` and the unchanged balance. The balance line is `Balance: ` followed by the number.

## Tests

### plenty of credit

```input
25
```

```output
Trip OK
Balance: 15
```

### enough for one trip only

```input
14
```

```output
Trip OK
Balance: 4
```

### exactly the fare

```input
10
```

```output
Trip OK
Balance: 0
```

### not enough

```input
6
```

```output
Recharge first
Balance: 6
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int balance;
    cin >> balance;
    if (balance >= 10)
    {
        balance = balance - 10;
        cout << "Trip OK" << endl;
    }
    else
    {
        cout << "Recharge first" << endl;
    }
    cout << "Balance: " << balance << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int balance;
    cin >> balance;
    if (balance < 10)
    {
        cout << "Recharge first" << endl;
    }
    if (balance >= 10)
    {
        balance = balance - 10;
        cout << "Trip OK" << endl;
    }
    cout << "Balance: " << balance << endl;
    return 0;
}
```

## Hints

- Trace the program with `14`. What is `balance` when the second `if` checks it?
- Two separate `if` statements are both checked. Which keyword makes the two paths exclude each other?

## Explanation

The program uses two **separate** `if` statements, so both conditions are checked, one after the other. And the first one **changes** `balance` before the second one looks at it:

- For `14`: `14 >= 10` is TRUE, so 10 is taken off and `Trip OK` is printed. Now `balance` is 4, and the second check `4 < 10` is also TRUE, so `Recharge first` is printed too.
- For `25` the new balance is 15, and `15 < 10` is FALSE, so the bug stays hidden. For `6` the first check is FALSE and nothing changes. That is why those two tests passed.

The fix is to make it one decision with two paths: replace `if (balance < 10)` with `else`. An `if … else` checks its condition **once**, with the balance the card had at the start, and exactly one path runs.

(Putting the `balance < 10` check **first** also works, because then nothing has changed the balance yet when it is checked. But `if … else` says what we mean: one question, two possible answers.)
