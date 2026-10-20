---
slug: vars-name-or-text
type: mcq
title: The name or the word?
lesson: variables-and-data-types
difficulty: easy
updated: 2026-10-16
---

## Question

What does this program print?

## Code

```python
name = "Sara"
print("name", name)
```

## Options

- [x] `name Sara`
  Right: `"name"` in quotes is the word itself; `name` without quotes is the variable, which holds `Sara`.
- [ ] `Sara Sara`
  Only the second item is the variable. The first one is in quotes, so it is just the text `name`.
- [ ] `name name`
  The second item has no quotes, so Python looks inside the variable and prints its value.
- [ ] `"name" Sara`
  The quotes only mark where the text starts and ends; they are not printed.

## Answer

```output
name Sara
```

## Explanation

Quotes mean "this exact text". No quotes mean "the value of this variable". So `print("name", name)` prints the word `name`, a space, and then the value stored in `name`, which is `Sara`.
