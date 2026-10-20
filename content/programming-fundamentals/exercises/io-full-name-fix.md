---
slug: io-full-name-fix
type: correct_code
title: Fix the full-name greeting
lesson: input-and-output-with-cout-and-cin
difficulty: medium
updated: 2026-10-10
---

## Question

This program should greet the user by their **full** name. When the user types `Mona Hassan`, it prints `Welcome, Mona!` and loses the second name. Find the bug and fix it.

## Code

```cpp
#include <iostream>
#include <string>
using namespace std;
int main()
{
    string fullName;
    cout << "Enter your full name: ";
    cin >> fullName;
    cout << "Welcome, " << fullName << "!" << endl;
    return 0;
}
```

## Expected behavior

The program prints the prompt `Enter your full name: `, reads the whole line the user types (spaces included), then prints `Welcome, ` followed by the full name and `!`. For `Mona Hassan` the output is `Enter your full name: Welcome, Mona Hassan!` (the typed name is not part of the output).

## Tests

### a first and a last name

```input
Mona Hassan
```

```output
Enter your full name: Welcome, Mona Hassan!
```

### three names

```input
Ahmed Mohamed Ali
```

```output
Enter your full name: Welcome, Ahmed Mohamed Ali!
```

### one name only

```input
Omar
```

```output
Enter your full name: Welcome, Omar!
```

## Solution

```cpp
#include <iostream>
#include <string>
using namespace std;
int main()
{
    string fullName;
    cout << "Enter your full name: ";
    getline(cin, fullName);
    cout << "Welcome, " << fullName << "!" << endl;
    return 0;
}
```

## Hints

- Test it in your head with `Mona Hassan`. Where does `cin >>` stop reading?
- You need a way to read the whole line, up to the Enter key.

## Explanation

`cin >> fullName` reads only **one word**: it stops at the first space. So for `Mona Hassan` the variable holds only `Mona`. The test with one name, `Omar`, passes even with the bug, which is why you should also test input that contains spaces.

The fix is `getline(cin, fullName);`. `getline` reads everything the user typed up to Enter, spaces included, and stores it in the string. Inside the brackets, write `cin` first and then the variable. There are no `>>` arrows.
