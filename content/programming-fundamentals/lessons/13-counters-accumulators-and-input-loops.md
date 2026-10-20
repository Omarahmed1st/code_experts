---
slug: counters-accumulators-and-input-loops
title: "Accumulators, input loops and infinite loops"
topic: while-loops
lecture: 4
difficulty: medium
description: Keep a running total with an accumulator, read many values with one cin inside a loop, compute a sum and an average, and debug two loops that never stop.
objectives:
  - Use an accumulator that starts at 0 to build a total
  - Read several values with one cin inside a loop
  - Divide once, after the loop, to get an average
  - Find and fix a missing update and an update that goes the wrong way
prerequisites:
  - "While loops in C++: from pseudocode to real code"
related:
  - while-loops-in-cpp
  - for-loops
updated: 2026-10-09
---

## [code] Example: the sum from 1 to 5

**Problem:** calculate 1 + 2 + 3 + 4 + 5.

**New idea, the accumulator:** a variable that collects a **running total**. It starts at 0, because adding 0 changes nothing. Now there are two variables with two jobs: `counter` controls the repetition, and `sum` stores the accumulated total.

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    int counter = 1;
    int sum = 0;

    while (counter <= 5)
    {
        sum = sum + counter;  // add to the total
        counter++;
    }
    cout << sum << endl;
    return 0;
}
```

```output
15
```

```notes
5 | counter = 1 | controls the repetition | circle sky
6 | sum = 0 | the accumulator starts at 0 | square yel
10 | sum = sum + counter; | add to the total | diamond green
10 | // add to the total | a comment: ignored | tri sky
13 | cout << sum | after the loop: once | circle green
```

## [explanation] Trace the sum

Each pass takes the **old** total and adds the current counter.

| Iteration | counter | sum before | sum = sum + counter | sum after |
|---|---|---|---|---|
| 1 | 1 | 0 | 0 + 1 | 1 |
| 2 | 2 | 1 | 1 + 2 | 3 |
| 3 | 3 | 3 | 3 + 3 | 6 |
| 4 | 4 | 6 | 6 + 4 | 10 |
| 5 | 5 | 10 | 10 + 5 | 15 |

`counter` controls the repetition, 1 to 5; at 6 the condition is FALSE. `sum` stores the accumulated result: 0 → 1 → 3 → 6 → 10 → 15. Check: 1 + 2 + 3 + 4 + 5 really is 15.

Two details in the code:

- `//` starts a **comment**: a note for humans that the compiler ignores.
- The `cout` is **after** the loop, so only the final total is printed.

::: warning Always initialize an accumulator
If you forget `sum = 0`, the starting value of `sum` in C++ is unpredictable, so the total is garbage. Always set accumulators to 0 before the loop.
:::

## [code] Example: ask the user for 5 numbers

Without a loop we would need five `cout` lines and five `cin` lines. With a loop we write them once, and the same input instruction repeats automatically 5 times.

`cin >> number;` waits for the user to type a value and press Enter, then stores it in `number`. The arrows `>>` point **into** the variable: the value flows into it. (The arrows of `cout` point toward the screen.)

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    int count = 1;
    int number;

    while (count <= 5)
    {
        cout << "Enter number: ";
        cin >> number;
        count++;
    }
    return 0;
}
```

```input
4
7
1
9
3
```

```output
Enter number: 4
Enter number: 7
Enter number: 1
Enter number: 9
Enter number: 3
```

```notes
10 | "Enter number: " | printed exactly as written | circle sky
11 | cin >> number; | the value flows into number | square yel
12 | count++; | the update | diamond green
```

## [explanation] Only the last value survives

Each new value **replaces** the old one in `number`. After the loop, `number` only holds 3, the last value typed. To keep the total, we add an accumulator.

## [code] Example: read 5 numbers and add them

This combines the last two ideas: input in a loop plus an accumulator. The pattern is **read, process, repeat**, and it shows up everywhere: reading sensor values, grades, prices. This version has no prompt, so the user just types the numbers.

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    int count = 1;
    int number;
    int sum = 0;
    while (count <= 5)
    {
        cin >> number;        // read
        sum = sum + number;   // process
        count++;              // repeat
    }
    cout << "Sum = " << sum << endl;
    return 0;
}
```

