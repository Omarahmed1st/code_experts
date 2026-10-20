---
slug: intro-write-about-me
type: write_code
title: Print a course label
lesson: what-is-programming-and-why-python
difficulty: easy
updated: 2026-10-15
---

## Question

Write a program that prints exactly these three lines, with a comment on the first line of your program that says what it does:

```
Course: Programming Applications
Lecture: 1
Language: Python
```

Use a comma in the second `print` to print the number 1 after the text `Lecture:`.

## Code

```python
# write your comment here

```

## Expected behavior

The program reads nothing and prints the three lines above, exactly as shown.

## Tests

### the three lines

```output
Course: Programming Applications
Lecture: 1
Language: Python
```

## Solution

```python
# Prints the label for this course
print("Course: Programming Applications")
print("Lecture:", 1)
print("Language: Python")
```

## Hints

- One `print` per line of output.
- `print("Lecture:", 1)` prints the text, a space, then the number.

## Explanation

Each `print` starts a new line, so three lines need three `print` calls. Text goes in quotes. In the second line, the comma puts a space between `Lecture:` and the number `1`. The comment on the first line starts with `#`, so Python skips it; it only tells people what the program is for.
