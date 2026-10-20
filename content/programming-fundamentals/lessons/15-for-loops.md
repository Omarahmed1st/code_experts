---
slug: for-loops
title: "For loops: the three parts in one line"
topic: for-loops
lecture: 4
difficulty: easy
description: A for loop puts initialization, condition and update in one header. Compare it with while, follow the order its parts run in, count up, count in steps, count down, and solve the practice problems.
objectives:
  - Write the for loop header with its three parts and two semicolons
  - Explain the order the parts run in
  - Count up, count in steps and count down with for
  - Rewrite a while loop as a for loop and back
prerequisites:
  - "While loops in C++: from pseudocode to real code"
  - "Accumulators, input loops and infinite loops"
related:
  - while-loops-in-cpp
  - do-while-and-choosing-a-loop
updated: 2026-10-09
---

## [explanation] The for loop

A `for` loop is useful when we **know how many times** we want to repeat something. It packs the same three parts we have been using into one line:

```cpp
for (initialization; condition; update)
{
    statements;
}
```

| Part | When it runs |
|---|---|
| **Initialization** | once, at the start |
| **Condition** | checked before each repetition |
| **Update** | after each repetition |

The symbols: the `( )` hold all three parts, **two** semicolons `;` separate them, and there is **no** `;` after the update or after the closing `)`.

## [code] while vs for

Here is the loop that prints 1 to 5, written as a `while` loop:

```cpp
int i = 1;
while (i <= 5)
{
    cout << i;
    i++;
}
```

And here is the same loop as a `for` loop. The initialization, condition and update move into one line. Same result, different structure: you can see the whole plan of the loop at a glance.

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
5 | int i = 1 | initialization | circle sky
5 | i <= 5 | condition | square yel
5 | i++ | update | diamond green
7 | cout << i; | the body | tri sky
```

## [diagram] The order of execution

The first part runs once. Then the loop goes: check the condition, run the body, run the update, and back to the condition.

![A loop flowchart: the rectangle int i = 1 (runs once), then the diamond i <= 5 ? (checked before every pass). TRUE leads down to cout << i; then i++ (after the body, every time), and a yellow repeat arrow goes back up to the condition. FALSE leads right to the oval Exit loop](images/for-loop-order.png)

## [explanation] Understanding the for header

For `for (int i = 1; i <= 5; i++)`:

1. **Initialization** `int i = 1`: creates `i` and sets it to 1. Runs once.
2. **Condition** `i <= 5`: checked before each pass. FALSE ends the loop.
3. **Update** `i++`: runs after each pass of the body.

The order is: `int i = 1` → `i <= 5 ?` → body → `i++` → back to the condition, until it is FALSE.

::: warning The update is written first but runs last
In the header, `i++` is written **before** the body, but it runs **after** the body. This is the most common confusion with for loops.
:::

## [code] Example: print the numbers 1 to 10

Logic: start at 1, add 1 each time, stop after 10. Read the header aloud: start `i` at 1; keep going while `i` is at most 10; add 1 after each pass. To change how many numbers are printed, we only change the 10.

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    for (int i = 1; i <= 10; i++)
    {
        cout << i << endl;
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
6
7
8
9
10
```

```notes
5 | i <= 10 | stop after 10 | square yel
7 | endl | each number on its own line | tri green
```

## [explanation] How many times?

`i` takes the values 1, 2, 3 … 10, so the body runs **10** times. When `i` becomes 11, `11 <= 10` is FALSE, and the loop stops.

## [code] Example: even numbers from 2 to 10

