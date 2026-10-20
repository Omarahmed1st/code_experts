---
slug: final-m2-types-fix-name-and-height
type: correct_code
title: Fix the student card
lesson: data-types
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This program reads a student's first name, age and height in metres, all on one line, and prints them in a sentence. For `Mona 19 1.65` it should print `Mona is 19 years old and 1.65 m tall.`, but it prints `M is 0 years old and 0 m tall.`

**Two** variables have the wrong data type. Find them and fix the program by changing only those two types. The program already has `#include <string>`.

## Code

```cpp
#include <iostream>
#include <string>
using namespace std;
int main()
{
    char name;
    int age;
    int height;
    cin >> name >> age >> height;
    cout << name << " is " << age << " years old and " << height << " m tall." << endl;
    return 0;
}
```

## Expected behavior

The user types a first name (one word), an age (a whole number) and a height in metres (it can have decimals), separated by spaces. The program prints them in the sentence `<name> is <age> years old and <height> m tall.` For `Mona 19 1.65` it prints `Mona is 19 years old and 1.65 m tall.`

## Tests

### Mona

```input
Mona 19 1.65
```

```output
Mona is 19 years old and 1.65 m tall.
```

### Ali

```input
Ali 20 1.8
```

```output
Ali is 20 years old and 1.8 m tall.
```

## Solution

```cpp
#include <iostream>
#include <string>
using namespace std;
int main()
{
    string name;
    int age;
    float height;
    cin >> name >> age >> height;
    cout << name << " is " << age << " years old and " << height << " m tall." << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
#include <string>
using namespace std;
int main()
{
    string name;
    int age;
    double height;
    cin >> name >> age >> height;
    cout << name << " is " << age << " years old and " << height << " m tall." << endl;
    return 0;
}
```

## Hints

- A `char` box holds **one** character. How many characters are in `Mona`?
- Can an `int` box hold 1.65?

## Explanation

Ask the type questions for each value: is it a single character, text, a whole number or a decimal?

1. **The name is text, not one character.** A `char` holds exactly one character, so `cin >> name` takes only the `M`. The letters `ona` are still waiting to be read, and the next read wants a number for `age`. `ona` is not a number, so the reading fails: `age` and `height` get 0, and the output is `M is 0 years old and 0 m tall.` A name needs `string` (which is why `#include <string>` is there).
2. **The height has a decimal part.** With only the first fix, the program prints `1 m tall`, because an `int` holds whole numbers only. A height such as 1.65 needs `float` (or `double`).

`age` is correctly an `int`: ages are whole numbers. One wrong type early in a `cin` chain can spoil every value after it, which is why the output was wrong in three places.
