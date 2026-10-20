---
slug: final-m2-solve-fix-envelope-count
type: correct_code
title: One paper without an envelope
lesson: from-problem-to-program
difficulty: hard
reserved: true
updated: 2026-10-10
---

## Question

**Problem:** a teacher packs exam papers into envelopes. Each envelope holds **20** papers. Read the number of papers and print how many envelopes are needed. Every paper must be packed, so an envelope that is only partly full still counts.

- **Input:** `papers`
- **Processing:** `papers / 20` full envelopes, plus one more if any papers are left over
- **Output:** `Envelopes: ` and the number

The teacher tested the program with **40** papers (it printed 2) and with **45** papers (it printed 3). Both answers are right, but the program is still wrong for some numbers. There is **one** bug, in the condition on line 8. Find a test that shows it, then fix the condition. Don't change any other line.

## Code

```cpp
#include <iostream>
using namespace std;
int main()
{
    int papers;
    cin >> papers;
    int envelopes = papers / 20;
    if (papers % 20 > 1)
    {
        envelopes = envelopes + 1;
    }
    cout << "Envelopes: " << envelopes << endl;
    return 0;
}
```

## Expected behavior

The user types the number of papers (a whole number). The program prints `Envelopes: ` followed by the number of 20-paper envelopes needed so that every paper is packed. For 40 it prints `Envelopes: 2`, for 41 and for 45 it prints `Envelopes: 3`.

## Tests

### every envelope exactly full

```input
40
```

```output
Envelopes: 2
```

### five papers left over

```input
45
```

```output
Envelopes: 3
```

### one paper left over

```input
41
```

```output
Envelopes: 3
```

### one paper left over again (hidden)

```input
21
```

```output
Envelopes: 2
```

## Solution

```cpp
#include <iostream>
using namespace std;
int main()
{
    int papers;
    cin >> papers;
    int envelopes = papers / 20;
    if (papers % 20 > 0)
    {
        envelopes = envelopes + 1;
    }
    cout << "Envelopes: " << envelopes << endl;
    return 0;
}
```

## Also accepted

```cpp
#include <iostream>
using namespace std;
int main()
{
    int papers;
    cin >> papers;
    int envelopes = papers / 20;
    if (papers % 20 != 0)
    {
        envelopes = envelopes + 1;
    }
    cout << "Envelopes: " << envelopes << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int papers;
    cin >> papers;
    int envelopes = papers / 20;
    if (papers % 20 >= 1)
    {
        envelopes = envelopes + 1;
    }
    cout << "Envelopes: " << envelopes << endl;
    return 0;
}
```

```cpp
#include <iostream>
using namespace std;
int main()
{
    int papers;
    cin >> papers;
    int envelopes = papers / 20;
    if (0 < papers % 20)
    {
        envelopes = envelopes + 1;
    }
    cout << "Envelopes: " << envelopes << endl;
    return 0;
}
```

## Hints

- The two tests that passed leave 0 and 5 papers over. Which number of left-over papers was never tested?
- Try 41 papers: what is `41 % 20`? Is it `> 1`? Where does the 41st paper go?

## Explanation

`papers / 20` counts the **full** envelopes, and `papers % 20` is the number of papers left over. If **even one** paper is left over, one more envelope is needed. So the condition must be TRUE for a remainder of 1 or more: `papers % 20 > 0` (or `!= 0`, or `>= 1`).

With `> 1`, a remainder of exactly 1 is missed. For 41 papers, `41 / 20` is 2 and `41 % 20` is 1, and `1 > 1` is FALSE, so the program prints 2 envelopes and one paper is not packed.

The teacher's tests left 0 and 5 papers over, so they could never show this bug. This is the lesson of testing: one or two passing tests don't prove a program correct. Think about the special cases in the problem (here: nothing left over, exactly one left over, several left over) and test each of them.
