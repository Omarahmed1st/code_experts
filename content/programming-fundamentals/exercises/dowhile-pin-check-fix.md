---
slug: dowhile-pin-check-fix
type: correct_code
title: Fix the PIN check
lesson: do-while-and-choosing-a-loop
difficulty: medium
updated: 2026-10-10
---

## Question

This program should keep asking for the PIN until the user types the right one, **1234**. When the user types a wrong PIN first, the program lets them in anyway. Find the bug and fix it.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int pin;
    do
    {
        cout << "Enter PIN: ";
        cin >> pin;
    }
    while (pin == 1234);
    cout << "Welcome!" << endl;
    return 0;
}
```

## Expected behavior

The program prints `Enter PIN: ` and reads a number. It asks again, as many times as needed, while the number is not 1234. When the user types 1234, it prints `Welcome!`. For the input `1111` then `1234`, the output is `Enter PIN: Enter PIN: Welcome!` (the typed numbers are not part of the output).

## Tests

### one wrong PIN, then the right one

```input
1111
1234
```

```output
Enter PIN: Enter PIN: Welcome!
```

### the right PIN the first time

```input
1234
```

```output
Enter PIN: Welcome!
```

### two wrong PINs

```input
5
4321
1234
```

```output
Enter PIN: Enter PIN: Enter PIN: Welcome!
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int pin;
    do
    {
        cout << "Enter PIN: ";
        cin >> pin;
    }
    while (pin != 1234);
    cout << "Welcome!" << endl;
    return 0;
}
```

## Hints

- The loop repeats while its condition is TRUE. When should it ask **again**: when the PIN is right, or when it is wrong?
- Trace it with the input 1111: is `1111 == 1234` true or false?

## Explanation

A `do-while` loop repeats **while** its condition is TRUE. Here it should ask again while the PIN is **wrong**, so the condition must be `pin != 1234` (not equal).

The broken condition `pin == 1234` does the opposite. When the user types 1111, `1111 == 1234` is false, so the loop stops and prints `Welcome!` with a wrong PIN. (And if the user typed 1234 first, it would ask again for no reason.)

A do-while is the right loop here: the PIN must be asked for at least once before the program can check it. Read the condition aloud as "repeat while …" to check that it says what you mean.
