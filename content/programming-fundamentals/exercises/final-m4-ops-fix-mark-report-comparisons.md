---
slug: final-m4-ops-fix-mark-report-comparisons
type: correct_code
title: Fix the 1-and-0 mark report
lesson: operators
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This program reads a mark out of 100 and answers three questions with `1` (TRUE) or `0` (FALSE): did the student pass (50 or more)? Is it a full mark (exactly 100)? Is the mark even? For `73` it should print `Passed: 1`, `Full mark: 0` and `Even: 0`.

The compiler refuses the program, and once that is fixed, it still prints wrong answers. There are **two** bugs, on two different lines. Fix them without changing the numbers or the comparisons the programmer chose (`>= 50`, `100`, `% 2 == 0`).

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    cin >> mark;
    cout << "Passed: " << mark >= 50 << endl;
    cout << "Full mark: " << (mark = 100) << endl;
    cout << "Even: " << (mark % 2 == 0) << endl;
    return 0;
}
```

## Expected behavior

The user types a whole-number mark. The program prints three lines: `Passed: ` and `1` if the mark is 50 or more (otherwise `0`), `Full mark: ` and `1` if the mark is exactly 100 (otherwise `0`), and `Even: ` and `1` if the mark is even (otherwise `0`).

## Tests

### a mark of 73

```input
73
```

```output
Passed: 1
Full mark: 0
Even: 0
```

### a full mark

```input
100
```

```output
Passed: 1
Full mark: 1
Even: 1
```

### a mark of 48

```input
48
```

```output
Passed: 0
Full mark: 0
Even: 1
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    cin >> mark;
    cout << "Passed: " << (mark >= 50) << endl;
    cout << "Full mark: " << (mark == 100) << endl;
    cout << "Even: " << (mark % 2 == 0) << endl;
    return 0;
}
```

## Hints

- The lecture says the brackets are **needed** around a comparison inside `cout`. Which comparison has none?
- After you fix the first bug, run it with `73`. Why does it print `Full mark: 100` and `Even: 1`? What does a single `=` do to `mark`?

## Explanation

**Bug 1: a comparison without brackets (line 7).** Inside a `cout` line, `<<` is worked out **before** `>=`. So C++ reads `cout << "Passed: " << mark >= 50 << endl` as "print `Passed: ` and `mark`" `>=` "`50 << endl`", which makes no sense, and the compiler stops with an error. With brackets, `(mark >= 50)` is worked out first and its answer, 1 or 0, is printed. That is why the lecture always writes a comparison inside `cout` in brackets.

**Bug 2: `=` instead of `==` (line 8).** `(mark = 100)` doesn't compare: it **stores** 100 in `mark`, and the value printed is that 100. Worse, `mark` really is 100 afterwards, so line 9 tests 100 instead of the typed mark and always prints `Even: 1`. With `(mark == 100)`, line 8 only asks the question, prints `1` or `0`, and leaves `mark` unchanged.

After both fixes, `73` gives `Passed: 1` (73 ≥ 50), `Full mark: 0` (73 is not 100) and `Even: 0` (73 % 2 is 1).
