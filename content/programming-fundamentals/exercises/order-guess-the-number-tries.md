---
slug: order-guess-the-number-tries
type: correct_code
ask: order
title: Put the guessing game in order
lesson: do-while-and-choosing-a-loop
difficulty: medium
updated: 2026-10-10
---

## Question

In a guessing game the secret number is 7. The program keeps asking for a guess until the player types 7, then prints how many tries it took. Move the mixed-up lines into the right order.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int guess;
    int tries = 0;
    // [order]
    do
    {
        cout << "Guess: ";
        cin >> guess;
        tries++;
    }
    while (guess != 7);
    cout << "Tries: " << tries << endl;
    // [/order]
    return 0;
}
```

## Expected behavior

The program prints `Guess: ` and reads a number, and repeats this until the number is 7. Then it prints `Tries: ` followed by how many guesses were typed, the 7 included.

## Tests

### right on the third try

```input
3
9
7
```

```output
Guess: Guess: Guess: Tries: 3
```

### right the first time

```input
7
```

```output
Guess: Tries: 1
```

### five tries

```input
1
2
3
4
7
```

```output
Guess: Guess: Guess: Guess: Guess: Tries: 5
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int guess;
    int tries = 0;
    do
    {
        tries++;
        cout << "Guess: ";
        cin >> guess;
    }
    while (guess != 7);
    cout << "Tries: " << tries << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int guess;
    int tries = 0;
    do
    {
        cout << "Guess: ";
        tries++;
        cin >> guess;
    }
    while (guess != 7);
    cout << "Tries: " << tries << endl;
    return 0;
}
```

## Hints

- A do-while starts with `do` and ends with `while (condition);`.
- The guess has to be read before it can be checked.

## Explanation

The shape of a do-while loop is: `do`, the body in braces, then `while (condition);`.

1. `do` opens the loop. There is no check yet, so the player is always asked at least once.
2. `{` opens the body.
3. `cout << "Guess: ";` asks.
4. `cin >> guess;` reads the guess.
5. `tries++;` counts this try.
6. `}` closes the body.
7. `while (guess != 7);` checks the guess **after** it was read: if it is not 7, ask again.
8. `cout << "Tries: " ...` runs once, after the right guess.

The prompt must come before the `cin`, and the `while` line must come after the body. Only `tries++;` can move: it counts one try per pass wherever it sits inside the body, so it may also go first in the body or between the prompt and the `cin`. Outside the body it would count only once.
