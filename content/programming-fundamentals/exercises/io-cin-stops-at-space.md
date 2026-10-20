---
slug: io-cin-stops-at-space
type: mcq
title: A name with a space
lesson: input-and-output-with-cout-and-cin
difficulty: medium
updated: 2026-10-10
---

## Question

The user runs this program and types `Nour Ali`, then presses Enter. What does the program print after the user's typing?

## Code

```cpp
#include <iostream>
#include <string>
using namespace std;
int main()
{
    string name;
    cin >> name;
    cout << "Welcome, " << name << "!" << endl;
    return 0;
}
```

## Options

- [ ] `Welcome, Nour Ali!`
  That would need `getline(cin, name)`. `cin >>` stops reading at the first space.
- [x] `Welcome, Nour!`
  Right: `cin >> name` reads one word. It stops at the space, so `name` holds only `Nour`.
- [ ] `Welcome, Ali!`
  `cin` reads from the start of what was typed, so it gets the first word, not the last one.
- [ ] Nothing: a `string` can't hold text the user types.
  A `string` variable can store typed text. The problem is only that `cin >>` reads one word.

## Hints

- Where does `cin >>` stop when it reads a string?
- Which function reads the whole line, spaces included?

## Explanation

`cin >>` reads **one word**: it skips spaces before the word and stops at the first space after it. So when the user types `Nour Ali`, only `Nour` is stored in `name`, and the program prints `Welcome, Nour!`. The word `Ali` is not lost forever, but this program never reads it.

To read a full name with spaces, use `getline(cin, name);`. It reads everything the user typed up to the Enter key.
