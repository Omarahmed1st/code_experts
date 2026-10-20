---
slug: variables-named-boxes-in-memory
title: "Variables: named boxes in memory"
topic: variables
lecture: 2
difficulty: easy
description: A variable is a named place in memory that holds a value. Create variables in C++, change their values, and choose names the compiler accepts and people understand.
objectives:
  - Explain what a variable is, using the labelled-box picture
  - Create a variable in C++ and give it a value
  - Change a variable's value while the program runs
  - Apply the naming rules and spot invalid names
prerequisites:
  - "Pseudocode: planning before code"
related:
  - data-types
  - pseudocode-planning-before-code
updated: 2026-10-09
---

## [explanation] Where do we store data?

To solve problems, a program needs places to keep information: the mark a student typed, the latest sensor reading, a running total.

A **variable** is a **named memory location** used to store a value.

Picture the computer's memory (RAM) as a shelf of boxes. Each box has a **label** (the variable's name) and holds one **value**:

| Name (label on the box) | Value (inside the box) | In C++ |
|---|---|---|
| `age` | `18` | `age = 18;` |
| `temperature` | `32.5` | `temperature = 32.5;` |
| `grade` | `'A'` | `grade = 'A';` |

## [code] Creating variables in C++

In C++ you must say what **type** of value a box holds before you use it. This is called **declaring** the variable. Here we declare three variables, give each a value, and print them.

```cpp program run
#include <iostream>
using namespace std;

int main()
{
    int age = 18;
    float temperature = 32.5;
    char grade = 'A';
    cout << "age = " << age << endl;
    cout << "temperature = " << temperature << endl;
    cout << "grade = " << grade << endl;
    return 0;
}
```

```output
age = 18
temperature = 32.5
grade = A
```

```notes
6 | int | type: a whole number | circle sky
6 | age | the name | square yel
6 | 18 | the value stored | diamond green
8 | 'A' | one character, in ' ' | tri sky
9 | age << endl | prints the value, not "age" | circle green
```

## [explanation] Name and value

Every variable has three things:

- a **name**, such as `temperature`, which stays the same;
- a **value**, such as `32.5`, which is what's stored in the box;
- a **type**, such as `float`, which says what kind of value fits in the box.

Look at line 9 again: `"age = "` is in double quotes, so it is printed exactly as written. `age` without quotes means "the value inside the box called age", so `18` is printed.

## [code] The value can change

The name stays the same, but the value can change while the program runs. A new sensor reading **replaces** the old value in the same box. The old value is gone.

```cpp program run
#include <iostream>
using namespace std;

int main()
{
    float temperature = 32.5;
    cout << "first reading: " << temperature << endl;
    temperature = 35.7;
    cout << "new reading: " << temperature << endl;
    return 0;
}
```

```output
first reading: 32.5
new reading: 35.7
```

```notes
6 | float temperature = 32.5; | create the box, store 32.5 | circle sky
8 | temperature = 35.7; | replace the value | square yel
```

## [explanation] In pseudocode, the arrow does the same job

In pseudocode we write `temperature ← 35.7`. In C++ we write `temperature = 35.7;`. Both mean: **store** 35.7 in the box called `temperature`. Read it from right to left: the value on the right goes into the variable on the left.

## [explanation] Naming rules

Good names make programs easy to read. C++ also has rules that every name must follow:

1. Start with a **letter** or an **underscore** `_`.
2. Use only **letters, digits and `_`**.
3. **No spaces.**
4. **Do not start with a number.**
5. Use **meaningful** names: `total_marks` tells the reader far more than `t` or `x2`.

| Valid | Invalid | Why it is invalid |
|---|---|---|
| `age` | `2marks` | starts with a number |
| `studentGrade` | `student grade` | contains a space |
| `total_marks` | `total-price` | the hyphen `-` is not allowed (C++ reads it as minus) |
| `temperature1` | | |

Two more C++ facts: names are **case-sensitive**, so `age`, `Age` and `AGE` are three different variables; and you can't use C++'s own words, such as `int` or `while`, as names.

## [common_mistakes] A name that starts with a number

The compiler refuses this program. It never runs, so there is no output.

```cpp program run
#include <iostream>
using namespace std;

int main()
{
    int 2marks = 90;
    cout << 2marks << endl;
    return 0;
}
```

```notes
6 | 2marks | can't start with a digit | tri coral
```

## [explanation] What the compiler said

When we compiled that program with g++, the first error was:

```text
error: expected unqualified-id before numeric constant
```

That is compiler language for "I expected a name here, but found a number". Other compilers word it differently. The fix is a valid name, for example `marks2` or `second_marks`.

## [note] Check yourself

::: check Which of these names are valid in C++? `_count`, `3d`, `final mark`, `finalMark`, `price$`
???
Valid: `_count` and `finalMark`. Invalid: `3d` (starts with a digit), `final mark` (a space) and `price$` (`$` is not a letter, digit or underscore; some compilers accept it, but the rules above don't allow it, so don't use it).
:::

::: check A program runs `x = 4;` and then `x = 9;`. What is in `x` now?
???
`9`. The second assignment replaced the 4. A variable holds one value at a time.
:::

## [key_takeaways] Key takeaways

- A variable is a named memory location that stores a value.
- Every variable has a name, a value and a type. The name stays; the value can change.
- `=` in C++ and `←` in pseudocode both mean "store the value on the right in the variable on the left".
- Names start with a letter or `_`, use only letters, digits and `_`, have no spaces, and should be meaningful.
