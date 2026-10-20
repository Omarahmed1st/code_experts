---
slug: io-correct-age-in-five-years
type: correct_code
title: Fix the age calculator
lesson: input-processing-and-output
difficulty: easy
updated: 2026-10-16
---

## Question

The program reads a name and an age, then says how old the person will be in 5 years. It stops with a `TypeError` on the last line. Fix it.

## Code

```python
name = input()
age = input()
print("Hello", name)
print("In 5 years you will be", age + 5)
```

## Expected behavior

The user types a name, then an age. For `Sara` and `19` the program prints:

```
Hello Sara
In 5 years you will be 24
```

(There are no prompts in this exercise, so the tests only show what the program prints.)

## Tests

### Sara, 19

```input
Sara
19
```

```output
Hello Sara
In 5 years you will be 24
```

### Omar, 20

```input
Omar
20
```

```output
Hello Omar
In 5 years you will be 25
```

## Solution

```python
name = input()
age = int(input())
print("Hello", name)
print("In 5 years you will be", age + 5)
```

## Also accepted

```python
name = input()
age = input()
print("Hello", name)
print("In 5 years you will be", int(age) + 5)
```

## Hints

- What type is `age` after `age = input()`?
- The name can stay as text. Only the age needs converting.

## Explanation

`input()` always returns a String, so `age` holds `"19"`, not 19. `"19" + 5` tries to join text and a number, and Python stops with `TypeError: can only concatenate str (not "int") to str`.

Convert the age to a whole number with `int()`, either when you read it (`age = int(input())`) or where you use it (`int(age) + 5`). The name stays as text, because nobody calculates with a name.
