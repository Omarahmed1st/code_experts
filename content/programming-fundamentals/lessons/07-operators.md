---
slug: operators
title: "Operators: calculate, store and compare"
topic: operators
lecture: 2
difficulty: easy
description: Use arithmetic operators to calculate, = to store a value, and relational operators to compare values and get TRUE or FALSE, plus the % trick for even and odd numbers.
objectives:
  - Use the arithmetic operators + - * / and %
  - Use % to tell even numbers from odd ones
  - Read an assignment from right to left
  - Compare values with > < == != >= <= and explain the TRUE/FALSE result
prerequisites:
  - "Data types: int, float, char, string and bool"
related:
  - data-types
  - decisions-if-then-else
updated: 2026-10-09
---

## [explanation] Three families of operators

**Operators** are symbols that perform operations on values and variables. This lecture covers three families:

| Family | Job | Symbols |
|---|---|---|
| **Arithmetic** | calculate values | `+` `-` `*` `/` `%` |
| **Relational** | compare values | `>` `<` `==` `!=` `>=` `<=` |
| **Assignment** | store values | `=` in code, `←` in pseudocode |

## [code] Arithmetic operators

| Operator | Meaning |
|---|---|
| `+` | addition |
| `-` | subtraction |
| `*` | multiplication |
| `/` | division |
| `%` | modulus: the **remainder** after division |

```cpp program run
#include <iostream>
using namespace std;

int main()
{
    int A = 17;
    int B = 5;
    cout << "A + B = " << A + B << endl;
    cout << "A - B = " << A - B << endl;
    cout << "A * B = " << A * B << endl;
    cout << "A / B = " << A / B << endl;
    cout << "A % B = " << A % B << endl;
    return 0;
}
```

```output
A + B = 22
A - B = 12
A * B = 85
A / B = 3
A % B = 2
```

```notes
11 | A / B | int / int: whole part only | square yel
12 | A % B | the remainder | diamond green
```

## [explanation] Division and remainder go together

17 divided by 5 is 3, with 2 left over (5 × 3 = 15, and 17 − 15 = 2).

- `17 / 5` gives the **3**. Because both numbers are `int`, the decimal part is cut off.
- `17 % 5` gives the **2**, the remainder.

## [code] % for even and odd

A number is **even** when dividing it by 2 leaves nothing over, and **odd** when 1 is left over. So `number % 2` tells you which it is: `0` means even, `1` means odd.

```cpp program run
#include <iostream>
using namespace std;

int main()
{
    cout << "8 % 2 = " << 8 % 2 << endl;
    cout << "7 % 2 = " << 7 % 2 << endl;
    return 0;
}
```

```output
8 % 2 = 0
7 % 2 = 1
```

```notes
6 | 8 % 2 | 0 left over: even | circle green
7 | 7 % 2 | 1 left over: odd | tri coral
```

## [code] The assignment operator

`=` means **assign**: store a value. Read it from **right to left**: work out the right side first, then store the result in the variable on the left. `x = 5` means "store the value 5 inside x". It is not the maths "equals".

```cpp program run
#include <iostream>
using namespace std;

int main()
{
    int A = 4, B = 6;
    int x = 5;
    int sum = A + B;
    x = x + 1;
    cout << "sum = " << sum << endl;
    cout << "x = " << x << endl;
    return 0;
}
```

```output
sum = 10
x = 6
```

```notes
7 | x = 5; | store 5 in x | circle sky
8 | A + B | worked out first | square yel
9 | x = x + 1; | old x + 1, stored back | diamond green
```

## [explanation] Careful: =, == and ←

| Symbol | Where | Meaning |
|---|---|---|
| `=` | C++ | **store** a value: `x = 5` |
| `==` | C++ and pseudocode | **compare** two values: `x == 5` asks "is x equal to 5?" |
| `←` | pseudocode | the same as `=` in C++: `x ← 5` |

`x = x + 1` looks impossible in maths, but in code it is normal: take the old value of `x`, add 1, and store the result back in `x`.

## [code] Relational operators give TRUE or FALSE

A comparison is a question, and its answer is always **TRUE** or **FALSE**. That is exactly what an `IF` needs.

| Operator | Meaning | Example |
|---|---|---|
| `>` | greater than | `7 > 3` |
| `<` | less than | `2 < 9` |
| `==` | equal to | `x == 5` |
| `>=` | greater than or equal to | `age >= 18` |
| `<=` | less than or equal to | `T <= 30` |
| `!=` | not equal to | `n != 0` |

Here `cout` prints the answer of `temperature > 30`. Remember that `cout` shows TRUE as `1` and FALSE as `0`. The brackets are needed around a comparison inside `cout`.

```cpp program run
#include <iostream>
using namespace std;

int main()
{
    int temperature = 32;
    cout << (temperature > 30) << endl;
    temperature = 25;
    cout << (temperature > 30) << endl;
    return 0;
}
```

```output
1
0
```

```notes
7 | (temperature > 30) | 32 > 30 is TRUE | circle green
9 | (temperature > 30) | 25 > 30 is FALSE | tri coral
```

## [example] The same comparison in pseudocode

```pseudocode
IF temperature > 30 THEN
    PRINT "Fan ON"
END IF
```

When `temperature` is 32, `32 > 30` is TRUE and "Fan ON" is printed. When it is 25, `25 > 30` is FALSE and nothing is printed.

## [common_mistakes] Common operator mistakes

- **Writing `=` when you mean `==`.** `x = 5` stores 5; `x == 5` compares. In a condition you almost always want `==`.
- **Maths symbols.** C++ has no `≥`, `≤` or `≠`. Write `>=`, `<=` and `!=`, with no space between the two characters.
- **Expecting decimals from `int / int`.** `7 / 2` is `3`. If you need `3.5`, at least one of the values must be a `float` or `double`.

## [note] Check yourself

::: check What does this print?
```cpp
cout << 23 / 5 << " " << 23 % 5 << endl;
```
???
```output
4 3
```
23 divided by 5 is 4 (5 × 4 = 20), with 3 left over.
:::

::: check Is 15 even or odd? Use %.
???
Odd: `15 % 2` is `1`.
:::

## [key_takeaways] Key takeaways

- Arithmetic: `+ - * /` and `%`, the remainder. `int / int` keeps only the whole part.
- `number % 2 == 0` means even; `1` means odd.
- `=` stores a value (read right to left); `==` compares; `←` is pseudocode's `=`.
- Relational operators answer TRUE or FALSE, which is what decisions need.