The even-numbers problem from the while lecture, as a for loop. The update doesn't have to be +1: `i += 2` jumps by 2.

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    for (int i = 2; i <= 10; i += 2)
    {
        cout << i << endl;
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
5 | int i = 2 | start at 2 | circle sky
5 | i += 2 | jump by 2 | diamond green
```

## [explanation] Trace and a question

**Trace:** `i` is 2 → 4 → 6 → 8 → 10 → 12. `12 <= 10` is FALSE, so the loop stops.

The update can be any step: `i += 2`, `i += 5`, `i += 10`. How would you print 5, 10, 15, 20? Start at 5, use the condition `i <= 20`, and the update `i += 5`.

## [code] Example: count down 5, 4, 3, 2, 1

The same countdown as the while version, now as a for loop. When counting down, all three parts change together: **start high** (`int i = 5`), **stop after 1** (`i >= 1`), **go down by 1** (`i--`).

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    for (int i = 5; i >= 1; i--)
    {
        cout << i << endl;
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
5 | int i = 5 | start high | circle sky
5 | i >= 1 | stop after 1 | square yel
5 | i-- | go down by 1 | diamond green
```

## [explanation] Trace the countdown

`i` = 5, 4, 3, 2, 1 are printed. Then `i` becomes 0, and `0 >= 1` is FALSE, so the loop stops.

If you mix the parts, for example `i--` with `i <= 5`, you get an infinite loop: `i` goes down forever and is always at most 5. You'll debug exactly that in the debugging lecture.

## [note] Practice challenge: your turn

Write C++ code using loops to:

1. print the numbers 1 to 20;
2. print the even numbers from 2 to 20;
3. calculate the sum from 1 to 10.

Hint: start with a `for` loop. Then try rewriting one answer with `while`. Write the three parts first: where do I start, when do I stop, how do I move? For the sum, remember the accumulator that starts at 0.

::: check Answer 1: print the numbers 1 to 20
???
The only change from the 1-to-10 example is the number in the condition.
```cpp
for (int i = 1; i <= 20; i++)
{
    cout << i << endl;
}
```
The same result with `while`:
```cpp
int i = 1;
while (i <= 20)
{
    cout << i << endl;
    i++;
}
```
With `endl`, the output is 20 lines: 1 to 20.
:::

## [code] Answer 2: even numbers from 2 to 20

Start at 2, step by 2, stop after 20. The while version is `int i = 2; while (i <= 20) { cout << i << endl; i += 2; }`. When `i` becomes 22, `22 <= 20` is FALSE and the loop stops. Check your answer by counting: there should be exactly **10** numbers.

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    for (int i = 2; i <= 20; i += 2)
    {
        cout << i << endl;
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
12
14
16
18
20
```

```notes
5 | int i = 2 | starting at 1 prints odd numbers | circle sky
5 | i <= 20 | i <= 19 would stop at 18 | square yel
```

## [code] Answer 3: the sum from 1 to 10

The for loop with an accumulator. `sum` must be declared **before** the loop; `sum += i;` means `sum = sum + i`.

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    int sum = 0;

    for (int i = 1; i <= 10; i++)
    {
        sum += i;
    }

    cout << "Sum = " << sum << endl;
    return 0;
}
```

```output
Sum = 55
```

```notes
5 | int sum = 0; | starts at 0, before the loop | circle sky
9 | sum += i; | sum = sum + i | diamond green
12 | cout | the final total | tri green
```

## [explanation] The running total

The table shows `sum` after each pass. The last value, 55, is what gets printed. Quick check: 1 + 2 + … + 10 = 55.

| `i` | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| `sum` | 1 | 3 | 6 | 10 | 15 | 21 | 28 | 36 | 45 | 55 |

## [common_mistakes] The stray semicolon

A semicolon right after the `for (...)` header ends the loop there. The loop then repeats **nothing**, and the block below runs **once**, after the loop has finished. With warnings turned on (`g++ -Wall`), the compiler warns: *this 'for' clause does not guard…*. That's a good reason to always compile with warnings on.

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    int i;
    for (i = 1; i <= 5; i++);
    {
        cout << i << endl;
    }
    return 0;
}
```

```output
6
```

```notes
6 | ; | this ends the loop | tri coral
8 | cout << i | runs once, i is 6 | circle sky
```

## [common_mistakes] Off-by-one errors

The most common loop bug is running one time too many or one too few:

- `for (int i = 1; i < 5; i++)` runs **4** times (1, 2, 3, 4). Use `<=` to include 5.
- `for (int i = 0; i <= 5; i++)` runs **6** times (0 to 5).

When unsure, write a quick trace for the first pass and the last one.

## [key_takeaways] Key takeaways

- `for (initialization; condition; update)`: two semicolons inside, none after the `)`.
- Initialization runs once; the condition is checked before each pass; the update runs after each pass.
- `for` is the clearest choice when you know how many times to repeat.
- To count down, change all three parts: start high, use `>=`, use `i--`.
- Any for loop can be written as a while loop, and the other way round.
