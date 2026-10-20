---
slug: string-negative-index
type: mcq
title: Negative and positive indexes together
lesson: strings-indexing-and-slicing
difficulty: easy
updated: 2026-10-09
---

## Question

What does this program print?

## Code

```python
word = "Egypt"
print(word[-2] + word[1])
```

## Options

- [x] `pg`
  Right: `word[-2]` is the second character from the end, `p`, and `word[1]` is the second character, `g`.
- [ ] `yE`
  Negative indexes start at -1 for the last character, so -2 is `p`, not `y`. And `word[1]` is the second character, not the first.
- [ ] `pE`
  `word[-2]` is right, but indexes start at 0: `word[1]` is `g`, the second character.
- [ ] Nothing: negative indexes cause an `IndexError`.
  Negative indexes are allowed in Python. They count from the end of the String.

## Answer

```output
pg
```

## Hints

- Write the indexes under each letter: E is 0, g is 1, y is 2, p is 3, t is 4.
- Now write the negative indexes: t is -1. Which letter is -2?

## Explanation

Python numbers the characters of `"Egypt"` in two ways:

| Character | E | g | y | p | t |
|---|---|---|---|---|---|
| Index | 0 | 1 | 2 | 3 | 4 |
| Negative index | -5 | -4 | -3 | -2 | -1 |

`word[-2]` is `p` and `word[1]` is `g`. Using `+` on two Strings joins them, so the program prints `pg`.
