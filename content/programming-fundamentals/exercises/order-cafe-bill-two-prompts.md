---
slug: order-cafe-bill-two-prompts
type: correct_code
ask: order
title: Put the café bill program in order
lesson: input-and-output-with-cout-and-cin
difficulty: easy
updated: 2026-10-10
---

## Question

A café sells sandwiches for 30 pounds and juices for 15 pounds. The middle lines of this program are mixed up. Move them into the right order so the program asks for the number of sandwiches, then the number of juices, and prints the bill.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int sandwiches, juices;
    // [order]
    cout << "Sandwiches: ";
    cin >> sandwiches;
    cout << "Juices: ";
    cin >> juices;
    int bill = sandwiches * 30 + juices * 15;
    cout << "Bill: " << bill << " pounds" << endl;
    // [/order]
    return 0;
}
```

## Expected behavior

The program asks `Sandwiches: ` and reads the number of sandwiches, then asks `Juices: ` and reads the number of juices. It prints `Bill: ` followed by the total price and ` pounds`.

## Tests

### 2 sandwiches and 3 juices

```input
2
3
```

```output
Sandwiches: Juices: Bill: 105 pounds
```

### 1 sandwich and 4 juices

```input
1
4
```

```output
Sandwiches: Juices: Bill: 90 pounds
```

### no sandwiches and 2 juices

```input
0
2
```

```output
Sandwiches: Juices: Bill: 30 pounds
```

## Hints

- Each question (prompt) comes just before the `cin` that reads its answer.
- The bill can only be worked out after both numbers have been read.

## Explanation

The program follows input, processing, output, and every prompt sits right before its own `cin`:

1. `cout << "Sandwiches: ";` asks the first question.
2. `cin >> sandwiches;` reads the answer to that question.
3. `cout << "Juices: ";` asks the second question.
4. `cin >> juices;` reads that answer.
5. `int bill = sandwiches * 30 + juices * 15;` works out the bill, now that both numbers are known.
6. The last `cout` prints the bill.

Watch out for two traps:

- If you read `juices` first, the numbers go into the wrong boxes. With the input 2 and 3 the bill becomes 3 × 30 + 2 × 15 = 120 instead of 105.
- If you print both prompts first and then read both values, the user sees two questions at once and doesn't know what to type first. Keep each prompt next to its `cin`.

(The tests above don't show what the user typed, because typed input isn't printed by the program. That is why the prompts and the bill appear on one line.)
