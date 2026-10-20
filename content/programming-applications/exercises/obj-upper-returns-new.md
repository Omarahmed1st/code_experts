---
slug: obj-upper-returns-new
type: mcq
title: Did upper() change the name?
lesson: objects-and-methods
difficulty: medium
updated: 2026-10-16
---

## Question

What does this program print?

## Code

```python
name = "omar"
name.upper()
print(name)
```

## Options

- [x] `omar`
  Right: `upper()` gives back a new String, but nothing keeps it, and `name` still holds `"omar"`.
- [ ] `OMAR`
  That would happen with `name = name.upper()` or `print(name.upper())`. Line 2 throws the new String away.
- [ ] `Omar`
  `upper()` makes every letter a capital, and anyway its result is not stored here.
- [ ] Nothing: line 2 is an error.
  Calling `upper()` on its own is allowed. It just has no lasting effect.

## Answer

```output
omar
```

## Explanation

String methods never change the String they belong to. `name.upper()` builds a **new** String, `"OMAR"`, and gives it back. Line 2 doesn't store it anywhere, so it is lost, and `name` still refers to `"omar"`.

To keep the capitals, store the result: `name = name.upper()`. List methods such as `append()` are different: they change the List itself.
