---
slug: variables-and-data-types
title: Variables and data types
topic: variables-and-data-types
lecture: 1
difficulty: easy
description: Store values in named variables, change them, and meet Python's four basic data types, int, float, str and bool, with type() to check which one a value is.
objectives:
  - Create a variable with = and use its value later
  - Change a variable and predict its new value
  - Recognise int, float, str and bool values
  - Use type() to find a value's data type
  - Choose variable names that follow Python's rules
prerequisites:
  - "What is programming, and why Python?"
related:
  - what-is-programming-and-why-python
  - input-processing-and-output
updated: 2026-10-15
---

## [explanation] A variable is a named box

A **variable** is a named location in the computer's memory that stores a value. You can think of it as a box with a label on it: the label is the variable's name, and the box holds the data.

```python
age = 20
```

This line creates a variable called `age` and stores `20` in it. From now on, whenever the program says `age`, Python uses the value inside the box: **age → 20**.

The `=` sign means **"store"**, not "is equal to". Read `age = 20` as "store 20 in age". The name always goes on the left, the value on the right.

## [code] Three variables

Variables can hold different kinds of data: a whole number, a piece of text or a decimal number. `print()` shows the value stored in each one.

```python program run
name = "Omar"
age = 22
temperature = 30.5

print(name)
print(age)
print(temperature)
```

```output
Omar
22
30.5
```

```notes
1 | name | text goes in quotes | circle sky
2 | age | a whole number | square yel
3 | temperature | a decimal number | diamond green
5 | name | no quotes: the value | tri coral
```

## [explanation] The name, not the word

Notice the difference between `print(name)` and `print("name")`:

- `print(name)` has **no quotes**, so Python looks in the box called `name` and prints what it holds: `Omar`.
- `print("name")` has quotes, so it is just the word *name*, and Python prints `name`.

Quotes mean "this exact text". No quotes means "the value of this variable".

## [code] Changing a variable

A variable can be given a new value at any time. The new value **replaces** the old one; the box only ever holds one value. A variable can even be used to work out its own new value.

```python program run
score = 10
print(score)
score = 15
print(score)
score = score + 5
print(score)
```

```output
10
15
20
```

```notes
3 | score = 15 | the old 10 is replaced | circle coral
5 | score + 5 | 15 + 5, stored back | square yel
```

## [explanation] Reading score = score + 5

Python always works out the **right side first**, then stores the result in the variable on the left. So `score = score + 5` means: take the current value of `score` (15), add 5 (giving 20), and store 20 back in `score`.

In maths `score = score + 5` would be impossible. In Python it is one of the most common lines you will write.

## [explanation] Four basic data types

Every value in Python has a **data type**, which says what kind of value it is and what you can do with it. These four are the ones you will use all the time:

| Type | Name in Python | What it holds | Example |
|---|---|---|---|
| Integer | `int` | whole numbers, positive or negative | `age = 20` |
| Float | `float` | numbers with a decimal point | `temperature = 30.5` |
| String | `str` | text, written in quotes | `name = "Ahmed"` |
| Boolean | `bool` | only `True` or `False` | `is_on = True` |

You don't write the type yourself. Python decides it from the value: `20` is an `int`, `20.0` is a `float`, `"20"` is a `str`.

## [code] Asking Python for the type

The `type()` function tells you the data type of any value or variable.

```python program run
student_name = "Ahmed"
student_age = 20
gpa = 3.4
is_passed = True

print(type(student_name))
print(type(student_age))
print(type(gpa))
print(type(is_passed))
```

```output
<class 'str'>
<class 'int'>
<class 'float'>
<class 'bool'>
```

```notes
4 | True | capital T, no quotes | circle green
6 | type | which data type? | square sky
```

## [explanation] Reading the answer

Python writes the type as `<class 'str'>`. For now, read **class** as "kind of value": `str` means String, `int` means integer, and so on. You will meet the word *class* again at the end of this course, when you learn to make your own kinds of objects.

A Boolean is written `True` or `False` with a **capital first letter** and **no quotes**. `"True"` in quotes is a String that happens to contain the word True.

## [example] 20 and "20" are different values

A number in quotes is text, not a number. Python treats the two very differently: numbers are added, Strings are joined end to end.

```python program run
print(type(20), type("20"))
print(20 + 5)
print("20" + "5")
```

```output
<class 'int'> <class 'str'>
25
205
```

```notes
2 | 20 + 5 | numbers: added | circle green
3 | "20" + "5" | text: joined together | tri coral
```

## [explanation] Naming rules

A variable name must follow these rules, or Python stops with a `SyntaxError`:

- it uses only **letters, digits and the underscore** `_` (no spaces, no `-`);
- it **doesn't start with a digit**: `student1` is fine, `1student` is not;
- it isn't one of Python's own words, such as `if`, `else`, `for` or `True`.

Python is **case-sensitive**: `age`, `Age` and `AGE` are three different variables.

Good names say what the value means. Python programmers write them in small letters with underscores between the words: `student_age`, `is_passed`, `max_temperature`.

::: tip
Avoid names that Python already uses for its own functions, such as `print`, `input`, `type`, `len` or `sum`. Python lets you do it, but the original function stops working for the rest of your program.
:::

## [note] Check yourself

::: check What does this program print?
```python
x = 4
y = x
x = 9
print(x, y)
```
???
```output
9 4
```
`y = x` copies the value 4 into `y` at that moment. Changing `x` later doesn't change `y`.
:::

::: check What is the type of each value: `7`, `7.0`, `"7"`, `False`?
???
`7` is an `int`, `7.0` is a `float`, `"7"` is a `str` (it has quotes), and `False` is a `bool`.
:::

## [common_mistakes] Common mistakes

- **Putting the value on the left.** `20 = age` is a `SyntaxError`. The variable's name always goes on the left of `=`.
- **Using a variable before creating it.** `print(total)` before any `total = …` line stops with `NameError: name 'total' is not defined`.
- **Mixing up the case.** `Name = "Omar"` then `print(name)` is a `NameError`: `Name` and `name` are different variables.
- **Spaces in a name.** `student age = 20` is a `SyntaxError`. Use `student_age`.
- **Writing true without a capital.** `is_on = true` makes Python look for a variable called `true`. Booleans are `True` and `False`.

## [key_takeaways] Key takeaways

- A variable is a named box that holds one value; `=` means "store the right side in the left side".
- A new value replaces the old one, and `x = x + 1` uses the old value to make the new one.
- The four basic types are `int` (whole numbers), `float` (decimals), `str` (text in quotes) and `bool` (`True` / `False`).
- `type(value)` tells you a value's type; `20` and `"20"` are different types.
- Names use letters, digits and `_`, can't start with a digit, and are case-sensitive.
