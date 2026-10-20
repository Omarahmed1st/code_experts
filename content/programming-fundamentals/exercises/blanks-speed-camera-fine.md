---
slug: blanks-speed-camera-fine
type: correct_code
ask: blanks
title: Fill in the blanks for the speed camera
lesson: decisions-if-then-else
difficulty: easy
updated: 2026-10-10
---

## Question

On this road the speed limit is 80 km/h. Driving at exactly 80 is allowed. Above 80, the driver pays 10 pounds for every km/h over the limit. Fill in the **two blanks**: the first is a comparison operator, the second is a short calculation.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int speed, fine;
    cin >> speed;
    if (speed ___ 80)
    {
        fine = (___) * 10;
        cout << "Fine: " << fine << " pounds" << endl;
    }
    else
    {
        cout << "No fine" << endl;
    }
    return 0;
}
```

## Expected behavior

The user types a speed. If it is more than 80, the program prints `Fine: ` followed by 10 × (the km/h over 80) and ` pounds`. Otherwise it prints `No fine`.

## Tests

### 95 km/h

```input
95
```

```output
Fine: 150 pounds
```

### exactly 80 km/h

```input
80
```

```output
No fine
```

### 60 km/h

```input
60
```

```output
No fine
```

### 81 km/h

```input
81
```

```output
Fine: 10 pounds
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int speed, fine;
    cin >> speed;
    if (speed > 80)
    {
        fine = (speed - 80) * 10;
        cout << "Fine: " << fine << " pounds" << endl;
    }
    else
    {
        cout << "No fine" << endl;
    }
    return 0;
}
```

## Hints

- Is 80 itself a speed that should get a fine?
- At 95 km/h the driver is 15 km/h over the limit. Which calculation gives 15?

## Explanation

1. `speed > 80`: only speeds **above** 80 get a fine. With `>=`, a driver at exactly 80 would see `Fine: 0 pounds` instead of `No fine`. That's why the boundary value 80 is one of the tests.
2. `speed - 80`: the number of km/h over the limit. At 95 km/h that is 15, and 15 × 10 = 150 pounds.

The brackets around `speed - 80` matter: they make the subtraction happen before the multiplication.
