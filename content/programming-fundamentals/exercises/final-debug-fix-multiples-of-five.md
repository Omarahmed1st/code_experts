---
slug: final-debug-fix-multiples-of-five
type: correct_code
title: Fix the multiples of 5
lesson: loops-with-decisions-and-debugging
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This program reads a whole number `n` and should count the multiples of 5 from 5 up to `n` (5, 10, 15 …) and add them up. For `n = 20` the multiples are 5, 10, 15 and 20, so it should print `Count: 4` and `Sum: 50`. It has **two** bugs. Find them and fix the program.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    int sum = 0;
    int count = 0;
    for (int i = 5; i < n; i += 5)
    {
        sum = i;
        count++;
    }
    cout << "Count: " << count << endl;
    cout << "Sum: " << sum << endl;
    return 0;
}
```

## Expected behavior

The user types a whole number `n`. The program prints `Count: ` and how many multiples of 5 are between 5 and `n` (including `n` itself if it is a multiple of 5), then `Sum: ` and their total.

## Tests

### n is a multiple of 5

```input
20
```

```output
Count: 4
Sum: 50
```

### n is not a multiple of 5

```input
23
```

```output
Count: 4
Sum: 50
```

### n is smaller than 5

```input
4
```

```output
Count: 0
Sum: 0
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    int sum = 0;
    int count = 0;
    for (int i = 5; i <= n; i += 5)
    {
        sum += i;
        count++;
    }
    cout << "Count: " << count << endl;
    cout << "Sum: " << sum << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    int sum = 0;
    int count = 0;
    for (int i = 5; i <= n; i += 5)
    {
        sum = sum + i;
        count++;
    }
    cout << "Count: " << count << endl;
    cout << "Sum: " << sum << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    int sum = 0;
    int count = 0;
    for (int i = 5; i < n + 1; i += 5)
    {
        sum += i;
        count++;
    }
    cout << "Count: " << count << endl;
    cout << "Sum: " << sum << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int n;
    cin >> n;
    int sum = 0;
    int count = 0;
    for (int i = 5; i < n + 1; i += 5)
    {
        sum = sum + i;
        count++;
    }
    cout << "Count: " << count << endl;
    cout << "Sum: " << sum << endl;
    return 0;
}
```

## Hints

- Trace the last pass for `n = 20`: is the body run when `i` is 20?
- Look at the line that should build the total. Does it **add** to the old sum, or **replace** it?

## Explanation

1. **Off-by-one in the condition.** With `i < n`, the loop stops before `n`. For `n = 20` it runs with 5, 10 and 15 only, because `20 < 20` is FALSE, so the multiple 20 is missed. Use `i <= n` (or `i < n + 1`) so that `n` itself is included when it is a multiple of 5.
2. **The accumulator is replaced, not added to.** `sum = i;` stores only the current `i`, so at the end `sum` holds the last multiple, not the total. An accumulator must take its old value and add to it: `sum += i;` (or `sum = sum + i;`).

Notice that the test with `n = 23` hides the first bug (`23` is not a multiple of 5, so `i < n` and `i <= n` give the same passes) but still shows the second one. Testing several cases, including the boundary, finds both bugs.
