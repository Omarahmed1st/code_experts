---
slug: write-word-parts
type: write_code
title: Length, first, last and middle
lesson: strings-indexing-and-slicing
difficulty: medium
updated: 2026-10-09
---

## Question

Write a program that reads one word and prints four lines:

1. `Length:` and the number of characters
2. `First:` and the first character
3. `Last:` and the last character
4. `Middle:` and the word without its first and last characters

Use indexing and slicing. Your program must work for a word of any length, even one character.

## Code

```python
word = input()
# print the four lines here

```

## Expected behavior

For `Python` the program prints:

```
Length: 6
First: P
Last: n
Middle: ytho
```

For a 1-character word such as `A`, the first and last character are both `A` and the middle is empty, so the last line is just `Middle:`.

## Tests

### Python

```input
Python
```

```output
Length: 6
First: P
Last: n
Middle: ytho
```

### Cairo

```input
Cairo
```

```output
Length: 5
First: C
Last: o
Middle: air
```

### one character

```input
A
```

```output
Length: 1
First: A
Last: A
Middle:
```

## Solution

```python
word = input()
print("Length:", len(word))
print("First:", word[0])
print("Last:", word[-1])
print("Middle:", word[1:-1])
```

## Hints

- `len(word)` gives the number of characters.
- The last character is `word[-1]`. You don't need to know the length to reach it.
- For the middle, start the slice at 1 and stop **before** the last character. A negative number works as a slice stop too.

## Explanation

- `len(word)` counts the characters.
- `word[0]` is the first character and `word[-1]` the last, for any length.
- `word[1:-1]` starts at index 1 (the second character) and stops **before** index -1 (the last one), so it drops one character from each end. You can also write `word[1:len(word) - 1]`.

For `"A"`, `word[1:-1]` is an empty String. That's not an error: a slice that has nothing in it just gives `""`. `print("Middle:", "")` prints `Middle:` followed by a space, which you can't see.
