---
slug: correct-first-and-last-character
type: correct_code
title: Fix the first and last character
lesson: strings-indexing-and-slicing
difficulty: easy
updated: 2026-10-09
---

## Question

This program should read a word and print its first character followed by its last character. It has **two** bugs. Find them and fix the program.

## Code

```python
word = input()
first = word[1]
last = word[len(word)]
print(first + last)
```

## Expected behavior

The user types one word (at least 1 character). The program prints the first character and the last character joined together. For `Cairo` it prints `Co`. For a 1-character word such as `A`, the first and last character are the same, so it prints `AA`.

## Tests

### Cairo

```input
Cairo
```

```output
Co
```

### Python

```input
Python
```

```output
Pn
```

### a word with one character

```input
A
```

```output
AA
```

## Solution

```python
word = input()
first = word[0]
last = word[-1]
print(first + last)
```

## Also accepted

```python
word = input()
first = word[0]
last = word[len(word) - 1]
print(first + last)
```

## Hints

- At which index does Python start counting?
- `"Cairo"` has 5 characters. Which indexes does it have? Is 5 one of them?

## Explanation

1. **`word[1]` is the second character, not the first.** Indexes start at 0, so the first character is `word[0]`.
2. **`word[len(word)]` is always out of range.** A 5-character word has indexes 0 to 4, so `word[5]` raises `IndexError: string index out of range`. The last character is `word[-1]`, or `word[len(word) - 1]`.

With both fixes, a 1-character word works too: `word[0]` and `word[-1]` are the same character.
