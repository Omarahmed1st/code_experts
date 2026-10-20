---
slug: final-m3-io-fix-ticket-order-and-line
type: correct_code
title: Fix the tickets receipt
lesson: input-and-output-with-cout-and-cin
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

The user types the number of tickets (a whole number) and then the price of one ticket (it can have piastres), on one line, for example `3 7.5`. The program should print the receipt on **two** lines:

```output
3 tickets: 22.5 pounds
Thank you
```

Instead it prints `7 tickets: 21 poundsThank you`. The program has **two** bugs, both about input and output. Find them and fix the program. Keep `int tickets;` and `float price;` as they are, and don't change the text in quotes.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int tickets;
    float price;
    cin >> price >> tickets;
    cout << tickets << " tickets: " << tickets * price << " pounds";
    cout << "Thank you" << endl;
    return 0;
}
```

## Expected behavior

The user types the number of tickets and then the price of one ticket. The program prints `N tickets: T pounds` on the first line, where N is the number of tickets and T is the total cost, and `Thank you` on the second line.

## Tests

### the example

```input
3 7.5
```

```output
3 tickets: 22.5 pounds
Thank you
```

### whole pounds

```input
2 10
```

```output
2 tickets: 20 pounds
Thank you
```

### a price with piastres

```input
4 12.25
```

```output
4 tickets: 49 pounds
Thank you
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int tickets;
    float price;
    cin >> tickets >> price;
    cout << tickets << " tickets: " << tickets * price << " pounds" << endl;
    cout << "Thank you" << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int tickets;
    float price;
    cin >> tickets >> price;
    cout << tickets << " tickets: " << tickets * price << " pounds\n";
    cout << "Thank you" << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int tickets;
    float price;
    cin >> tickets >> price;
    cout << tickets << " tickets: " << tickets * price << " pounds" << "\n";
    cout << "Thank you" << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int tickets;
    float price;
    cin >> tickets >> price;
    cout << tickets << " tickets: " << tickets * price << " pounds";
    cout << endl << "Thank you" << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int tickets;
    float price;
    cin >> tickets >> price;
    cout << tickets << " tickets: " << tickets * price << " pounds";
    cout << "\nThank you" << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int tickets;
    float price;
    cin >> tickets;
    cin >> price;
    cout << tickets << " tickets: " << tickets * price << " pounds" << endl;
    cout << "Thank you" << endl;
    return 0;
}
```

## Hints

- `cin >>` fills the variables in the order they are written, from the values in the order they were typed. Which variable gets the 3?
- Which `cout` ends a line? Does line 8 end with `endl`?

## Explanation

1. **The values are read in the wrong order.** The user types the tickets first, but `cin >> price >> tickets;` puts the first value, 3, into `price`. Then `cin` reads the next value into the `int` `tickets`: an `int` can only take the whole-number part, so it reads `7` and stops at the `.`. That is where `7 tickets: 21` came from (7 × 3 = 21). The order in `cin` must match the order the user types: `cin >> tickets >> price;`.
2. **The first line never ends.** `cout` only starts a new line at `endl` or `\n`. Line 8 has neither, so `Thank you` is printed straight after `pounds` on the same line. Add `<< endl` at the end of line 8 (or put a `\n` before `Thank you`).
