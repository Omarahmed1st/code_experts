---
slug: input-processing-and-output
title: Input, processing and output
topic: input-and-output
lecture: 1
difficulty: easy
description: Every program takes input, processes it and produces output. Read what the user types with input(), turn it into a number with int() or float(), and print the result.
objectives:
  - Name the input, processing and output of a small program
  - Read text from the user with input() and a prompt
  - Explain why input() always gives a String
  - Convert typed text to a number with int() or float()
  - Print several values on one line with print()
prerequisites:
  - Variables and data types
related:
  - variables-and-data-types
  - numbers-operators-and-decisions
updated: 2026-10-15
---

## [explanation] Input, processing, output

Almost every program has the same basic structure, in three parts:

**Input → Processing → Output**

- **Input**: the data the program receives, for example a number the user types.
- **Processing**: what the program does with it, for example multiplying it by 2.
- **Output**: the result the program shows, for example printing the answer.

Before you write a program, name these three parts. If you can say what goes in and what must come out, the processing in the middle is much easier to plan.

## [code] A complete input, processing, output program

The user types a number; the program doubles it and prints the result. The box under the code is what the user types. Change it and press **Run** again.

```python program run
number = int(input("Enter a number: "))
result = number * 2
print(result)
```

```input
7
```

```output
Enter a number: 7
14
```

```notes
1 | input | INPUT: read what is typed | circle sky
2 | number * 2 | PROCESSING | square yel
3 | print | OUTPUT | diamond green
```

## [explanation] How input() works

`input()` does three things:

1. It shows the text in its brackets, called the **prompt**, so the user knows what to type.
2. It **waits** until the user types something and presses Enter.
3. It **gives back** what was typed, which you usually store in a variable.

`print()` and `input()` are a pair: **`input()` gets information from the user, `print()` displays information to the user.**

Leave a space at the end of the prompt, as in `"Enter your name: "`, so the user's typing doesn't stick to the colon.

## [code] Greeting the user

```python program run
name = input("Enter your name: ")
print("Hello", name)
```

```input
Omar
```

```output
Enter your name: Omar
Hello Omar
```

```notes
1 | "Enter your name: " | the prompt | circle sky
2 | , | comma: adds a space | square yel
```

## [explanation] input() always gives a String

Whatever the user types, even `20`, `input()` gives it back as **text** (a `str`). Python can't know whether you meant a number or a word, so it keeps exactly the characters that were typed.

That matters as soon as you want to calculate. Joining two Strings with `+` puts them side by side; adding two numbers adds them. To do arithmetic with typed numbers, convert the text first:

| Function | Turns text into | Example |
|---|---|---|
| `int()` | a whole number | `int("20")` is `20` |
| `float()` | a decimal number | `float("2.5")` is `2.5` |
| `str()` | text (the other way round) | `str(20)` is `"20"` |

## [example] Text that looks like a number

`x` and `y` hold the text `"20"`. With `+`, the two Strings are joined. Converted with `int()`, they are added.

```python program run
x = "20"
y = "20"
print(x + y)
print(int(x) + int(y))
```

```output
2020
40
```

```notes
3 | x + y | text: joined, not added | tri coral
4 | int(x) | text → number | circle green
```

## [code] Adding two numbers from the user

`int(input(...))` reads the text and converts it in one line: Python runs the inner function first, then the outer one.

```python program run
x = int(input("Enter first number: "))
y = int(input("Enter second number: "))

result = x + y

print("Result =", result)
```

```input
5
7
```

```output
Enter first number: 5
Enter second number: 7
Result = 12
```

```notes
1 | int(input( | read, then convert | circle sky
4 | x + y | numbers now: 5 + 7 | square yel
6 | "Result =", result | text, then the value | diamond green
```

## [code] Reading a name and an age

A name stays as text, so it needs no conversion. An age is a number, so it goes through `int()`, and then the program can calculate with it.

```python program run
name = input("Enter your name: ")
age = int(input("Enter your age: "))
print("Hello", name)
print("Age:", age)
print("Next year you will be", age + 1)
```

```input
Sara
19
```

```output
Enter your name: Sara
Enter your age: 19
Hello Sara
Age: 19
Next year you will be 20
```

```notes
1 | input | text: kept as it is | circle sky
2 | int | a number: converted | square yel
5 | age + 1 | maths works on an int | diamond green
```

## [explanation] Decimals: float()

`int()` only accepts whole numbers. For a value such as a temperature or a price, use `float()`:

```python
temperature = float(input("Enter the temperature: "))
```

If the user types `30.5`, `temperature` holds the number `30.5`. If they type `30`, it holds `30.0`, which is still a `float`.

## [note] Check yourself

::: check What does this program print?
```python
a = "3"
b = 3
print(a * 2, b * 2)
```
???
```output
33 6
```
`a` is the String `"3"`, and a String times 2 repeats it: `"33"`. `b` is the number 3, so `b * 2` is 6.
:::

::: check A user types `2.5` into `int(input("How many hours? "))`. What happens?
???
The program stops with `ValueError: invalid literal for int() with base 10: '2.5'`. `int()` only accepts text that looks like a whole number. Use `float()` when the answer may have a decimal point.
:::

## [common_mistakes] Common mistakes

- **Forgetting to convert.** `age = input("Age: ")` then `age + 1` stops with `TypeError: can only concatenate str (not "int") to str`. Wrap the input: `int(input("Age: "))`.
- **Converting a word.** If the user types `twenty`, `int()` raises a `ValueError`. Programs later in the course check the input before converting it.
- **Missing brackets.** `int(input("Age: ")` has one closing bracket too few: each `(` needs its own `)`.
- **No space in the prompt.** `input("Name:")` makes the typing look like `Name:Omar`. End the prompt with a space.

## [key_takeaways] Key takeaways

- Programs follow **input → processing → output**; plan those three parts before coding.
- `input("prompt ")` shows the prompt, waits for the user, and returns what was typed.
- What `input()` returns is **always a String**, even when the user types digits.
- Use `int()` for whole numbers and `float()` for decimals before doing arithmetic.
- `print(a, b)` prints several values on one line, separated by spaces.
