---
slug: pseudocode-planning-before-code
title: "Pseudocode: planning before code"
topic: pseudocode
lecture: 2
difficulty: easy
description: Write an algorithm in structured English with BEGIN, INPUT, PRINT, ← and IF … THEN … ELSE … END IF, then see how each line turns into C++.
objectives:
  - Explain what pseudocode is and why we use it
  - Use the BEGIN, INPUT, PROCESS, OUTPUT, END template
  - Use the keywords INPUT, PRINT, SET / ←, IF, THEN, ELSE and END IF
  - Go from a problem to pseudocode in three steps
prerequisites:
  - "Algorithms: steps, flowcharts and pseudocode"
related:
  - algorithms-steps-flowcharts-pseudocode
  - variables-named-boxes-in-memory
updated: 2026-10-09
---

## [explanation] What is pseudocode?

**Pseudocode** is an informal way of describing an algorithm with simple, structured, English-like statements.

- It is **not** a real programming language, so no computer runs it.
- It has **no strict syntax rules**. It is written for people.
- It focuses on the **logic**, not on the details of a language.
- It helps you **plan** a program before you write it.

Pseudocode sits between how we think and how a computer is programmed:

**human thinking** (ideas and logic) → **pseudocode** (structured English) → **programming code** (C++, Python, Java…)

## [explanation] Why do we use pseudocode?

- **Easy to read:** plain, structured English that anyone can follow.
- **Helps plan logic:** you think about the steps before worrying about semicolons and brackets.
- **Language independent:** the same pseudocode works for C++, Python, Java or any other language.
- **Easy to convert into code:** each line maps naturally to a line of code.

::: tip
Think first. Code later. Most beginner errors are logic errors, not typing errors, and pseudocode is where you catch them.
:::

## [code] The basic structure

Almost every simple algorithm follows the same template: **input → process → output**, between `BEGIN` and `END`.

```pseudocode program
BEGIN
    INPUT data
    PROCESS data
    OUTPUT result
END
```

```notes
1 | BEGIN | start of the algorithm | circle green
2 | INPUT | read data | square sky
3 | PROCESS | do the calculations | diamond yel
4 | OUTPUT | show the result | tri green
5 | END | end of the algorithm | circle green
```

## [explanation] Pseudocode keywords

These are the words we use in this course. Write them in **CAPITALS** so every step stands out.

| Keyword | Meaning |
|---|---|
| `BEGIN` | start of the algorithm |
| `END` | end of the algorithm |
| `INPUT` | read a value (from the user or a sensor) |
| `PRINT` | display a value |
| `SET` / `←` | store a value: `SET x ← 5` and `x ← 5` mean the same thing |
| `IF` | start a decision and check a condition |
| `THEN` | what to do when the condition is TRUE |
| `ELSE` | what to do when the condition is FALSE |
| `END IF` | end of the decision |

The decision keywords always come as a group: `IF … THEN … ELSE … END IF`.

## [code] Example: calculate the average

**Problem:** calculate the average of three numbers. The user typed `12 15 18`.

```pseudocode program
BEGIN
    INPUT N1, N2, N3
    SUM ← N1 + N2 + N3
    AVERAGE ← SUM / 3
    PRINT AVERAGE
END
```

```input
12 15 18
```

```output
12 15 18
15
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    float n1, n2, n3;
    cin >> n1 >> n2 >> n3;
    float sum = n1 + n2 + n3;
    float average = sum / 3;
    cout << average << endl;
    return 0;
}
```

```notes
2 | INPUT N1, N2, N3 | INPUT: read by the user | circle sky
3 | SUM ← N1 + N2 + N3 | PROCESSING | square yel
4 | AVERAGE ← SUM / 3 | PROCESSING | square yel
5 | PRINT AVERAGE | OUTPUT: the result | diamond green
```

## [code] Example: a decision

The temperature problem from Lecture 1, with the decision keywords. This time the sensor read `25`.

```pseudocode program
BEGIN
    INPUT T
    IF T > 30 THEN
        PRINT "Fan ON"
    ELSE
        PRINT "Fan OFF"
    END IF
END
```

```input
25
```

```output
25
Fan OFF
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    float t;
    cin >> t;
    if (t > 30)
        cout << "Fan ON" << endl;
    else
        cout << "Fan OFF" << endl;
    return 0;
}
```

```notes
3 | IF | starts the decision | circle yel
3 | THEN | TRUE path | square green
5 | ELSE | FALSE path | tri coral
7 | END IF | closes the decision | diamond sky
```

## [example] From problem to pseudocode in three steps

**Problem:** read the length and width of a rectangle and calculate its area.

**Step 1: identify the variables.** We need `length`, `width` and `area`.

**Step 2: choose the data types.** Lengths can have decimals (2.5 m), so `float` is the safe choice for all three.

| Variable | Data type |
|---|---|
| `length` | `float` |
| `width` | `float` |
| `area` | `float` |

**Step 3: write the pseudocode.** You'll find it in the next section.

- **Input:** `length`, `width`
- **Processing:** `area ← length * width`
- **Output:** `area`

## [code] Rectangle area in pseudocode

Two `INPUT` lines, one calculation, one `PRINT`. The user typed `8`, then `5`.

```pseudocode program
BEGIN
    INPUT length
    INPUT width
    area ← length * width
    PRINT area
END
```

```input
8
5
```

```output
8
5
40
```

```cpp verify
#include <iostream>
using namespace std;
int main()
{
    float length, width;
    cin >> length;
    cin >> width;
    float area = length * width;
    cout << area << endl;
    return 0;
}
```

```notes
2 | INPUT length | first input | circle sky
3 | INPUT width | second input | circle sky
4 | length * width | * means multiply | square yel
5 | PRINT area | output | diamond green
```

## [explanation] Each line becomes a line of C++

When the plan is right, turning it into C++ is mostly a matter of swapping words for symbols:

| Pseudocode | C++ |
|---|---|
| `INPUT length` | `cin >> length;` |
| `area ← length * width` | `area = length * width;` |
| `PRINT area` | `cout << area;` |
| `IF T > 30 THEN … ELSE … END IF` | `if (T > 30) { … } else { … }` |
| `BEGIN … END` | `int main() { … }` |

In C++ every statement ends with a semicolon `;`. You'll write the full rectangle program in C++ in the flowcharts lecture.

## [note] Check yourself

::: check Write pseudocode that reads a rectangle's length and width and prints its perimeter.
???
```pseudocode
BEGIN
    INPUT length
    INPUT width
    perimeter ← 2 * (length + width)
    PRINT perimeter
END
```
:::

::: check Is there one "correct" way to write pseudocode?
???
No. Pseudocode has no strict syntax, because it is for people. What matters is that the steps are clear, in the right order, and easy to turn into code. Using the same keywords as your class makes it easier for others to read.
:::

## [key_takeaways] Key takeaways

- Pseudocode is structured English for planning an algorithm. No computer runs it.
- The basic template is `BEGIN`, input, process, output, `END`.
- `←` (or `SET`) stores a value; `INPUT` reads one; `PRINT` shows one.
- Decisions are written `IF … THEN … ELSE … END IF`.
- To solve a problem: identify the variables, choose their data types, then write the pseudocode.
