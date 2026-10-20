---
slug: do-while-and-choosing-a-loop
title: "Do-while, and choosing the right loop"
topic: do-while-loops
lecture: 4
difficulty: easy
description: The do-while loop runs its body first and checks the condition after, so it always runs at least once. Compare it with while, use it to check input, and learn when to pick while, for or do-while.
objectives:
  - Write a do-while loop, with the semicolon after while (condition)
  - Explain why a do-while body always runs at least once
  - Predict the different output of while and do-while with the same condition
  - Choose between while, for and do-while for a problem
prerequisites:
  - "For loops: the three parts in one line"
related:
  - for-loops
  - loops-with-decisions-and-debugging
updated: 2026-10-09
---

## [explanation] The do-while loop

The third loop. A `do-while` loop executes the **body first**, then checks the condition.

```cpp
do
{
    statements;
}
while (condition);
```

Two syntax points:

- The keyword `do` opens the loop.
- The line `while (condition);` **ends with a semicolon**. A normal `while` loop has none there.

Because the check is at the end, the body **always executes at least once**.

## [diagram] How do-while runs

It starts with the body: there is no check first. TRUE goes back up to run the body again; FALSE leaves the loop.

![A flowchart: the oval Loop starts (no check first), then the rectangle Run the body (the body always runs at least once), then the diamond Condition?. TRUE leads back up to Run the body along a yellow repeat arrow; FALSE leads down to the oval Exit loop](images/do-while-flow.png)

## [code] A classic use: checking input

Keep asking until the user types a positive number. The question has to be asked at least once, which is exactly what `do-while` guarantees. The user typed `-3`, then `0`, then `7`.

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    int number;
    do
    {
        cout << "Enter a positive number: ";
        cin >> number;
    }
    while (number <= 0);
    cout << "Thank you: " << number << endl;
    return 0;
}
```

```input
-3
0
7
```

```output
Enter a positive number: -3
Enter a positive number: 0
Enter a positive number: 7
Thank you: 7
```

```notes
6 | do | the body comes first | circle sky
9 | cin >> number; | read, then check | square sky
11 | number <= 0 | not positive? ask again | square yel
11 | ; | the ; is required here | tri coral
```

## [code] while vs do-while

Same variable, same condition, different result. Predict both outputs before you look.

- The `while` loop checks `10 < 5` **first**. It is FALSE, so the body is skipped completely and nothing is printed.
- The `do-while` loop prints 10 **first**, then checks `10 < 5`. It is FALSE, so it stops after one pass.

(Neither loop has an update. That is only safe here because the condition is FALSE from the start.)

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    int x = 10;

    cout << "while prints: [";
    while (x < 5)
    {
        cout << x;
    }
    cout << "]" << endl;

    cout << "do-while prints: [";
    do
    {
        cout << x;
    }
    while (x < 5);
    cout << "]" << endl;
    return 0;
}
```

```output
while prints: []
do-while prints: [10]
```

```notes
8 | x < 5 | checked first: FALSE | square yel
10 | cout << x; | skipped completely | tri coral
17 | cout << x; | runs once before the check | circle green
19 | while (x < 5); | checked after | square yel
```

## [explanation] Choosing the right loop

Any loop can be rewritten as any other, so the question is which one is **clearest** for the problem.

| | `while` | `for` | `do-while` |
|---|---|---|---|
| Use when | the number of repetitions is not clearly known | the number of repetitions is known | the body must run at least once |
| Condition checked | before the body | before the body | after the body |
| Body runs at least | 0 times | 0 times | 1 time |
| Example | read numbers until the user types 0 | print 1 to 10, read 5 sensor values | ask for input, then check it is valid |

The rule of thumb:

- **Count known** → `for`
- **Count unknown** (repeat until something happens) → `while`
- **Must run once** (show a menu, ask for input) → `do-while`

## [note] Check yourself

::: check Which loop fits best? (a) Print a multiplication table from 1 to 12. (b) Keep reading prices until the user types 0. (c) Show a menu and ask for a choice, and show it again if the choice is invalid.
???
(a) `for`: the count, 12, is known. (b) `while`: we don't know how many prices will come before the 0. (c) `do-while`: the menu must be shown at least once before we can check the choice.
:::

::: check How many times does this body run?
```cpp
int n = 0;
do
{
    cout << "Hi" << endl;
    n++;
}
while (n > 5);
```
???
```output
Hi
```
Once. The body runs first and prints `Hi`, then `n` is 1 and `1 > 5` is FALSE, so the loop stops.
:::

## [common_mistakes] Semicolons in the wrong place

The two `while` lines look alike but need opposite rules:

- In a **do-while**, the semicolon after `while (condition)` is **required**. Without it, g++ stops with `error: expected ';' before …`.
- In a normal **while**, a semicolon after `while (condition)` is a **bug**: it becomes an empty body, and the real body never repeats.

```cpp
do { … } while (x < 5);    // correct: do-while ends with ;
while (x < 5) { … }        // correct: no ; after while ( )
while (x < 5); { … }       // bug: the ; is the whole loop
```

## [key_takeaways] Key takeaways

- `do-while` runs the body first and checks the condition after it.
- Its body always runs at least once; `while` and `for` bodies can run zero times.
- `while (condition);` ends a do-while with a semicolon; a normal while has none.
- Count known → `for`. Count unknown → `while`. Must run once → `do-while`.
