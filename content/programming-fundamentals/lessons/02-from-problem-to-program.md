---
slug: from-problem-to-program
title: "From problem to program: a method that works"
topic: problem-solving
lecture: 1
difficulty: easy
description: Solve programming problems in a fixed order. Understand the problem, find its input, processing and output, plan the steps, then write, test and refine the code.
objectives:
  - Follow the three-step process from problem to program
  - Break a problem into input, processing and output
  - Write an everyday task as ordered steps
  - Use test cases to find a mistake and fix it
prerequisites:
  - What is programming?
related:
  - what-is-programming
  - algorithms-steps-flowcharts-pseudocode
updated: 2026-10-09
---

## [explanation] A 3-step process

Every problem in this course is solved the same way:

1. **Understand the problem.** Read it carefully. Find the inputs, the outputs and the rules (constraints). Decide what the program must do before writing any code.
2. **Design an algorithm.** Break the solution into clear, ordered steps. Plan them with a flowchart or pseudocode first.
3. **Implement and test.** Translate the steps into code, run it with test cases, find the errors and fix them until the results are correct.

## [explanation] The same method in more detail

Professional programmers use a slightly longer version of the same idea. Each stage has one job:

| Stage | What you do |
|---|---|
| **Define the problem** | Say clearly what the program must do: its inputs, the expected outputs and any limits. |
| **Analyze the requirements** | Break the problem into smaller parts. Decide what kind of data you need (whole numbers, decimals, text), which special cases exist, and which conditions must be checked. |
| **Develop an algorithm** | Write a step-by-step solution in pseudocode or as a flowchart. |
| **Test, debug and refine** | Run test cases, find the errors and correct them. Repeat until the output is right every time. |

## [example] Input → Processing → Output

Every computer solution has three parts: it **captures input**, **processes** it, and **delivers output**. Finding these three is always your first move.

**Problem:** a temperature sensor reads the room temperature. If it is greater than 30 °C, turn the fan ON. Otherwise, turn the fan OFF.

| Part | Answer |
|---|---|
| Input | the temperature `T` |
| Processing | compare `T` with 30 |
| Output | `Fan ON` or `Fan OFF` |

**Problem:** calculate the average of three numbers.

| Part | Answer |
|---|---|
| Input | the three numbers `N1`, `N2`, `N3` |
| Processing | add them, then divide the sum by 3 |
| Output | the average |

## [example] An everyday algorithm: making tea

You don't need a computer to think in steps. Here is making a cup of tea written as an algorithm:

1. Start.
2. Fill the kettle with water.
3. Switch the kettle on and wait until the water boils.
4. Put a tea bag in a cup.
5. Pour the hot water into the cup.
6. Wait 3 minutes, then take the tea bag out.
7. If you want sugar, add it and stir.
8. End.

Notice that the order matters (you can't pour before the water boils), and that step 7 is a **decision**: it only happens when the answer is yes. Programs work the same way.

## [common_mistakes] Testing finds a mistake

This program should print the average of three numbers. We test it with `3`, `6` and `9`. We know the answer should be `6`, because (3 + 6 + 9) / 3 = 18 / 3 = 6.

```cpp program run
#include <iostream>
using namespace std;

int main()
{
    float n1, n2, n3;
    cin >> n1 >> n2 >> n3;
    float average = n1 + n2 + n3 / 3;
    cout << "Average = " << average << endl;
    return 0;
}
```

```input
3 6 9
```

```output
3 6 9
Average = 12
```

```notes
8 | n1 + n2 + n3 / 3 | wrong: only n3 is divided | tri coral
```

## [explanation] Debug and refine

The test failed: we expected `6` but got `12`. Now we **debug**: we look for the cause.

In C++, as in maths, division happens **before** addition. So the line calculates `3 + 6 + (9 / 3)`, which is `3 + 6 + 3 = 12`. Only `n3` was divided.

The **fix** is to add brackets so the sum is worked out first: `(n1 + n2 + n3) / 3`.

## [code] The refined program

Same test, same input, and now the output matches what we expected.

```cpp program run
#include <iostream>
using namespace std;

int main()
{
    float n1, n2, n3;
    cin >> n1 >> n2 >> n3;
    float average = (n1 + n2 + n3) / 3;
    cout << "Average = " << average << endl;
    return 0;
}
```

```input
3 6 9
```

```output
3 6 9
Average = 6
```

```notes
8 | (n1 + n2 + n3) / 3 | add first, then divide | circle green
```

## [note] Check yourself

::: check A program reads a student's mark and prints PASS or FAIL. Name its input, processing and output.
???
**Input:** the mark. **Processing:** compare the mark with the pass mark (for example 50). **Output:** `PASS` or `FAIL`.
:::

::: check You test a program once and it prints the right answer. Is it correct?
???
Not necessarily. One test only shows it works for that one input. Test several cases, including the edges, such as the exact pass mark.
:::

## [key_takeaways] Key takeaways

- Understand the problem, design an algorithm, then implement and test.
- Always start by finding the **input**, the **processing** and the **output**.
- An algorithm is a list of ordered steps; some steps are decisions.
- Testing with values you can check by hand shows when the code is wrong; then debug, fix and test again.
