---
slug: intro-trace-comments-and-commas
type: trace
title: Comments and commas
lesson: what-is-programming-and-why-python
difficulty: easy
updated: 2026-10-15
---

## Question

What exactly does this program print? Type one line of output per line.

## Code

```python
# Lecture 1 notes
print("Python", "is", "simple")
# print("C++ needs more lines")
print("Lines:", 1)
print("Done")
```

## Answer

```output
Python is simple
Lines: 1
Done
```

## Hints

- Python skips every line that starts with `#`.
- A comma between two items prints them with one space between.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 1 | a comment: skipped | | |
| 2 | three items, separated by spaces | | Python is simple\n |
| 3 | a comment: skipped, even though it looks like code | | |
| 4 | the text and the number 1 | | Lines: 1\n |
| 5 | one item | | Done\n |

## Explanation

Lines 1 and 3 start with `#`, so they are **comments** and never run. Line 3 looks like a `print`, but the `#` in front turns the whole line into a note for people.

`print` with commas prints every item on one line with a single space between them, so `print("Python", "is", "simple")` gives `Python is simple`, and `print("Lines:", 1)` gives `Lines: 1`. Each `print` then starts a new line.
