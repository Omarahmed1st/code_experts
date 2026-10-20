---
slug: write-average-until-zero
type: write_code
title: Average of numbers until 0
lesson: counters-accumulators-and-input-loops
difficulty: hard
updated: 2026-10-09
---

## Question

A teacher types the students' marks one by one and types **0** to finish. We don't know in advance how many marks there will be. Write a program that reads whole numbers until the user types 0, then prints how many numbers were typed (not counting the 0) and their average, **with** the decimal part.

If the very first number is 0, there is nothing to average: print `No numbers` instead.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int number;
    int count = 0;
    // read numbers until the user types 0

    return 0;
}
```

## Expected behavior

For the input 4, 7, 1, 9, 3, 0 the program prints:

```text
Count = 5
Average = 4.8
```

The final 0 only means "stop": it is not counted and not added. If the first number typed is 0, the program prints `No numbers` and nothing else.

## Tests

### five marks, then 0

```input
4
7
1
9
3
0
```

```output
Count = 5
Average = 4.8
```

### two marks, then 0

```input
5
6
0
```

```output
Count = 2
Average = 5.5
```

### 0 straight away (nothing to average)

```input
0
```

```output
No numbers
```

### a negative number is still counted

```input
-4
10
0
```

```output
Count = 2
Average = 3
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int number;
    int count = 0;
    float sum = 0;
    cin >> number;
    while (number != 0)
    {
        sum += number;
        count++;
        cin >> number;
    }
    if (count == 0)
    {
        cout << "No numbers" << endl;
    }
    else
    {
        float average = sum / count;
        cout << "Count = " << count << endl;
        cout << "Average = " << average << endl;
    }
    return 0;
}
```

## Hints

- The count is unknown, so a `while` loop fits best. Read the first number **before** the loop, and read the next one at the **end** of the body.
- You need a counter (`count`) and an accumulator (`sum`). Both start at 0. Which type should `sum` be so the average keeps its decimals?
- Divide once, **after** the loop. What happens if you divide by `count` when it is 0? Use an `if` to avoid it.

## Explanation

This is the **read, process, repeat** pattern with a stop value:

1. Read the first number before the loop, so the condition `number != 0` has a value to test.
2. Inside the loop: add the number to `sum`, add 1 to `count`, then read the next number. Because the read is the **last** step of the body, the 0 is checked by the condition before it can be added or counted.
3. After the loop, the total is complete, so divide **once**: `sum / count`.

Two details make the answer correct:

- `sum` is a `float`, so `24 / 5` gives 4.8 and not 4. With an `int` sum and an `int` count, the decimal part would be cut off.
- When the first number is 0, the loop body never runs and `count` stays 0. Dividing by 0 makes no sense, so the `if (count == 0)` prints `No numbers` instead.
