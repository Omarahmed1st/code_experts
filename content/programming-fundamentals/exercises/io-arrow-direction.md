---
slug: io-arrow-direction
type: mcq
title: Reading the user's age
lesson: input-and-output-with-cout-and-cin
difficulty: easy
updated: 2026-10-10
---

## Question

The program has `int age;` and has just printed the prompt `Enter your age: `. Which line reads the number the user types and stores it in `age`?

## Options

- [x] `cin >> age;`
  Right: `cin` reads from the keyboard, and `>>` points into `age`, the way the data flows.
- [ ] `cin << age;`
  The arrows point the wrong way. With `cin` you always use `>>`; `cin << age` does not compile.
- [ ] `cout >> age;`
  `cout` sends values **to the screen**. It cannot read what the user types.
- [ ] `cin >> "age";`
  `"age"` in quotes is fixed text, not a variable. `cin` needs a variable (a box) to store the value in.

## Hints

- Which object talks to the keyboard: `cin` or `cout`?
- The arrows point the way the data flows. Where does the typed value go?

## Explanation

Input uses `cin` with `>>`, and output uses `cout` with `<<`. The arrows show the direction of the data: in `cin >> age`, the value comes in from the keyboard and goes **into** the variable `age`.

`cin` needs a variable on the right, because it must store the value somewhere. A string in quotes like `"age"` is fixed text, so nothing can be stored in it. Note also that `cin` prints nothing; that is why the program prints a prompt with `cout` first.
