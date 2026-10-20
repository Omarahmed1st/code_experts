---
slug: vars-correct-student-record
type: correct_code
title: Fix the student record
lesson: variables-and-data-types
difficulty: medium
updated: 2026-10-16
---

## Question

This program stores three facts about a student and prints them. It stops with errors. Find the **two** mistakes and fix them.

## Code

```python
Student_name = "Mona"
age = 19
is_passed = true
print(student_name)
print(age)
print(is_passed)
```

## Expected behavior

The program prints exactly:

```
Mona
19
True
```

## Tests

### the record

```output
Mona
19
True
```

## Solution

```python
student_name = "Mona"
age = 19
is_passed = True
print(student_name)
print(age)
print(is_passed)
```

## Also accepted

```python
Student_name = "Mona"
age = 19
is_passed = True
print(Student_name)
print(age)
print(is_passed)
```

## Hints

- Python is case-sensitive: compare the name on line 1 with the name on line 4, letter by letter.
- How are the two Boolean values written?

## Explanation

1. **Line 3:** Booleans are written `True` and `False`, with a capital first letter. `true` makes Python look for a variable called `true`, and it stops with `NameError: name 'true' is not defined`.
2. **Line 1 and line 4:** `Student_name` and `student_name` are two different names, because the case differs. Use the same spelling in both places. Small letters, `student_name`, is the usual style.
