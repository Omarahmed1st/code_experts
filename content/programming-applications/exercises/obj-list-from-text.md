---
slug: obj-list-from-text
type: mcq
title: A List made from a word
lesson: objects-and-methods
difficulty: medium
updated: 2026-10-16
---

## Question

What does this program print?

## Code

```python
letters = list("Nile")
letters.append("!")
print(len(letters), letters[0])
```

## Options

- [x] `5 N`
  Right: `list("Nile")` makes a List of 4 characters; `append` adds a fifth item.
- [ ] `4 N`
  `append("!")` adds one more item to the List, so there are 5.
- [ ] `2 Nile`
  That would be `["Nile"]` with `"!"` added. `list()` splits a String into its separate characters.
- [ ] `5 Nile`
  The first item is the first character, `N`, not the whole word.

## Answer

```output
5 N
```

## Explanation

Calling `list` with a String creates a **new List object** holding each character as its own item: `['N', 'i', 'l', 'e']`. `append("!")` changes that List to `['N', 'i', 'l', 'e', '!']`, which has 5 items, and index 0 holds `N`.
