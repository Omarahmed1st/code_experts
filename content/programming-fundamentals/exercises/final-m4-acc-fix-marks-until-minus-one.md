---
slug: final-m4-acc-fix-marks-until-minus-one
type: correct_code
title: Fix the marks that end with -1
lesson: counters-accumulators-and-input-loops
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A teacher types the marks of a class one by one. A mark can be 0, so she types **-1** to finish (she always types at least one mark). The program should print how many marks were typed (not counting the -1) and their average. For `60 80 70 -1` it should print `Count: 3` and `Average: 70`. The count is right, but it prints `Average: 49.6667`.

There is **one** bug: one line is in the wrong place. Fix the program by moving that line. Don't add, remove or change any other line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    int count = 0;
    float sum = 0;
    cin >> mark;
    while (mark != -1)
    {
        cin >> mark;
        sum += mark;
        count++;
    }
    cout << "Count: " << count << endl;
    cout << "Average: " << sum / count << endl;
    return 0;
}
```

## Expected behavior

The user types whole-number marks (0 or more), then `-1`. The program prints `Count: ` and the number of marks before the -1, then `Average: ` and their average, with the decimal part if there is one. The -1 is never counted or added.

## Tests

### three marks

```input
60 80 70 -1
```

```output
Count: 3
Average: 70
```

### a zero mark counts

```input
0 100 -1
```

```output
Count: 2
Average: 50
```

### only one mark

```input
45 -1
```

```output
Count: 1
Average: 45
```

### an average with decimals

```input
15 18 -1
```

```output
Count: 2
Average: 16.5
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    int count = 0;
    float sum = 0;
    cin >> mark;
    while (mark != -1)
    {
        sum += mark;
        count++;
        cin >> mark;
    }
    cout << "Count: " << count << endl;
    cout << "Average: " << sum / count << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int mark;
    int count = 0;
    float sum = 0;
    cin >> mark;
    while (mark != -1)
    {
        sum += mark;
        cin >> mark;
        count++;
    }
    cout << "Count: " << count << endl;
    cout << "Average: " << sum / count << endl;
    return 0;
}
```

## Hints

- Trace `60 80 70 -1`. Which mark is added to `sum` in the first pass? Which value is added in the last pass?
- The first mark is already read **before** the loop. What should the body do with it before it reads the next one?

## Explanation

This is the **read, process, repeat** pattern with a stop value. The first mark is read before the loop, so that the condition `mark != -1` has a real mark to check. Inside the loop, the order must be:

1. **process** the mark already in the box (add it to `sum`, count it);
2. **read** the next mark at the end of the body;
3. back to the condition, which checks the mark just read.

In the broken program, the body **reads first**. That throws away the first mark before it is added: in the first pass, 60 is replaced by 80. And in the last pass the program reads -1 and **adds it** before the condition has a chance to stop the loop. So `sum` is 80 + 70 + (−1) = 149, and 149 / 3 = 49.6667. The count is still 3, which hides the bug if you only look at the count.

Moving `cin >> mark;` to the end of the body fixes both problems: 60 + 80 + 70 = 210, and 210 / 3 = 70. The -1 is read, the condition sees it, and the loop stops before it is added.
