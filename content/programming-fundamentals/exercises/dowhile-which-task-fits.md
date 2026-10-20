---
slug: dowhile-which-task-fits
type: mcq
title: Which task needs a do-while?
lesson: do-while-and-choosing-a-loop
difficulty: medium
updated: 2026-10-10
---

## Question

Which of these tasks fits a `do-while` loop **best**?

## Options

- [ ] Print the 6 marks of a student, one per line.
  The count, 6, is known before the loop starts. Count known → `for`.
- [ ] Print the numbers from 1 to `n`, where `n` is typed by the user and may be 0 (then nothing should be printed).
  A do-while body always runs at least once, so it would print something even when `n` is 0. This task needs a loop that can run 0 times.
- [x] Ask the user for their age, and ask again while the age is less than 1.
  Right: the question must be asked at least once before the program can check the answer. Must run once → `do-while`.
- [ ] Count down from 10 to 1.
  The start, the end and the step are all known. Count known → `for`.

## Hints

- What is special about a do-while body? How many times does it run at least?
- For each task, ask: must the body run at least once, or can it run 0 times?

## Explanation

Any loop can be rewritten as another, so the question is which one is **clearest**. The rule of thumb:

- **Count known** → `for`
- **Count unknown** (repeat until something happens) → `while`
- **Must run once** (show a menu, ask for input) → `do-while`

Checking input is the classic do-while task: you can't check the age before you have asked for it, so the body must run at least once. The task with `n = 0` is the opposite: there the body must be able to run **zero** times, and a do-while can't do that.
