---
slug: intro-compiler-job
type: mcq
title: What the compiler does
lesson: what-is-programming
difficulty: medium
updated: 2026-10-10
---

## Question

You have written a C++ program in a file called `main.cpp`. Why does it need a **compiler** before the CPU can run it?

## Options

- [ ] The compiler makes the program run faster by removing the slow lines.
  The compiler does not remove lines. Its job is to translate the code.
- [ ] The compiler prints the output of the program on the screen.
  Printing happens when the program **runs**. The compiler works before that.
- [x] The CPU only understands machine code, so the compiler translates the C++ source code into machine code.
  Right: the CPU can't read C++ directly. The compiler checks the code and translates it.
- [ ] The compiler fixes all the mistakes in the program automatically.
  If something is wrong, the compiler stops and shows an error. You have to fix it yourself.

## Hints

- What language does the CPU understand?
- The steps are: write, compile, run. What changes between "write" and "run"?

## Explanation

The C++ text you type is called the **source code**. The CPU can't read C++; it only understands **machine code**, which is very simple instructions stored as numbers.

The **compiler** is the program that checks your source code and translates it into machine code. If it finds something wrong, it stops and shows an error instead. Only after this translation can the CPU **run** the instructions, one after another.
