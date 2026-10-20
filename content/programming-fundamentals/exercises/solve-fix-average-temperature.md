---
slug: solve-fix-average-temperature
type: correct_code
title: Fix the average temperature
lesson: from-problem-to-program
difficulty: medium
updated: 2026-10-10
---

## Question

This program reads the temperature on two days and should print the average temperature. We test it with `20` and `30`: we expect `Average = 25`, but it prints `Average = 35`. Find the mistake and fix it.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    float day1, day2;
    cin >> day1 >> day2;
    float average = day1 + day2 / 2;
    cout << "Average = " << average << endl;
    return 0;
}
```

## Expected behavior

The user types two temperatures. The program prints `Average = ` followed by their average. For `20 30` it prints `Average = 25`.

## Tests

### 20 and 30

```input
20 30
```

```output
Average = 25
```

### 18 and 22

```input
18 22
```

```output
Average = 20
```

### 31 and 34

```input
31 34
```

```output
Average = 32.5
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    float day1, day2;
    cin >> day1 >> day2;
    float average = (day1 + day2) / 2;
    cout << "Average = " << average << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    float day1, day2;
    cin >> day1 >> day2;
    float average = (day1 + day2) / 2.0;
    cout << "Average = " << average << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    float day1, day2;
    cin >> day1 >> day2;
    float average = (day2 + day1) / 2;
    cout << "Average = " << average << endl;
    return 0;
}
```

## Hints

- Work out the line by hand for 20 and 30. Which happens first, `+` or `/`?
- How can you make the program add the two temperatures **before** dividing?

## Explanation

In C++, as in maths, division happens **before** addition. So `day1 + day2 / 2` is calculated as `day1 + (day2 / 2)`. For 20 and 30 that is 20 + 15 = 35, not 25. Only `day2` was divided.

The fix is to put brackets around the sum: `(day1 + day2) / 2`. Now the two temperatures are added first, and the total is divided by 2. Testing with values you can check by hand (20 and 30 should give 25) is how we found this mistake.
