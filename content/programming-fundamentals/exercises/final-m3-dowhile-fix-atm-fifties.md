---
slug: final-m3-dowhile-fix-atm-fifties
type: correct_code
title: Fix the ATM that only gives 50s
lesson: do-while-and-choosing-a-loop
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

An ATM only has 50-pound notes, so the amount to withdraw must be a **multiple of 50**. The program should ask for an amount, and keep asking until the user types a multiple of 50. Then it prints the amount and how many tries it took.

For `120 30 200` it should print `Withdraw: 200` and `Tries: 3`. Instead it prints `Withdraw: 0` and `Tries: 0` without reading anything. The program has **two** bugs: one in the choice of loop and one in the operator of the condition. Find them and fix the program. Keep `int amount = 0;` as it is.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int amount = 0;
    int tries = 0;
    while (amount / 50 != 0)
    {
        cin >> amount;
        tries++;
    }
    cout << "Withdraw: " << amount << endl;
    cout << "Tries: " << tries << endl;
    return 0;
}
```

## Expected behavior

The program reads whole-number amounts one by one. It stops at the first amount that is a multiple of 50 (it must read at least one amount). Then it prints `Withdraw: ` and that amount, and `Tries: ` and how many amounts were read, the last one included.

## Tests

### two wrong amounts first

```input
120 30 200
```

```output
Withdraw: 200
Tries: 3
```

### right the first time

```input
500
```

```output
Withdraw: 500
Tries: 1
```

### one wrong amount

```input
75 50
```

```output
Withdraw: 50
Tries: 2
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int amount = 0;
    int tries = 0;
    do
    {
        cin >> amount;
        tries++;
    }
    while (amount % 50 != 0);
    cout << "Withdraw: " << amount << endl;
    cout << "Tries: " << tries << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int amount = 0;
    int tries = 0;
    do
    {
        cin >> amount;
        tries++;
    }
    while (amount % 50 > 0);
    cout << "Withdraw: " << amount << endl;
    cout << "Tries: " << tries << endl;
    return 0;
}
```

## Hints

- `amount` starts at 0. Is 0 a multiple of 50? What does a `while` loop do when its condition is FALSE at the very start?
- Which operator tells you whether there is something left over after dividing by 50: `/` or `%`?

## Explanation

1. **The wrong loop.** `amount` starts at 0, so the condition is FALSE before the first pass: `0 / 50` is 0, and `0 != 0` is FALSE. (With the right operator it would be FALSE too, because 0 % 50 is also 0.) A `while` loop checks first, so its body runs **zero** times: nothing is read and the program prints `Withdraw: 0`. The user must always be asked at least once, which is exactly what a `do-while` loop guarantees: it runs the body first and checks afterwards. Write `do { … } while (condition);`, and don't forget the `;` at the end.
2. **The wrong operator.** `amount / 50` is how many whole 50s fit in the amount, not what is left over. For 30 it is 0, so the loop would accept 30, which is not a multiple of 50. The remainder is `amount % 50`: it is 0 exactly when the amount is a multiple of 50, so the loop must repeat **while** `amount % 50 != 0`.

The counter `tries` goes up once in every pass, and a `do-while` makes at least one pass, so it ends at 1 or more.
