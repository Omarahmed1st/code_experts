---
slug: strings-cannot-change
type: mcq
title: Which lines stop with an error?
lesson: strings-indexing-and-slicing
difficulty: medium
multiple: true
updated: 2026-10-09
---

## Question

A program starts with this line:

```python
name = "Mona"
```

Which of the lines below would stop the program with an error if they came next? Pick **all** that are right.

## Options

- [x] `name[0] = "N"`
  Right: Strings can't be changed in place. Python raises a `TypeError`.
- [x] `print(name[4])`
  Right: `"Mona"` has 4 characters with indexes 0 to 3. Index 4 raises an `IndexError`.
- [ ] `print(name[2:10])`
  No error: a slice that goes past the end just stops at the last character. It prints `na`.
- [ ] `name = "N" + name[1:]`
  No error: this builds a **new** String, `"Nona"`, and stores it in `name`. The old String was not changed.

## Hints

- Can you change one character of a String, or must you build a new String?
- Indexing past the end and slicing past the end don't behave the same way.

## Explanation

Two lines fail:

- `name[0] = "N"` tries to change one character. A String is **immutable**: it can't be changed after it is made. You get `TypeError: 'str' object does not support item assignment`.
- `name[4]` asks for a fifth character, but the last index of a 4-character String is `len(name) - 1`, which is 3. You get `IndexError: string index out of range`.

The other two lines are fine. A slice never goes out of range, and `"N" + name[1:]` is the right way to "change" a String: make a new one from pieces of the old one.
