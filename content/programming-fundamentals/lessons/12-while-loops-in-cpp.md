---
slug: while-loops-in-cpp
title: "While loops in C++: from pseudocode to real code"
topic: while-loops
lecture: 4
difficulty: easy
description: Turn last lecture's WHILE pseudocode into a complete C++ program, read it line by line, trace it, and use ++, -- and += to count up, count down and count in steps.
objectives:
  - Translate a WHILE loop from pseudocode into C++
  - Explain every line of a complete C++ program
  - Write the while syntax correctly, with no semicolon after while ( )
  - Use counter++, counter-- and counter += 2 as updates
prerequisites:
  - "Repetition: the WHILE loop in pseudocode"
related:
  - counters-accumulators-and-input-loops
  - for-loops
updated: 2026-10-09
---

## [explanation] Where did we stop?

Every loop runs the same cycle: **initialization** once, then **condition**, **body**, **update**, and back to the condition.

Last lecture we wrote this pseudocode:

```pseudocode
counter ← 1
WHILE counter <= 5 DO
    PRINT counter
    counter ← counter + 1
END WHILE
```

What are the three essential parts? **Initialization** (`counter ← 1`), **condition** (`counter <= 5`) and **update** (`counter ← counter + 1`). Miss any one of them and the loop breaks. Today we write it in real C++.

## [diagram] The same example as a flowchart

After the update, the flow jumps back to the **condition**, not to Start. Only the NO exit reaches End.

![A flowchart: Start, counter ← 1, then the diamond counter <= 5?. YES leads down to Print counter and counter ← counter + 1, and a yellow repeat arrow goes back up to the diamond. NO leads right to End](images/count-1-to-5.png)

## [explanation] Same logic, different syntax

Put the pseudocode and the C++ side by side and go row by row. The three parts stay in the same places; only the way they are written changes.

| Pseudocode | C++ |
|---|---|
| `counter ← 1` | `int counter = 1;` |
| `WHILE counter <= 5 DO` | `while (counter <= 5)` |
| indentation | `{ … }` |
| `PRINT counter` | `cout << counter << endl;` |
| `counter ← counter + 1` | `counter = counter + 1;` |
| `END WHILE` | `}` |

And in C++ every statement ends with a semicolon `;`.

## [code] The first complete C++ program

This is a complete program you can compile and run. It prints 1 to 5, each on its own line.

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    int counter = 1;

    while (counter <= 5)
    {
        cout << counter << endl;
        counter = counter + 1;
    }
    return 0;
}
```

```output
1
2
3
4
5
```

```notes
1 | #include <iostream> | gives us cin and cout | circle sky
3 | int main() | the program starts here | square sky
5 | int counter = 1; | initialization | circle sky
7 | counter <= 5 | condition | square yel
9 | cout << counter << endl; | print, then a new line | tri green
10 | counter = counter + 1; | update | diamond green
12 | return 0; | program finished OK | circle green
```

## [explanation] Line by line

| Line | Meaning |
|---|---|
| `#include <iostream>` | Allows input and output: lets us use `cin` and `cout`. |
| `using namespace std;` | Lets us write `cout` and `cin` directly, without `std::`. |
| `int main()` | The program starts running here. Its body is between `{` and `}`. |
| `int counter = 1;` | Creates an `int` variable and initializes it to 1. |
| `while (counter <= 5)` | The loop condition: repeat while it is TRUE. |
| `cout << counter << endl;` | Prints the current value; `endl` moves to a new line. |
| `counter = counter + 1;` | Updates the counter: takes its value and adds 1. The right side is worked out first with the old value, then stored back. |
| `return 0;` | Tells the operating system the program finished normally. |

The symbols beginners mix up:

- `;` ends a statement.
- `( )` hold the condition.
- `{ }` group the loop body.
- `<<` sends a value to `cout`.

## [explanation] while syntax

```cpp
while (condition)
{
    statements;
}
```

- `while` is a keyword, always **lowercase**. C++ is case-sensitive, so `While` or `WHILE` won't compile.
- `( condition )` is a test: TRUE or FALSE.
- `{ }` hold the body: what repeats.

How it runs:

1. The condition is checked **first**.
2. If TRUE, the loop body executes.
3. If FALSE, the loop stops, and the program continues after the `}`.
4. After the body, the condition is checked again.

::: warning No ; after while ( )
`while (counter <= 5);` ends the loop right there: the semicolon becomes an empty body, so the real body never repeats. One of the most common beginner bugs.
:::

## [diagram] Flow of execution

The condition is checked before every repetition, and one last time when it becomes FALSE. The update happens inside the repetition, every time, right after the body.

![A loop flowchart: the rectangle 1 Initialize (runs once), then the diamond 2 Condition? (checked before every pass). TRUE leads down to Execute the body, then 3 Update (after the body, every time), and a yellow repeat arrow goes back up to the condition. FALSE leads right to the oval Exit loop](images/loop-three-parts.png)