```input
4
7
1
9
3
```

```output
4
7
1
9
3
Sum = 24
```

```notes
10 | cin >> number; | read | circle sky
11 | sum = sum + number; | process | square yel
12 | count++; | repeat | diamond green
```

## [explanation] Trace the sum of inputs

The user types 4, 7, 1, 9, 3:

| count | number | sum after |
|---|---|---|
| 1 | 4 | 0 + 4 = 4 |
| 2 | 7 | 4 + 7 = 11 |
| 3 | 1 | 11 + 1 = 12 |
| 4 | 9 | 12 + 9 = 21 |
| 5 | 3 | 21 + 3 = 24 |

Output: `Sum = 24`.

## [code] Example: the average of 5 numbers

Same read-process-repeat pattern, plus one division at the end.

1. **Sum first**, inside the loop (line 11).
2. **Divide once**, after the loop (line 14), because only then is the full total known.

`sum += number` means `sum = sum + number`.

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    int count = 1;
    float number;
    float sum = 0;
    while (count <= 5)
    {
        cin >> number;
        sum += number;  // inside loop
        count++;
    }
    float average = sum / 5;  // after loop
    cout << average << endl;
    return 0;
}
```

```input
4
7
1
9
3
```

```output
4
7
1
9
3
4.8
```

```notes
7 | float sum = 0; | float keeps the decimals | circle sky
11 | sum += number; | sum inside the loop | square yel
14 | sum / 5 | divide once, after | diamond green
```

## [explanation] Why float?

With the input 4, 7, 1, 9, 3, `sum` is 24 and the average is 24 / 5 = **4.8**. We use `float` so the average can have a decimal part. If `sum` were an `int`, `24 / 5` would give **4**: the decimal part is cut off.

## [common_mistakes] Infinite loop: the update is missing

What is wrong with this loop? (It has no OUTPUT box on purpose: it never finishes.)

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    int counter = 1;

    while (counter <= 5)
    {
        cout << counter;
        // ???
    }
    return 0;
}
```

```notes
7 | counter <= 5 | always TRUE | tri coral
10 | // ??? | the update is missing | tri coral
```

## [explanation] Why it never stops, and the fix

`counter` never changes. It stays 1, so `counter <= 5` is always TRUE and the loop runs forever, printing `1111111111111111…`. In a terminal, press **Ctrl + C** to stop a program like this.

**Fix:** add `counter++;` inside the body.

## [common_mistakes] Another infinite loop: the update goes the wrong way

Will this loop stop?

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    int x = 10;

    while (x > 0)
    {
        cout << x;
        x++;
    }
    return 0;
}
```

```notes
7 | x > 0 | stays TRUE | tri coral
10 | x++; | moves away from 0 | tri coral
```

## [explanation] No, it never stops

This loop has an update, but it goes the wrong way. `x` starts at 10 and `x++` makes it bigger: 11, 12, 13 … `x` moves **away** from the stopping condition, so `x > 0` stays TRUE. (Strictly speaking an `int` can't grow forever, but what happens then is undefined in C++, so treat it as a loop that never stops.)

**Rule:** the update must move the variable **toward** the stopping condition.

## [code] The fix: x--

With `x--`, `x` goes 10, 9, … 1, 0. At 0, `x > 0` is FALSE and the loop stops. There is no `endl` or space between the numbers, so they print side by side.

```cpp program run
#include <iostream>
using namespace std;
int main()
{
    int x = 10;

    while (x > 0)
    {
        cout << x;
        x--;
    }
    cout << endl;
    return 0;
}
```

```output
10987654321
```

```notes
10 | x--; | moves toward 0 | circle green
```

## [key_takeaways] Key takeaways

- An accumulator collects a running total. Start it at 0 **before** the loop.
- One `cin` inside a loop reads many values; each new value replaces the old one.
- Read, process, repeat: read a value, add it to the total, update the counter.
- Divide for an average **once, after** the loop, and use `float` to keep the decimals.
- A loop with no update, or an update that moves the wrong way, never stops.
