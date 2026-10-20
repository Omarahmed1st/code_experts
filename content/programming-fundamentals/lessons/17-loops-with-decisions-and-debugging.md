---
slug: loops-with-decisions-and-debugging
title: "Loops with decisions, and debugging loops"
topic: debugging
lecture: 4
difficulty: medium
description: Put an if/else inside a for loop to control a fan from five temperature readings, then learn the six loop mistakes to check first and fix a loop that counts the wrong way.
objectives:
  - Combine a for loop with an if/else decision
  - Explain why the decision is made again on every repetition
  - Recognise six common loop mistakes and what each one causes
  - Trace a broken loop to find its bug
prerequisites:
  - "Do-while, and choosing the right loop"
  - "Decisions: IF … THEN … ELSE"
related:
  - for-loops
  - exam-results-processor
updated: 2026-10-09
---

## [code] Computer engineering example: a temperature sensor loop

Read the temperature 5 times. Above 30 → Fan ON. Otherwise → Fan OFF.

- The `for` loop repeats exactly 5 times.
- The `if / else` decision from Lecture 3, now in C++ syntax, decides every time.

In a real device the reading would come from a sensor instead of `cin`. Here the user typed 28, 31.5, 30, 35 and 22.

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    float temperature;
    for (int i = 1; i <= 5; i++)
    {
        cout << "Enter temperature: ";
        cin >> temperature;
        if (temperature > 30)
        {
            cout << "Fan ON" << endl;
        }
        else
        {
            cout << "Fan OFF" << endl;
        }
    }
    return 0;
}
```

```input
28
31.5
30
35
22
```

```output
Enter temperature: 28
Fan OFF
Enter temperature: 31.5
Fan ON
Enter temperature: 30
Fan OFF
Enter temperature: 35
Fan ON
Enter temperature: 22
Fan OFF
```

```notes
5 | float | 31.5 needs decimals | circle sky
6 | for (int i = 1; i <= 5; i++) | repeats 5 times | square yel
10 | temperature > 30 | decides every time | diamond yel
12 | "Fan ON" | TRUE path | circle green
16 | "Fan OFF" | FALSE path | tri coral
```

## [explanation] Walk through the readings

| Reading | `temperature > 30`? | Output |
|---|---|---|
| 28 | FALSE | Fan OFF |
| 31.5 | TRUE | Fan ON |
| 30 | FALSE | Fan OFF |
| 35 | TRUE | Fan ON |
| 22 | FALSE | Fan OFF |

30 gives Fan OFF, because `30 > 30` is FALSE. If the fan should also turn on at exactly 30, the condition must be `temperature >= 30`.

## [diagram] How the logic connects

Input, then the decision: TRUE goes to Fan ON, FALSE goes to Fan OFF. Both paths meet again at the update, and the yellow arrow repeats everything for i = 1 to 5. The decision is **inside** the loop, so it is made fresh for every reading.

![A flowchart: Start, int i = 1, then the diamond i <= 5?. YES leads to Input temperature and the diamond temperature > 30?, whose YES path prints "Fan ON" and NO path prints "Fan OFF". The paths join at i++, and a yellow repeat arrow goes back to i <= 5?. The NO exit of i <= 5? leads to End](images/fan-control-loop.png)

## [common_mistakes] Six common loop mistakes

When a loop misbehaves, check these first.

| Mistake | Code | What happens |
|---|---|---|
| **Missing update** | `while (i <= 5) { cout << i; }` | Infinite loop: `i` never changes. |
| **Wrong condition** | `for (int i = 1; i < 5; i++)` | Too few (or too many) iterations: this prints 1 to 4 only. |
| **`=` instead of `==`** | `while (x = 5)` | Stores 5 in `x` instead of comparing. `while (x == 5)` compares. |
| **Wrong starting value** | `int i = 0; while (i <= 5) …` | Off-by-one: 0 to 5 is six numbers, not five. |
| **Missing braces** | `while (i <= 5)` then `cout << i;` then `i++;` | Only the first statement after `while` is in the loop, so `i++` never runs: infinite loop. |
| **Extra semicolon** | `while (i <= 5); { cout << i; i++; }` | The `;` is the whole loop body, so the real body never repeats; the loop never ends. |

Off-by-one errors come from the start value or from `<` versus `<=`.

## [code] Wrong condition: one too few

The goal was 1 to 5, but `<` stops before 5.

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    for (int i = 1; i < 5; i++)
    {
        cout << i;
    }
    cout << endl;
    return 0;
}
```

```output
1234
```

```notes
5 | i < 5 | 5 < 5 is FALSE: 5 is missed | tri coral
```

## [code] Wrong starting value: one too many

The goal was five numbers, but starting at 0 gives six.

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    int i = 0;
    while (i <= 5)
    {
        cout << i;
        i++;
    }
    cout << endl;
    return 0;
}
```

```output
012345
```

```notes
5 | int i = 0; | starts at 0: one extra | tri coral
```

## [common_mistakes] Find the bug

The goal is to print `12345`. What is wrong? Trace it on paper first. (No OUTPUT box: this loop never finishes.)

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    for (int i = 1; i <= 5; i--)
    {
        cout << i;
    }
    return 0;
}
```

```notes
5 | i-- | makes i smaller | tri coral
5 | i <= 5 | stays TRUE forever | tri coral
```

## [explanation] The answer

`i--` makes `i` smaller: 1 → 0 → -1 → -2 → … `i` is always less than or equal to 5, so the condition `i <= 5` stays TRUE and the loop never ends. The update moves **away** from the stopping condition, just like the `x++` example in the while lecture.

**Fix:** `i++`. Then the loop prints `12345` and stops when `i` becomes 6.

## [code] The fixed loop

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    for (int i = 1; i <= 5; i++)
    {
        cout << i;
    }
    cout << endl;
    return 0;
}
```

```output
12345
```

```notes
5 | i++ | moves toward 6: stops | circle green
```

## [explanation] The habit to build

This is the process to follow for every problem:

**Problem** → **Pseudocode** → **C++ code** → **Test** → **Debug**

Understand the problem, plan it in pseudocode, write the C++, test it with real values, and debug with a trace table when the output is wrong.

## [key_takeaways] Key takeaways (Lecture 4)

1. Pseudocode logic can be translated directly into C++.
2. `while` checks the condition before each repetition.
3. `for` combines initialization, condition and update.
4. `do-while` always executes at least once.
5. Counters control repetition.
6. Accumulators store running totals.
7. Always make sure the loop can stop.
