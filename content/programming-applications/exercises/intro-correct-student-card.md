---
slug: intro-correct-student-card
type: correct_code
title: Fix the student card
lesson: what-is-programming-and-why-python
difficulty: easy
updated: 2026-10-15
---

## Question

This program should print a small student card on three lines. It has **two mistakes**. Fix them so it prints exactly the expected output.

## Code

```python
print("Student card")
print(Name: Omar)
Print("Year:", 1)
```

## Expected behavior

The program prints exactly:

```
Student card
Name: Omar
Year: 1
```

## Tests

### the card

```output
Student card
Name: Omar
Year: 1
```

## Solution

```python
print("Student card")
print("Name: Omar")
print("Year:", 1)
```

## Also accepted

```python
print("Student card")
print("Name:", "Omar")
print("Year:", 1)
```

```python
print("Student card")
print("Name: Omar")
print("Year: 1")
```

```python
print("Student card")
print("Name:", "Omar")
print("Year: 1")
```

## Hints

- Text always goes inside quotes.
- Python is case-sensitive. Look at the first letter of every function name.

## Explanation

1. **Line 2:** `Name: Omar` has no quotes, so Python tries to read it as code and stops with a `SyntaxError` before anything runs. Put the text in quotes: `print("Name: Omar")`, or `print("Name:", "Omar")`, which prints the same line.
2. **Line 3:** `Print` with a capital P is a `NameError`. The function is `print`, in small letters.

`print("Year:", 1)` and `print("Year: 1")` both print `Year: 1`: with a comma, `print` adds the space itself.
