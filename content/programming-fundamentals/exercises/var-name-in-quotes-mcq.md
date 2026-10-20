---
slug: var-name-in-quotes-mcq
type: mcq
title: Printing a name in quotes
lesson: variables-named-boxes-in-memory
difficulty: easy
updated: 2026-10-10
---

## Question

A student wants to print the value of `age`. What does this program actually print?

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int age = 18;
    cout << "age" << endl;
    return 0;
}
```

## Options

- [ ] `18`
  To print the value, write `age` **without** quotes: `cout << age << endl;`.
- [x] `age`
  Right: anything in double quotes is printed exactly as written, so the word `age` appears, not the value.
- [ ] `"age"`
  The quotes mark where the text starts and ends. They are not printed.
- [ ] `age = 18`
  The program never prints ` = 18`. It only prints the text between the quotes.

## Answer

```output
age
```

## Hints

- What does `cout` do with text inside double quotes?
- What is the difference between `"age"` and `age`?

## Explanation

`"age"` with double quotes is **text**: `cout` prints those letters exactly as written. `age` without quotes is the **name of a variable**: `cout` looks inside the box and prints its value, 18.

So this line prints the word `age`. To print the value, write `cout << age << endl;`. To print both, as in the lecture, write `cout << "age = " << age << endl;`, which prints `age = 18`.
