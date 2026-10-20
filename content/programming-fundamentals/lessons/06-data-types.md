---
slug: data-types
title: "Data types: int, float, char, string and bool"
topic: data-types
lecture: 2
difficulty: easy
description: A data type tells the computer what kind of value a variable stores. Meet the five types you will use most, and learn to choose the right one for each value.
objectives:
  - Explain what a data type is and why it matters
  - Use int, float or double, char, string and bool in C++
  - Choose the right data type for a value by asking five questions
  - Avoid losing the decimal part by storing it in an int
prerequisites:
  - "Variables: named boxes in memory"
related:
  - variables-named-boxes-in-memory
  - operators
updated: 2026-10-09
---

## [explanation] What is a data type?

A **data type** tells the computer what **kind** of data a variable stores.

Why does it matter? Different kinds of values need different amounts of memory and allow different operations. A whole number and a decimal number are stored differently, and you can multiply two numbers but not two names. The data type tells the computer which rules apply.

## [explanation] The five types you will use most

| Data type | Used for | Example |
|---|---|---|
| `int` | whole numbers | `20` |
| `float` / `double` | decimal numbers | `25.75` |
| `char` | a single character | `'A'` |
| `string` | text | `"Omar"` |
| `bool` | true or false | `true` |

A few details:

- `float` and `double` both store decimals. `double` is more precise, because it uses more memory.
- A `char` value goes in **single** quotes: `'A'`. A `string` value goes in **double** quotes: `"Omar"`.
- To use `string` in C++, add `#include <string>` at the top of the program.

## [code] All five types in one program

```cpp program run
#include <iostream>
#include <string>
using namespace std;

int main()
{
    int age = 19;
    float temperature = 32.5;
    double price = 25.75;
    char grade = 'A';
    string name = "Omar";
    bool fanOn = true;
    cout << age << endl;
    cout << temperature << endl;
    cout << price << endl;
    cout << grade << endl;
    cout << name << endl;
    cout << fanOn << endl;
    return 0;
}
```

```output
19
32.5
25.75
A
Omar
1
```

```notes
2 | string | needed for string | circle sky
7 | int | whole number | square yel
8 | float | decimal number | square yel
10 | 'A' | char: single quotes | tri green
11 | "Omar" | string: double quotes | tri green
18 | fanOn | true prints as 1 | diamond coral
```

## [explanation] Why did true print as 1?

Inside the computer, `true` is stored as `1` and `false` as `0`. By default, `cout` prints a `bool` as that number. The value is still `true`; only the way it is printed is different.

## [example] Choosing the correct data type

Ask yourself these questions about the value, in this order:

1. Is it a **whole number**? → `int`
2. Does it have a **decimal point**? → `float` (or `double`)
3. Is it a **single character**? → `char`
4. Is it **text**, such as a word or a name? → `string`
5. Is it only **true or false**? → `bool`

| Value | Example | Type |
|---|---|---|
| Student age | `19` | `int` |
| Temperature | `32.5` | `float` |
| Student name | `"Omar"` | `string` |
| Exam grade letter | `'A'` | `char` |
| Fan ON/OFF state | `true` / `false` | `bool` |

## [common_mistakes] A decimal stored in an int

An `int` box can only hold whole numbers. If you store 32.5 in it, C++ drops the `.5` without asking. Our compiler didn't even warn about it, even with warnings turned on.

```cpp program run
#include <iostream>
using namespace std;

int main()
{
    int temperature = 32.5;
    cout << temperature << endl;
    return 0;
}
```

```output
32
```

```notes
6 | int | wrong type for 32.5 | tri coral
6 | 32.5 | the .5 is lost | tri coral
```

## [common_mistakes] Dividing two ints

When **both** numbers in a division are `int`, C++ does whole-number division and cuts off the decimal part. The total 24 divided by 5 gives 4, not 4.8. With a `float`, the decimal part stays.

```cpp program run
#include <iostream>
using namespace std;

int main()
{
    int total = 24;
    cout << total / 5 << endl;
    float sum = 24;
    cout << sum / 5 << endl;
    return 0;
}
```

```output
4
4.8
```

```notes
7 | total / 5 | int / int: 4 | tri coral
9 | sum / 5 | float / int: 4.8 | circle green
```

## [note] Check yourself

::: check What data type would you use for a temperature, an age and a student's name?
???
Temperature: `float` (it can have a decimal part, such as 32.5). Age: `int` (a whole number). Student's name: `string` (text).
:::

::: check Which type fits "has the student paid the fees?"
???
`bool`. The answer is only ever yes or no, which is `true` or `false`.
:::

## [key_takeaways] Key takeaways

- A data type tells the computer what kind of value a variable stores.
- `int` for whole numbers, `float`/`double` for decimals, `char` for one character, `string` for text, `bool` for true/false.
- `char` uses single quotes `'A'`; `string` uses double quotes `"Omar"` and needs `#include <string>`.
- Storing a decimal in an `int`, or dividing two `int`s, loses the decimal part.
