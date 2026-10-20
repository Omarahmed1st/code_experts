---
slug: final-m2-types-trace-saved-bool
type: trace
title: A bool saved too early
lesson: data-types
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

A `bool` box can store the answer of a comparison: `true` or `false`. This program saves such an answer, then changes the temperature, then copies it into an `int`. Watch **when** each box gets its value and what each type can hold. What exactly does it print? Type one line of output per line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    float temperature = 29.5;
    bool hot = temperature > 30;
    temperature = temperature + 1;
    cout << temperature << " " << hot << endl;
    hot = temperature > 30;
    cout << hot << endl;
    int whole = temperature;
    cout << whole << " " << (whole > 30) << endl;
    cout << (whole == temperature) << endl;
    return 0;
}
```

## Answer

```output
30.5 0
1
30 0
0
```

## Hints

- Line 6 works out `29.5 > 30` once and stores the answer. Does line 7 change what is already in `hot`?
- What happens to `.5` when a decimal value is stored in an `int`? Then compare 30 with 30 and with 30.5.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `temperature` starts at 29.5 | temperature = 29.5 | |
| 6 | `29.5 > 30` is FALSE, stored in `hot` | temperature = 29.5; hot = false | |
| 7 | `29.5 + 1` | temperature = 30.5; hot = false | |
| 8 | print 30.5, then `hot` as a number | temperature = 30.5; hot = false | 30.5 0\n |
| 9 | `30.5 > 30` is TRUE, stored in `hot` | temperature = 30.5; hot = true | |
| 10 | print `hot` | temperature = 30.5; hot = true | 1\n |
| 11 | 30.5 into an `int`: the .5 is dropped | whole = 30 | |
| 12 | print 30, then `30 > 30` is FALSE | whole = 30 | 30 0\n |
| 13 | `30 == 30.5` is FALSE | whole = 30; temperature = 30.5 | 0\n |

## Explanation

- **Line 6** works out `29.5 > 30` **once**, when that line runs. The answer, FALSE, is stored in `hot`. A `bool` box holds a value, not the question, so when line 7 makes the temperature 30.5, `hot` is still `false`. `cout` prints `false` as `0`, so line 8 prints `30.5 0`.
- **Line 9** asks the question again with the new temperature: `30.5 > 30` is TRUE, so `hot` becomes `true` and prints as `1`.
- **Line 11** stores 30.5 in an `int`. An `int` holds whole numbers only, so the `.5` is dropped (not rounded): `whole` is 30. Then `30 > 30` is FALSE, printed as `0`. The `int` copy gives a different answer from the `float`, even though both came from the same temperature.
- **Line 13** compares 30 with 30.5. They are not equal, so it prints `0`.
