---
slug: input-and-output-with-cout-and-cin
title: Input and output with cout and cin
topic: input-and-output
lecture: 4
difficulty: easy
description: Print text and numbers with cout, read the user's values with cin, and avoid the classic mistakes with integer division and names that contain spaces.
objectives:
  - Print text, numbers and calculations with cout and <<
  - Control new lines with endl
  - Read one or more values from the keyboard with cin and >>
  - Read a whole line, spaces included, with getline
prerequisites:
  - "Data types: int, float, char, string and bool"
related:
  - counters-accumulators-and-input-loops
  - for-loops
updated: 2026-10-08
---

## [explanation] Programs talk through input and output

Almost every program does three things: it **reads** some values (input), **works** on them, and **shows** a result (output). In C++ the keyboard and the screen are reached through two objects from the `<iostream>` library:

- `cout` (console output) sends values **to the screen**, using the `<<` operator.
- `cin` (console input) reads values **from the keyboard**, using the `>>` operator.

A memory trick: the arrows point the way the data flows. `cout << "Hi"` pushes `"Hi"` out to the screen; `cin >> age` pulls a value in from the keyboard and puts it into `age`.

## [code] Your first output

```cpp program run
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, Code_Expert!" << endl;
    cout << "C++ is fun";
    cout << " and fast" << endl;
    return 0;
}
```

```output
Hello, Code_Expert!
C++ is fun and fast
```

```notes
1 | iostream | gives you cout and cin | circle sky
5 | << | sends text to cout | square yel
5 | endl | ends the line | diamond green
6 | "C++ is fun" | no endl: line continues | tri coral
```

## [explanation] Why the second and third lines joined

`cout` doesn't start a new line on its own. Only `endl` (or the character `\n` inside a string) moves to the next line. Line 6 printed `C++ is fun` with no `endl`, so line 7 carried on right after it.

::: tip What about std::?
`cout`, `cin` and `endl` really belong to a namespace called `std`. The line `using namespace std;` lets you write `cout` instead of `std::cout`. Both are correct C++; your course may use either.
:::

## [code] Printing numbers and calculations

`cout` prints numbers and the results of calculations, and you can chain several values with `<<`.

```cpp program run
#include <iostream>
using namespace std;

int main() {
    int apples = 7;
    cout << "Apples: " << apples << endl;
    cout << "Double: " << apples * 2 << endl;
    cout << 7 / 2 << " and " << 7.0 / 2 << endl;
    return 0;
}
```

```output
Apples: 7
Double: 14
3 and 3.5
```

```notes
6 | apples | prints the value, 7 | circle sky
7 | apples * 2 | calculated first | square yel
8 | 7 / 2 | int / int drops .5 | tri coral
8 | 7.0 / 2 | a double keeps .5 | diamond green
```

## [note] Check yourself

::: check What does this line print?
```cpp
cout << 10 / 4 << " " << 10 % 4 << endl;
```
???
```output
2 2
```
`10 / 4` divides two `int` values, so the result is the whole part, `2`. `10 % 4` is the **remainder** of that division, which is also `2`.
:::

## [code] Reading a value with cin

`cin >> age;` waits for the user to type a value and press Enter, then stores it in `age`. Print a short message first (a **prompt**) so the user knows what to type.

```cpp program run
#include <iostream>
using namespace std;

int main() {
    int age;
    cout << "Enter your age: ";
    cin >> age;
    cout << "Next year you will be " << age + 1 << endl;
    return 0;
}
```

```input
19
```

```output
Enter your age: 19
Next year you will be 20
```

```notes
5 | int age; | a box for the answer | circle sky
6 | "Enter your age: " | the prompt | square yel
7 | >> | stores what was typed | diamond green
```

## [explanation] Who wrote what?

The OUTPUT box shows the terminal exactly as you would see it. The `19` (in green, underlined) is what the **user typed**; the terminal shows your typing as you type it. Everything else was **printed by the program**. `cin` itself prints nothing: it only reads.

The prompt ends with a space and no `endl`, so the typing appears on the same line as the question.

## [code] Reading several values at once

One `cin` can read several values. They can be typed on one line separated by spaces, or on separate lines.

```cpp program run
#include <iostream>
#include <string>
using namespace std;

int main() {
    string name;
    double mark1, mark2;
    cin >> name >> mark1 >> mark2;
    cout << name << "'s average is " << (mark1 + mark2) / 2 << endl;
    return 0;
}
```

```input
Omar 17.5 19
```

```output
Omar 17.5 19
Omar's average is 18.25
```

```notes
8 | cin >> name >> mark1 >> mark2 | reads 3 values in order | circle sky
9 | (mark1 + mark2) / 2 | brackets: add first | square yel
```

## [common_mistakes] Names with spaces: cin stops at a space

`cin >>` reads **one word**: it stops at the first space. Typing a full name loses everything after the first word.

```cpp program run
#include <iostream>
#include <string>
using namespace std;

int main() {
    string name;
    cin >> name;
    cout << "Hello, " << name << endl;
    return 0;
}
```

```input
Omar Ahmed
```

```output
Omar Ahmed
Hello, Omar
```

```notes
7 | cin >> name | stops at the space | tri coral
```

## [example] The fix: getline reads the whole line

`getline(cin, name)` reads everything the user typed up to Enter, spaces included.

```cpp program run
#include <iostream>
#include <string>
using namespace std;

int main() {
    string name;
    getline(cin, name);
    cout << "Hello, " << name << endl;
    return 0;
}
```

```input
Omar Ahmed
```

```output
Omar Ahmed
Hello, Omar Ahmed
```

```notes
7 | getline | reads the whole line | circle green
```

## [common_mistakes] Other common mistakes

- **Arrows the wrong way.** It's `cout << x` and `cin >> x`. `cin << x` does not compile.
- **Forgetting the semicolon** at the end of a `cout` or `cin` statement.
- **Integer division by surprise.** `7 / 2` is `3`. Write `7.0 / 2`, or store the values in `double` variables, when you need the decimal part.
- **No prompt.** Without a `cout` before `cin`, the program waits silently and the user doesn't know what to type.

## [key_takeaways] Key takeaways

- `cout << value` prints; chain several values with more `<<`.
- Only `endl` or `\n` start a new line.
- `cin >> variable` reads one value and stops at a space; chain `>>` to read several.
- Use `getline(cin, text)` to read a whole line, including spaces.
- `int / int` gives a whole number; use a `double` to keep the decimal part.
