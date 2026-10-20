---
slug: final-m3-intro-missing-semicolon-nothing-runs
type: mcq
title: A missing semicolon on line 7
lesson: what-is-programming
difficulty: hard
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

A student types this program in `main.cpp` and clicks **Run**. Line 7 has no semicolon at the end. Lines 1 to 6 are all correct.

Which statements are **true**? Pick **all** the true ones.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int minutes = 90;
    cout << "Start" << endl;
    int hours = minutes / 60
    cout << "Hours: " << hours << endl;
    return 0;
}
```

## Options

- [x] Nothing is printed at all, not even `Start`.
  Right: the compiler stops with an error, so no machine code is made and the CPU never runs a single line, not even line 6.
- [x] The mistake is found before the program runs, while the source code is being translated into machine code.
  Right: checking the code and translating it is the compiler's job, and it happens before the run step.
- [ ] `Start` is printed first, and then the program stops with an error when it reaches line 7.
  The CPU does not read C++ line by line. It can only run machine code, and the compiler refuses to make any while the code has an error. So line 6 never runs either.
- [ ] The compiler adds the missing `;` by itself, so the program prints `Start` and `Hours: 1`.
  The compiler checks and translates; it never fixes your code. It shows an error and stops, and you must add the `;` yourself.

## Hints

- Remember the three steps: write, compile, run. Which step finds a missing `;`?
- Can the CPU run C++ source code directly?

## Explanation

A C++ program goes through three steps: **write** the source code, **compile** it into machine code, then **run** the machine code on the CPU.

The missing `;` on line 7 is found in the **compile** step. The compiler stops and shows an error, so no machine code is made. Without machine code there is nothing for the CPU to run, so **nothing** is printed, not even `Start` from line 6, even though line 6 itself is correct.

The compiler does not guess what you meant or fix the mistake for you. You add the `;`, compile again, and only then does the program run and print `Start` and `Hours: 1`.
