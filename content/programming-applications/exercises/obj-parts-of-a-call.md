---
slug: obj-parts-of-a-call
type: mcq
title: Which part is the method?
lesson: objects-and-methods
difficulty: easy
updated: 2026-10-16
---

## Question

In this line, which part is the **method**?

## Code

```python
students.append("Sara")
```

## Options

- [x] `append`
  Right: `append` is the operation that belongs to the List. It comes straight after the dot.
- [ ] `students`
  `students` is the **object**: the List that receives the call.
- [ ] `"Sara"`
  `"Sara"` is the **argument**: the extra information `append` needs, here the item to add.
- [ ] `.`
  The dot only means "use something belonging to this object". It joins the object to the method.

## Explanation

Read a method call from left to right: **object**, **dot**, **method**, then the **argument** in brackets.

| `students` | `.` | `append` | `("Sara")` |
|---|---|---|---|
| the object | the dot | the method | the argument |
