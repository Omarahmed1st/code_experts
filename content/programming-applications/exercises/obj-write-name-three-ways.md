---
slug: obj-write-name-three-ways
type: write_code
title: A name three ways
lesson: objects-and-methods
difficulty: easy
updated: 2026-10-16
---

## Question

Write a program that reads a name, however it was typed, and prints it three ways, each on its own line:

1. all in capital letters
2. all in small letters
3. with only the first letter a capital

Use String methods, and `input()` without a prompt.

## Code

```python
# read the name here

```

## Expected behavior

For `oMAR` the program prints:

```
OMAR
omar
Omar
```

## Tests

### oMAR

```input
oMAR
```

```output
OMAR
omar
Omar
```

### sara

```input
sara
```

```output
SARA
sara
Sara
```

## Solution

```python
name = input()
print(name.upper())
print(name.lower())
print(name.title())
```

## Hints

- Strings have `upper()`, `lower()` and `title()`.
- Each method gives back a new String, so the name you read stays the same for the next line.

## Explanation

The three String methods each build a new String from `name` and give it back to `print`. Because none of them changes `name` itself, every line starts from the name exactly as it was typed.
