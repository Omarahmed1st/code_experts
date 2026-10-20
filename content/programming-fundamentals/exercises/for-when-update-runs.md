---
slug: for-when-update-runs
type: mcq
title: When does the update run?
lesson: for-loops
difficulty: easy
updated: 2026-10-10
---

## Question

In this loop, **when** does the update `i++` run?

## Code

```cpp
for (int i = 1; i <= 5; i++)
{
    cout << i << endl;
}
```

## Options

- [x] After each pass of the body, just before the condition is checked again.
  Right: the order is initialization, condition, body, update, then back to the condition.
- [ ] Before each pass of the body, because it is written before the body.
  This is the most common confusion. `i++` is written first, but it runs after the body. Otherwise the first number printed would be 2.
- [ ] Only once, at the very start of the loop.
  That is the initialization, `int i = 1`. The update runs again after every pass.
- [ ] Only once, when the condition becomes false.
  When the condition is false, the loop simply ends. The update runs after every pass of the body.

## Hints

- What is the first number this loop prints? What would it be if `i++` ran before the body?
- The three parts run at different times: once, before each pass, after each pass.

## Explanation

The three parts of a `for` header run at different times:

1. **Initialization** `int i = 1`: once, at the start.
2. **Condition** `i <= 5`: before each pass. FALSE ends the loop.
3. **Update** `i++`: after each pass of the body.

So the loop goes: `int i = 1` → `i <= 5 ?` → body → `i++` → back to the condition. That is why the first number printed is 1: the body runs with `i = 1` before `i++` changes it to 2. The update is written first in the header but runs last.
