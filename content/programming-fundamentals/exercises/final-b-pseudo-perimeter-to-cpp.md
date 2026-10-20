---
slug: final-b-pseudo-perimeter-to-cpp
type: correct_code
title: The perimeter plan, badly translated
lesson: pseudocode-planning-before-code
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A student planned the perimeter of a rectangle in pseudocode. Lengths can have decimals, such as 2.5 m.

```pseudocode
BEGIN
    INPUT length
    INPUT width
    perimeter ← 2 * (length + width)
    PRINT perimeter
END
```

The C++ translation below has **two** bugs, so it does not do what the plan says. For `3` and `5` it prints `Perimeter = 11` instead of `Perimeter = 16`. Find both bugs and fix them. Keep the line `float perimeter = …` and write the formula the way the plan does.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int length, width;
    cin >> length;
    cin >> width;
    float perimeter = 2 * length + width;
    cout << "Perimeter = " << perimeter << endl;
    return 0;
}
```

## Expected behavior

The user types the length, then the width (decimals allowed). The program prints `Perimeter = ` followed by 2 × (length + width). For `2.5` and `4` it prints `Perimeter = 13`.

## Tests

### length 3, width 5

```input
3
5
```

```output
Perimeter = 16
```

### length 2.5, width 4

```input
2.5
4
```

```output
Perimeter = 13
```

### length 1.5, width 1.25

```input
1.5
1.25
```

```output
Perimeter = 5.5
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    float length, width;
    cin >> length;
    cin >> width;
    float perimeter = 2 * (length + width);
    cout << "Perimeter = " << perimeter << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    double length, width;
    cin >> length;
    cin >> width;
    float perimeter = 2 * (length + width);
    cout << "Perimeter = " << perimeter << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    float length, width;
    cin >> length;
    cin >> width;
    float perimeter = (length + width) * 2;
    cout << "Perimeter = " << perimeter << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    float length, width;
    cin >> length;
    cin >> width;
    float perimeter = 2 * length + 2 * width;
    cout << "Perimeter = " << perimeter << endl;
    return 0;
}
```

## Hints

- The plan says lengths can have decimals. Which type is `length` now, and what happens to `2.5` in it?
- Multiplication happens before addition. Which part of `2 * length + width` is multiplied by 2?

## Explanation

The pseudocode is correct; the translation changed two things.

1. **The data type.** The lecture's three steps say: identify the variables, then choose their data types. Lengths can have decimals, so they must be `float` (or `double`). With `int`, the decimal part can't be stored: for `2.5` only the 2 is kept, and the program goes wrong.
2. **The brackets.** In the plan, `2 * (length + width)` adds first, then doubles. Without brackets, `2 * length + width` doubles only `length`: for 3 and 5 that is `6 + 5 = 11`, not 16.

With `float length, width;` and `2 * (length + width)`, the C++ line says exactly what the plan says, and `3` and `5` give `Perimeter = 16`.
