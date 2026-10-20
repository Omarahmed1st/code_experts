---
slug: obj-attribute-error
type: mcq
title: A method the object doesn't have
lesson: objects-and-methods
difficulty: easy
updated: 2026-10-16
---

## Question

What happens when this program runs?

## Code

```python
name = "Omar"
name.append("!")
print(name)
```

## Options

- [x] It stops on line 2 with an `AttributeError`, and nothing is printed.
  Right: `append` is a List method. A String object doesn't have it.
- [ ] It prints `Omar!`
  That would need `name + "!"`. Strings have no `append` method.
- [ ] It prints `Omar`
  Python never reaches line 3: line 2 stops the program first.
- [ ] It stops with a `SyntaxError` before running any line.
  The line is written correctly, so Python starts running. The problem is only found when line 2 runs and the String has no `append`.

## Explanation

Each kind of object has **its own** methods. Lists have `append()`; Strings don't. When line 2 runs, Python looks for a method called `append` on the String `"Omar"`, can't find one, and stops with:

`AttributeError: 'str' object has no attribute 'append'`

To add `!` to the end of a String, join a new String: `name = name + "!"`.
