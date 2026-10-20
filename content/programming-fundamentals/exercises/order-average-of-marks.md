---
slug: order-average-of-marks
type: correct_code
ask: order
title: Put the average program in order
lesson: input-and-output-with-cout-and-cin
difficulty: easy
updated: 2026-10-10
---

## Question

The middle lines of this program are mixed up. Move them into the right order so the program reads two marks and prints their average.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    // [order]
    float a, b;
    cout << "Enter two marks: ";
    cin >> a >> b;
    float average = (a + b) / 2;
    cout << "Average: " << average << endl;
    // [/order]
    return 0;
}
```

## Expected behavior

The program asks for two marks, reads them, and prints `Average: ` followed by their average.

## Tests

### 70 and 81

```input
70 81
```

```output
Enter two marks: Average: 75.5
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    cout << "Enter two marks: ";
    float a, b;
    cin >> a >> b;
    float average = (a + b) / 2;
    cout << "Average: " << average << endl;
    return 0;
}
```

## Hints

- A variable must be declared before anything is stored in it.
- You can only work out the average after both marks have been read.

## Explanation

A program runs from top to bottom, so the order follows the input, processing, output plan:

1. Declare the boxes `a` and `b` and ask for the marks. These two can swap: either order works, as long as both come before `cin`.
2. The prompt comes before reading, so the user knows what to type.
3. Read both marks with `cin`.
4. Calculate the average, now that both marks are known.
5. Print it.