## [explanation] Trace the loop

Each row is one pass. Tracing tables like this are the best way to predict output and find bugs before running the code.

| Iteration | counter before | Condition | Output | counter after |
|---|---|---|---|---|
| 1 | 1 | `1 <= 5` TRUE | 1 | 2 |
| 2 | 2 | `2 <= 5` TRUE | 2 | 3 |
| 3 | 3 | `3 <= 5` TRUE | 3 | 4 |
| 4 | 4 | `4 <= 5` TRUE | 4 | 5 |
| 5 | 5 | `5 <= 5` TRUE | 5 | 6 |
| 6 | 6 | `6 <= 5` FALSE | (none) | (none) |

Row 6 is only a check: the condition is FALSE, so the body doesn't run and the loop ends. The body executes **5** times; the condition is checked **6** times. After the loop, `counter` is 6.

## [code] Initialization, condition, update

Every counting loop has these three parts. In a `while` loop, the initialization comes **before** the loop, the condition sits **inside the ( )**, and the update goes at the **end of the body**. This version uses `counter++`, a short way to write `counter = counter + 1`. Without `endl`, the numbers print side by side.

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    int counter = 1;

    while (counter <= 5)
    {
        cout << counter;
        counter++;
    }
    cout << endl;
    return 0;
}
```

```output
12345
```

```notes
5 | int counter = 1; | before the loop: runs once | circle sky
7 | counter <= 5 | inside ( ): repeat or stop | square yel
10 | counter++; | in the body: every time | diamond green
```

## [explanation] Increment and decrement operators

Three ways to add 1. All three increase `counter` by 1: if `counter` is 3, it becomes 4.

| Code | Meaning |
|---|---|
| `counter = counter + 1;` | long form: take counter, add 1, store it back |
| `counter += 1;` | shorthand: "add 1 to counter" |
| `counter++;` | increment operator: the shortest way |

And the other direction and bigger steps:

| Code | Meaning |
|---|---|
| `counter--;` | `counter = counter - 1`: if counter is 3, it becomes 2 |
| `counter += 2;` | adds 2 each time (we use it for even numbers) |

The long form is never wrong; use whichever you find clearest. For now, write `++` and `--` as statements on their own line.

## [code] Example: count down 5, 4, 3, 2, 1

Logic first: start at 5, keep going while counter is at least 1, subtract 1 each time.

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    int counter = 5;

    while (counter >= 1)
    {
        cout << counter << endl;
        counter--;
    }
    return 0;
}
```

```output
5
4
3
2
1
```

```notes
5 | 5 | start: 1 → 5 | circle sky
7 | >= 1 | condition: <= 5 → >= 1 | square yel
10 | counter--; | update: ++ → -- | diamond green
```

## [explanation] What changed from 1 to 5?

Compared with the count-up program, **three** things changed together:

- the starting value: 1 → 5;
- the condition: `<= 5` → `>= 1`;
- the update direction: `++` → `--`.

Quick trace: 5, 4, 3, 2, 1 are printed; then `counter` becomes 0, `0 >= 1` is FALSE, and the loop stops.

## [code] Example: even numbers from 2 to 10

Start at 2, add 2 each time, stop after 10. The logic in pseudocode is `number ← 2`, `WHILE number <= 10 DO`, `PRINT number`, `number ← number + 2`, `END WHILE`. The only new idea in C++ is the update `number += 2`, which jumps by 2.

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    int number = 2;

    while (number <= 10)
    {
        cout << number << endl;
        number += 2;
    }
    return 0;
}
```

```output
2
4
6
8
10
```

```notes
5 | number = 2 | start at 2 | circle sky
7 | number <= 10 | stop after 10 | square yel
10 | number += 2; | jump by 2 | diamond green
```

## [explanation] Trace the even numbers

`number` takes the values 2 → 4 → 6 → 8 → 10 → 12. Then `12 <= 10` is FALSE, so the loop stops. The value 12 is never printed; it only makes the condition false.

What if we started at 1? We would print the **odd** numbers 1, 3, 5, 7, 9.

## [note] Check yourself

::: check What does this print?
```cpp
int counter = 10;
while (counter >= 4)
{
    cout << counter << " ";
    counter -= 3;
}
cout << endl;
```
???
```output
10 7 4 
```
`counter` goes 10, 7, 4, then 1. `1 >= 4` is FALSE, so 1 is never printed.
:::

## [key_takeaways] Key takeaways

- Pseudocode turns into C++ line by line: `←` becomes `=`, `WHILE … DO` becomes `while ( )`, indentation becomes `{ }`, `PRINT` becomes `cout <<`, `END WHILE` becomes `}`.
- A `while` loop checks its condition **before** every pass; no `;` after `while ( )`.
- Initialization before the loop, condition in the `( )`, update at the end of the body.
- `counter++` adds 1, `counter--` subtracts 1, `counter += 2` adds 2.
- To count down, change all three together: start high, use `>=`, and decrement.
