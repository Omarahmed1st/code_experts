---
slug: dowhile-correct-syntax
type: mcq
title: Writing a do-while correctly
lesson: do-while-and-choosing-a-loop
difficulty: easy
updated: 2026-10-10
---

## Question

The program should ask for a number, then ask again while the number is 0 or less. Which of these is a correct `do-while` loop?

## Options

- [x] `do { cin >> number; } while (number <= 0);`
  Right: `do` opens the loop, the body comes first, and `while (condition);` ends it with a semicolon.
- [ ] `do { cin >> number; } while (number <= 0)`
  The semicolon after `while (number <= 0)` is missing. In a do-while it is required, and g++ stops with an error without it.
- [ ] `do (number <= 0) { cin >> number; }`
  The condition doesn't go after `do`. In a do-while it comes at the end, after the body.
- [ ] `while (number <= 0); { cin >> number; }`
  This is a normal `while` with a bug: the `;` becomes the whole loop body. It also checks `number` before any value has been read.

## Hints

- In a do-while, where is the condition: before the body or after it?
- Which `while ( … )` line needs a semicolon: the one in a do-while or the one in a normal while?

## Explanation

A `do-while` loop has this shape:

```cpp
do
{
    statements;
}
while (condition);
```

The keyword `do` opens it, the body comes first, and the condition is checked at the end. The line `while (condition);` **must** end with a semicolon.

Be careful: a normal `while` loop needs the opposite rule. There, a semicolon right after `while ( … )` is a bug, because the `;` becomes an empty body.
