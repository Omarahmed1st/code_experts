---
slug: decisions-if-then-else
title: "Decisions: IF … THEN … ELSE"
topic: conditional-statements
lecture: 3
difficulty: easy
description: Let an algorithm choose between two paths. Three worked examples, pass or fail, the larger of two numbers, and even or odd, each as steps, a flowchart, pseudocode and C++.
objectives:
  - Write a decision as steps, a flowchart and IF … THEN … ELSE … END IF
  - Test a decision with boundary cases such as a mark of exactly 50
  - Use % to decide whether a number is even or odd
  - Translate IF … THEN … ELSE into C++ if and else
prerequisites:
  - "Flowcharts: one problem, three representations"
  - "Operators: calculate, store and compare"
related:
  - flowcharts
  - loops-and-the-while-loop-in-pseudocode
updated: 2026-10-09
---

## [example] Worked example: pass or fail

**Problem:** read a student's mark. If the mark is greater than or equal to 50, display PASS. Otherwise, display FAIL.

| Question | Answer |
|---|---|
| What is the input? | Mark |
| What is processed? | compare the mark with 50 |
| What is the decision? | Mark >= 50 ? |
| What is the output? | PASS or FAIL |

**Test cases:** mark = 72 gives PASS, mark = 50 gives PASS, mark = 41 gives FAIL.

Is 50 a pass? **Yes:** `50 >= 50` is TRUE. The `=` in `>=` includes the boundary. Always test the boundary value; it is where most decision bugs hide.

**As plain steps:**

1. Start.
2. Read Mark.
3. Check if Mark >= 50.
4. If true, display PASS.
5. Otherwise, display FAIL.
6. End.

Only **one** of step 4 or step 5 runs each time, never both.

## [diagram] Pass or fail as a flowchart

Trace both paths with your finger: mark = 72 goes left (YES), mark = 41 goes right (NO). Both paths meet again before End.

![A flowchart: Start, Input Mark, then the diamond Mark >= 50?. YES on the left leads to Print "PASS", NO on the right leads to Print "FAIL", and both paths join before End](images/pass-or-fail.png)

## [code] Pass or fail in pseudocode

`IF` starts the decision and checks the condition, `THEN` is the path when it is TRUE, `ELSE` is the path when it is FALSE, and `END IF` closes it. Indent the lines inside each path so the two paths are easy to see. The mark typed was `50`, the boundary.

```pseudocode program
BEGIN
    INPUT mark
    IF mark >= 50 THEN
        PRINT "PASS"
    ELSE
        PRINT "FAIL"
    END IF
END
```

```input
50
```

```output
50
PASS
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int mark;
    cin >> mark;
    if (mark >= 50)
        cout << "PASS" << endl;
    else
        cout << "FAIL" << endl;
    return 0;
}
```

```notes
3 | IF | starts the decision | circle yel
3 | mark >= 50 | 50 >= 50 is TRUE | square green
5 | ELSE | the FALSE path | tri coral
7 | END IF | closes the decision | diamond sky
```

## [code] Pass or fail in C++

The C++ version has the same shape. `IF … THEN` becomes `if ( )` with the condition in brackets, each path goes inside curly braces `{ }`, and `ELSE` becomes `else`. This time the mark typed was `41`.

```cpp program run
#include <iostream>
using namespace std;

int main()
{
    int mark;
    cout << "Enter mark: ";
    cin >> mark;
    if (mark >= 50)
    {
        cout << "PASS" << endl;
    }
    else
    {
        cout << "FAIL" << endl;
    }
    return 0;
}
```

```input
41
```

```output
Enter mark: 41
FAIL
```

```notes
9 | if (mark >= 50) | IF mark >= 50 THEN | circle yel
10 | { | the TRUE path starts | square green
13 | else | ELSE | tri coral
16 | } | END IF | diamond sky
```

## [example] Worked example: find the larger number

**Problem:** read two numbers A and B. Display the larger number.

- **Input:** A, B
- **Decision:** A > B ?
- **Output:** the larger number

**Example run:** A = 17, B = 42. `17 > 42` is FALSE, so B is printed: `42`.

**Think deeper:** what if A = B? Then `A > B` is FALSE, so B is printed. That is still correct, because both values are equal.

