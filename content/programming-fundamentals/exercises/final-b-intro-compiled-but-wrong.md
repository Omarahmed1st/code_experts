---
slug: final-b-intro-compiled-but-wrong
type: mcq
title: It compiled, but the total is wrong
lesson: what-is-programming
difficulty: medium
reserved: true
multiple: true
updated: 2026-10-10
---

## Question

This program should read the price of one notebook and the number of notebooks, and print the total cost. The compiler shows **no errors** and the program runs. The user types `20 3`, and the program prints `Total = 23` instead of `Total = 60`.

Which statements are **true**? Pick **all** the true ones.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int price, quantity;
    cin >> price >> quantity;
    int total = price + quantity;
    cout << "Total = " << total << endl;
    return 0;
}
```

## Options

- [x] Compiling with no errors does not prove that the program is correct.
  True: the compiler only stops when the code itself is wrong. It translated this code without complaint, but the steps it was given are the wrong steps.
- [x] The mistake is in the processing step, line 7.
  True: the input (line 6) and the output (line 8) work. Line 7 adds the two numbers when it should multiply them: `price * quantity`.
- [ ] The CPU ran the text in `main.cpp` directly, so the compiler never saw the mistake.
  False: the CPU can't read C++. The compiler translated `main.cpp` into machine code first, and the CPU ran that machine code.
- [ ] The mistake is in the input: `cin` should read `quantity` before `price`.
  False: the order doesn't matter for the answer here. Even with the two values swapped, `3 + 20` is still 23. The problem is the `+`.

## Hints

- What does the compiler check, and what does it stop for? Did it stop here?
- Name the input, processing and output lines. Which one gives 23 for `20 3`?

## Explanation

A program goes through the stages understand, design, write, and **test and improve**. This mistake was only found in the last stage, by running the program with values we can check by hand: 3 notebooks at 20 pounds should cost 60.

The compiler checks the code and translates it into machine code; the CPU then runs that machine code. Here the code is valid C++, so nothing stopped it. But the plan behind line 7 is wrong: the processing step adds instead of multiplying. The computer does exactly what the steps say, so it prints 23. That is why "it compiles" never means "it is correct". Fixing line 7 to `int total = price * quantity;` gives `Total = 60`.
