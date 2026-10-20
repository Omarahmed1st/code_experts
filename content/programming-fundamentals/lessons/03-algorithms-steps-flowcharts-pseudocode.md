---
slug: algorithms-steps-flowcharts-pseudocode
title: "Algorithms: steps, flowcharts and pseudocode"
topic: algorithms
lecture: 1
difficulty: easy
description: Describe one algorithm in three ways, as plain steps, as a flowchart and as pseudocode, with two worked examples, the average of three numbers and a temperature-controlled fan.
objectives:
  - Say what an algorithm is
  - Describe the same algorithm as plain steps, a flowchart and pseudocode
  - Recognise the five flowchart symbols
  - Write comparison symbols the way C++ needs them
prerequisites:
  - "From problem to program: a method that works"
related:
  - pseudocode-planning-before-code
  - flowcharts
updated: 2026-10-09
---

## [explanation] What is an algorithm?

An **algorithm** is an exact, ordered list of steps that solves a problem. You design the algorithm **before** you write any code. Then the code is just a translation of it.

There are three common ways to write an algorithm down:

| Way | What it looks like | Good for |
|---|---|---|
| **Plain-language steps** | numbered sentences: "1. Start. 2. Read the mark…" | Easy for anyone to understand, but not exact enough to code from directly. |
| **Flowchart** | shapes joined by arrows | Seeing the logic as a picture, especially decisions and repetition. |
| **Pseudocode** | structured English with keywords such as `INPUT`, `IF`, `WHILE` | A bridge between human logic and real code. Each line maps to a line of code. |

## [diagram] The flowchart symbols

Each shape in a flowchart has one meaning. Ovals start and end the chart, parallelograms read or print values, rectangles do calculations, and diamonds ask a question with two exits.

![A legend of flowchart symbols on a navy background: a green oval labelled Start for start and end, a blue parallelogram labelled Input T for input or output, a white rectangle labelled area ← l * w for a process, a yellow diamond labelled T > 30? for a decision with YES and NO exits, and an arrow for the order of the steps](images/flowchart-symbols.png)

## [example] Worked example 1: the average of three numbers

**Problem:** calculate the average of three numbers.

- **Input:** `N1`, `N2`, `N3`
- **Processing:** `SUM = N1 + N2 + N3`, then `AVERAGE = SUM / 3`
- **Output:** `AVERAGE`

**As plain-language steps:**

1. Start.
2. Read the three numbers N1, N2 and N3.
3. Add them and store the result in SUM.
4. Divide SUM by 3 and store the result in AVERAGE.
5. Print AVERAGE.
6. End.

## [diagram] Average of three numbers as a flowchart

Read it from top to bottom. Each step above became one shape.

![A flowchart: Start, then the parallelogram Input N1, N2, N3, then the rectangles SUM ← N1 + N2 + N3 and AVERAGE ← SUM / 3, then the parallelogram Print AVERAGE, then End](images/average-of-three.png)

## [code] Average of three numbers as pseudocode

The same steps in pseudocode. The arrow `←` means "store the value on the right in the name on the left". The user typed `10 20 30`.

```pseudocode program
BEGIN
    INPUT N1, N2, N3
    SUM ← N1 + N2 + N3
    AVERAGE ← SUM / 3
    PRINT AVERAGE
END
```

```input
10 20 30
```

```output
10 20 30
20
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
2 | INPUT | read the three numbers | circle sky
3 | SUM ← N1 + N2 + N3 | processing | square yel
4 | AVERAGE ← SUM / 3 | processing | square yel
5 | PRINT | output | diamond green
```

## [example] Worked example 2: temperature monitoring

**Problem:** a temperature sensor reads the room temperature. If the temperature is greater than 30 °C, turn the fan ON. Otherwise, turn the fan OFF.

- **Input:** the temperature `T`
- **Processing:** compare `T` with 30
- **Output:** `Fan ON` or `Fan OFF`

**As plain-language steps:**

1. Start.
2. Read the temperature T.
3. Check if T > 30.
4. If true, turn the fan ON.
5. Otherwise, turn the fan OFF.
6. End.

Steps 3 to 5 are a **decision**. Only one of step 4 or step 5 happens each time, never both.

## [diagram] Temperature monitoring as a flowchart

The diamond asks the question. The YES path and the NO path meet again before End.

![A flowchart: Start, Input T, then a yellow diamond T > 30?. The YES exit on the left leads to Print "Fan ON", the NO exit on the right leads to Print "Fan OFF", and both paths join and lead to End](images/temperature-fan.png)

## [code] Temperature monitoring as pseudocode

`IF … THEN … ELSE … END IF` is the decision. The sensor read `32`.

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
32
```

```output
32
Fan ON
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
3 | T > 30 | the question: TRUE or FALSE | square yel
4 | PRINT "Fan ON" | when it is TRUE | circle green
6 | PRINT "Fan OFF" | when it is FALSE | tri coral
```

## [code] A peek ahead: the same plan in C++

You will learn every part of this later in the course. For now, compare it with the pseudocode above: the logic is the same, only the way it is written changes.

```cpp program run
#include <iostream>
using namespace std;

int main()
{
    float T;
    cin >> T;
    if (T > 30)
    {
        cout << "Fan ON" << endl;
    }
    else
    {
        cout << "Fan OFF" << endl;
    }
    return 0;
}
```

```input
25
```

```output
25
Fan OFF
```

```notes
7 | cin >> T; | INPUT T | circle sky
8 | if (T > 30) | IF T > 30 THEN | square yel
12 | else | ELSE | tri coral
```

## [common_mistakes] Maths symbols are not C++ symbols

When you write a condition, use the symbols C++ understands. Your keyboard has no `≥` key, and in C++ a single `=` means "store", not "is equal to".

| Meaning | In maths | In C++ (and in our pseudocode) |
|---|---|---|
| is equal to | `=` | `==` |
| is greater than or equal to | `≥` | `>=` |
| is less than or equal to | `≤` | `<=` |
| is not equal to | `≠` | `!=` |
| is greater than / less than | `>` / `<` | `>` / `<` |

## [note] Check yourself

::: check Which flowchart shape do you use for "Read the mark"? And for "Is the mark at least 50?"
???
"Read the mark" is input, so it goes in a **parallelogram**. "Is the mark at least 50?" is a question with a yes/no answer, so it goes in a **diamond**.
:::

::: check Write the condition "age is at least 18" the way C++ needs it.
???
`age >= 18`. "At least" includes 18 itself, so it is `>=`, not `>`.
:::

## [key_takeaways] Key takeaways

- An algorithm is an exact, ordered list of steps, designed before any code.
- The same algorithm can be written as plain steps, a flowchart or pseudocode. Same logic, different representation.
- Flowchart shapes: oval = start/end, parallelogram = input/output, rectangle = process, diamond = decision, arrow = order.
- A decision creates two possible paths, and only one of them runs.
- In conditions, write `==`, `>=`, `<=` and `!=`, not the maths symbols.
