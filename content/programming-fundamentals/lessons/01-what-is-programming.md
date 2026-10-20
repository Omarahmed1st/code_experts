---
slug: what-is-programming
title: What is programming?
topic: introduction-to-programming
lecture: 1
difficulty: easy
description: A program is a list of exact steps a computer follows to turn input into output. See how a C++ program runs, and why good programmers think first and code second.
objectives:
  - Say what a program is in one sentence
  - Name the input, the processing and the output of a small program
  - Describe how C++ source code becomes something the CPU can run
  - List the four stages of programming, from understanding to testing
prerequisites:
  - None. This is the first lecture.
related:
  - from-problem-to-program
  - algorithms-steps-flowcharts-pseudocode
updated: 2026-10-09
---

## [explanation] A program is a set of instructions

A **program** is a set of step-by-step instructions that a computer follows. The computer does exactly what the steps say, in the order they are written. It never guesses what you meant.

Three ideas sit behind every program:

- A program is a list of **precise steps**.
- A program turns **input** into meaningful **output**.
- Programmers write those steps in a **programming language**, such as C++, so that both people and the computer can read them.

A recipe is a good everyday picture. The ingredients are the input, the cooking steps are the processing, and the finished meal is the output. A recipe that says "add some salt" is fine for a person. A computer needs "add 5 grams of salt".

## [explanation] Programming is not just coding

Typing code is only one part of programming. The work goes through four stages:

1. **Understand** the problem: what goes in, what must come out, and what the rules are.
2. **Design** the solution: plan the steps, for example with a flowchart or pseudocode.
3. **Write** the code in a programming language.
4. **Test and improve**: run it with real values, find mistakes and fix them.

::: tip
Good programmers think first, then code. Most beginner bugs are mistakes in the plan, not typing mistakes.
:::

## [explanation] How a program runs

You write a C++ program as plain text. This text is called the **source code**. The computer's processor (the **CPU**) can't read C++ directly. It only understands **machine code**: very simple instructions stored as numbers.

So there is a translation step:

| Step | What happens |
|---|---|
| 1. Write | You type the source code, for example in a file called `main.cpp`. |
| 2. Compile | A program called a **compiler** checks your code and translates it into machine code. If something is wrong, it stops and shows an error. |
| 3. Run | The CPU carries out the machine instructions one after another, very fast. |

On this site, the C++ outputs you see were made exactly this way: we compiled each program and ran it, and the OUTPUT box shows what it printed.

## [code] Your first C++ program

This program has no input. It prints two lines, in order, and stops.

```cpp program run
#include <iostream>
using namespace std;

int main()
{
    cout << "Hello! I am a program." << endl;
    cout << "I follow my steps in order." << endl;
    return 0;
}
```

```output
Hello! I am a program.
I follow my steps in order.
```

```notes
1 | iostream | lets us print with cout | circle sky
4 | int main() | the program starts here | square yel
6 | cout | prints to the screen | diamond green
6 | endl | moves to a new line | tri sky
8 | return 0; | finished with no problems | circle green
```

## [code] Input, processing and output

Here is a program with all three parts. It **reads** two numbers (input), **adds** them (processing) and **prints** the sum (output). The user typed `4 7` and pressed Enter.

```cpp program run
#include <iostream>
using namespace std;

int main()
{
    int a, b;
    cout << "Enter two numbers: ";
    cin >> a >> b;
    int sum = a + b;
    cout << "Sum = " << sum << endl;
    return 0;
}
```

```input
4 7
```

```output
Enter two numbers: 4 7
Sum = 11
```

```notes
8 | cin >> a >> b; | INPUT: read two numbers | circle sky
9 | a + b | PROCESSING: add them | square yel
10 | cout | OUTPUT: show the result | diamond green
```

## [explanation] Reading the OUTPUT box

The OUTPUT box shows the screen as the user saw it. The green text, `4 7`, is what the **user typed**. Everything else was **printed by the program**. You will learn `cin` and `cout` properly in a later lecture; for now, notice the three parts and the order they run in.

## [note] Check yourself

::: check A calculator app adds a 14% tax to a price. What is the input, the processing and the output?
???
**Input:** the price. **Processing:** multiply the price by 0.14 and add the result to the price. **Output:** the final price, shown on the screen.
:::

::: check Which stage comes first: writing the code, or understanding the problem?
???
Understanding the problem. If you don't know what goes in and what must come out, you can't plan the steps, and code written without a plan usually has to be rewritten.
:::

## [key_takeaways] Key takeaways

- A program is a set of precise, step-by-step instructions that a computer follows exactly.
- Every program turns **input** into **output** through **processing**.
- C++ source code is translated by a **compiler** into machine code, which the CPU runs.
- Programming is understand → design → write → test and improve. Think first, then code.
