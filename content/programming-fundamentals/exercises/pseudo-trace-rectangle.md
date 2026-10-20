---
slug: pseudo-trace-rectangle
type: trace
title: Area and perimeter of a rectangle
lesson: pseudocode-planning-before-code
difficulty: easy
updated: 2026-10-10
---

## Question

Trace this pseudocode by hand. What exactly does it print? Type one value per line.

## Code

```pseudocode
BEGIN
    length ← 6
    width ← 4
    area ← length * width
    perimeter ← 2 * (length + width)
    PRINT area
    PRINT perimeter
END
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    float length = 6;
    float width = 4;
    float area = length * width;
    float perimeter = 2 * (length + width);
    cout << area << endl;
    cout << perimeter << endl;
    return 0;
}
```

## Answer

```output
24
20
```

## Hints

- `*` means multiply.
- In `2 * (length + width)`, work out the brackets first.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 2 | `length ← 6` | length = 6 | |
| 3 | `width ← 4` | length = 6; width = 4 | |
| 4 | `area ← 6 * 4` | length = 6; width = 4; area = 24 | |
| 5 | `perimeter ← 2 * (6 + 4)` = 2 * 10 | length = 6; width = 4; area = 24; perimeter = 20 | |
| 6 | print area | area = 24; perimeter = 20 | 24\n |
| 7 | print perimeter | area = 24; perimeter = 20 | 20\n |

## Explanation

The steps run in order. `area ← length * width` stores 6 × 4 = 24. For the perimeter, the brackets are worked out first: `length + width` is 10, and 2 × 10 = 20.

Without the brackets, `2 * length + width` would be 2 × 6 + 4 = 16, which is wrong. The two `PRINT` lines then show 24 and 20, each on its own line, in the order they are written.
