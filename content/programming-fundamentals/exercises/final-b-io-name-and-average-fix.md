---
slug: final-b-io-name-and-average-fix
type: correct_code
title: Fix the full name and the average
lesson: input-and-output-with-cout-and-cin
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

This program reads a student's **full name** on the first line, then two whole-number marks on the second line. It should print the name and the average of the two marks, **with** the decimal part. For the name `Omar Ahmed` and the marks `15 18` it should print `Omar Ahmed: 16.5`, but it goes wrong. It has **two** bugs. Find them and fix them. Keep the marks as `int`.

## Code

```cpp
#include <iostream>
#include <string>
using namespace std;
int main()
{
    string name;
    int mark1, mark2;
    cin >> name;
    cin >> mark1 >> mark2;
    cout << name << ": " << (mark1 + mark2) / 2 << endl;
    return 0;
}
```

## Expected behavior

The first line the user types is the full name (it can contain spaces). The second line holds two whole-number marks. The program prints the full name, `: `, and the average of the marks with its decimal part. For `Omar Ahmed` and `15 18` it prints `Omar Ahmed: 16.5`.

## Tests

### Omar Ahmed, marks 15 and 18

```input
Omar Ahmed
15 18
```

```output
Omar Ahmed: 16.5
```

### Nour Samir, marks 9 and 10

```input
Nour Samir
9 10
```

```output
Nour Samir: 9.5
```

### Mona Ali Hassan, marks 20 and 20

```input
Mona Ali Hassan
20 20
```

```output
Mona Ali Hassan: 20
```

## Solution

```cpp
#include <iostream>
#include <string>
using namespace std;
int main()
{
    string name;
    int mark1, mark2;
    getline(cin, name);
    cin >> mark1 >> mark2;
    cout << name << ": " << (mark1 + mark2) / 2.0 << endl;
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
    int mark1, mark2;
    getline(cin, name);
    cin >> mark1 >> mark2;
    cout << name << ": " << (mark1 + mark2) / 2.0f << endl;
    return 0;
}
```

## Hints

- Where does `cin >>` stop when it reads text? What happens to `Ahmed`?
- Both marks are `int`, and so is `2`. What is `33 / 2`?

## Explanation

There are two separate problems, one in the input and one in the calculation.

1. **`cin >> name` reads one word.** It stops at the first space, so `name` gets only `Omar`. Worse, the next `cin` then tries to read `Ahmed` as a number, and the marks go wrong too. `getline(cin, name)` reads the whole first line, spaces included.
2. **Integer division.** `mark1 + mark2` is an `int` (33) and `2` is an `int`, so `33 / 2` is 16: the .5 is cut off. Dividing by `2.0` makes it a decimal division, `16.5`.

The third test is a reminder that some inputs hide a bug: for 20 and 20 the sum is 40, and `40 / 2` is exactly 20 with either division.