## [diagram] Larger number as a flowchart

Every decision has exactly two exits: YES and NO.

![A flowchart: Start, Input A, B, then the diamond A > B?. YES leads to Print A, NO leads to Print B, and both paths join before End](images/larger-number.png)

## [code] Larger number in C++

The user typed `17 42` on one line.

```cpp program run
#include <iostream>
using namespace std;

int main()
{
    int A, B;
    cout << "Enter A and B: ";
    cin >> A >> B;
    if (A > B)
    {
        cout << "Larger: " << A << endl;
    }
    else
    {
        cout << "Larger: " << B << endl;
    }
    return 0;
}
```

```input
17 42
```

```output
Enter A and B: 17 42
Larger: 42
```

```notes
9 | A > B | 17 > 42 is FALSE | square yel
15 | B | so B is printed | tri green
```

## [example] Worked example: even or odd

**Problem:** read an integer N. Decide whether it is even or odd.

- **Input:** N
- **Processing:** N % 2
- **Output:** EVEN or ODD

**Key idea:** `%` gives the remainder after dividing by 2. Group the items in pairs: if every item has a partner, the remainder is 0 and the number is even. If one item is left over, the remainder is 1 and the number is odd.

- N = 8: `8 % 2 = 0`, so EVEN.
- N = 7: `7 % 2 = 1`, so ODD.

## [diagram] Even or odd as a flowchart

The only new idea is the condition `N % 2 == 0`. Note the `==`: it compares, while `←` stores.

![A flowchart: Start, Input N, then the diamond N % 2 == 0?. YES leads to Print "EVEN", NO leads to Print "ODD", and both paths join before End](images/even-or-odd.png)

## [code] Even or odd in pseudocode

The user typed `7`.

```pseudocode program
BEGIN
    INPUT N
    IF N % 2 == 0 THEN
        PRINT "EVEN"
    ELSE
        PRINT "ODD"
    END IF
END
```

```input
7
```

```output
7
ODD
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    if (n % 2 == 0)
        cout << "EVEN" << endl;
    else
        cout << "ODD" << endl;
    return 0;
}
```

```notes
3 | N % 2 | the remainder: 7 % 2 is 1 | circle sky
3 | == 0 | compare, don't store | square yel
6 | PRINT "ODD" | 1 == 0 is FALSE | tri coral
```

## [common_mistakes] = instead of == in a condition

This program should print FAIL, because the mark is 30. But the condition says `mark = 50`, with **one** `=`. That **stores** 50 in `mark` instead of comparing, and a value that isn't 0 counts as TRUE. So it prints PASS, and `mark` is now 50.

With warnings turned on, g++ notices and suggests brackets, which is its way of asking "did you mean `==`?".

```cpp program run
#include <iostream>
using namespace std;

int main()
{
    int mark = 30;
    if (mark = 50)
    {
        cout << "PASS" << endl;
    }
    else
    {
        cout << "FAIL" << endl;
    }
    cout << "mark is now " << mark << endl;
    return 0;
}
```

```output
PASS
mark is now 50
```

```notes
7 | mark = 50 | stores 50! use == | tri coral
15 | mark | changed to 50 | circle coral
```

## [note] Check yourself

::: check What does this print when N is 0?
```cpp
int N = 0;
if (N % 2 == 0)
{
    cout << "EVEN" << endl;
}
else
{
    cout << "ODD" << endl;
}
```
???
```output
EVEN
```
`0 % 2` is 0 (nothing is left over), so 0 is even.
:::

::: check With the condition `mark > 50` instead of `mark >= 50`, which test case gives the wrong answer: 72, 50 or 41?
???
50. With `>`, `50 > 50` is FALSE, so a mark of exactly 50 would FAIL. That is why the boundary is always one of your test cases.
:::

## [key_takeaways] Key takeaways

- A decision makes two possible paths. Only one of them runs each time.
- In a flowchart, a decision is a diamond with exactly two exits, and the paths join again before End.
- Pseudocode: `IF condition THEN … ELSE … END IF`. C++: `if (condition) { … } else { … }`.
- Test the boundary: with `>=`, the boundary value is included.
- `N % 2 == 0` means N is even. Use `==` to compare; `=` stores.
