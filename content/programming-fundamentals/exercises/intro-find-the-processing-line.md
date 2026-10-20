---
slug: intro-find-the-processing-line
type: mcq
title: Which line does the processing?
lesson: what-is-programming
difficulty: medium
updated: 2026-10-10
---

## Question

This program reads the price of a sandwich and the price of a drink, and prints the total. Which line is the **processing** part?

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int sandwich, drink;
    cout << "Enter two prices: ";
    cin >> sandwich >> drink;
    int total = sandwich + drink;
    cout << "Total = " << total << endl;
    return 0;
}
```

## Options

- [ ] `cin >> sandwich >> drink;`
  This line reads the two prices the user types. It is the **input**.
- [x] `int total = sandwich + drink;`
  Right: this line works on the input (it adds the two prices) to make the result.
- [ ] `cout << "Total = " << total << endl;`
  This line shows the result on the screen. It is the **output**.
- [ ] `cout << "Enter two prices: ";`
  This line only prints a message asking the user to type. It does not calculate anything.

## Hints

- Find the line that reads values, and the line that shows the result. What is left in the middle?
- Processing usually means a calculation.

## Explanation

The program has the same three parts as every program. `cin >> sandwich >> drink;` is the **input**: it reads two numbers. `int total = sandwich + drink;` is the **processing**: it adds them. `cout << "Total = " << total << endl;` is the **output**: it shows the result.

The three parts also run in this order: the program can't add the prices before it has read them, and it can't print the total before it has worked it out.
