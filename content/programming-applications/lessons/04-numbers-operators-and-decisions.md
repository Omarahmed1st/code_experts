---
slug: numbers-operators-and-decisions
title: Numbers, operators and a first decision
topic: operators
lecture: 1
difficulty: easy
description: Calculate with Python's arithmetic operators, including / // and %, compare values to get True or False, and let a program choose what to do with if and else.
objectives:
  - Use + - * / // and % and predict their results
  - Explain why / always gives a float
  - Use brackets to control the order of operations
  - Compare two values and get True or False
  - Write an if / else that chooses between two actions
prerequisites:
  - Input, processing and output
related:
  - input-processing-and-output
  - variables-and-data-types
updated: 2026-10-15
---

## [explanation] Arithmetic operators

An **operator** is a symbol that does something with values. These are Python's arithmetic operators:

| Operator | Meaning | Example | Result |
|---|---|---|---|
| `+` | addition | `10 + 5` | `15` |
| `-` | subtraction | `10 - 5` | `5` |
| `*` | multiplication | `10 * 5` | `50` |
| `/` | division | `10 / 5` | `2.0` |
| `//` | whole-number division | `17 // 5` | `3` |
| `%` | remainder (modulo) | `17 % 5` | `2` |
| `**` | power | `2 ** 3` | `8` |

## [code] The four basic operations

```python program run
num1 = 10
num2 = 5

total = num1 + num2
print("Addition =", total)
print("Subtraction =", num1 - num2)
print("Multiplication =", num1 * num2)
print("Division =", num1 / num2)
```

```output
Addition = 15
Subtraction = 5
Multiplication = 50
Division = 2.0
```

```notes
4 | total | store the sum first | circle sky
6 | num1 - num2 | or calculate inside print | square yel
8 | / | always gives a float | diamond coral
```

## [explanation] Why 10 / 5 is 2.0

The `/` operator **always gives a float**, even when the answer is a whole number. `10 / 5` is `2.0`, and `7 / 2` is `3.5`. This way you never lose a decimal part by accident.

When you want a whole-number answer, use the other two division operators:

- `//` divides and **drops the decimal part**: `17 // 5` is `3`.
- `%` gives the **remainder** that is left over: `17 % 5` is `2`, because 17 = 3 × 5 + 2.

The remainder is more useful than it looks. `n % 2` is `0` for every even number and `1` for every odd number, and `% 60` turns minutes into "minutes past the hour".

## [code] Hours and minutes with // and %

```python program run
minutes = 135
hours = minutes // 60
left = minutes % 60
print(minutes, "minutes is", hours, "hours and", left, "minutes")
```

```output
135 minutes is 2 hours and 15 minutes
```

```notes
2 | // 60 | whole hours: 2 | circle sky
3 | % 60 | the rest: 15 | square yel
```

## [explanation] Order of operations

Python follows the same order as maths: `**` first, then `*`, `/`, `//` and `%`, and `+` and `-` last. Operators of the same level go from left to right. Brackets change the order, because whatever is inside them is worked out first.

| Expression | Worked out as | Result |
|---|---|---|
| `2 + 3 * 4` | `2 + 12` | `14` |
| `(2 + 3) * 4` | `5 * 4` | `20` |

When you aren't sure, add brackets. They cost nothing and make the code easier to read.

## [code] The average of three marks

The brackets make Python add the three marks before dividing. `round(value, 2)` rounds a float to 2 decimal places for printing.

```python program run
mark1 = 90
mark2 = 85
mark3 = 88

average = (mark1 + mark2 + mark3) / 3
print("Average:", average)
print("Rounded:", round(average, 2))
```

```output
Average: 87.66666666666667
Rounded: 87.67
```

```notes
5 | (mark1 + mark2 + mark3) | add first | circle sky
5 | / 3 | then divide | square yel
7 | round | 2 decimal places | diamond green
```

## [explanation] Comparing values

A **comparison operator** compares two values and gives back a Boolean: `True` or `False`.

| Operator | Means | Example | Result |
|---|---|---|---|
| `>` | greater than | `32 > 30` | `True` |
| `<` | less than | `32 < 30` | `False` |
| `>=` | greater than or equal to | `30 >= 30` | `True` |
| `<=` | less than or equal to | `29 <= 30` | `True` |
| `==` | equal to | `32 == 30` | `False` |
| `!=` | not equal to | `32 != 30` | `True` |

Equal to is **two** equals signs, `==`. A single `=` stores a value in a variable; it never compares.

## [code] Comparisons give True or False

```python program run
temp = 32
print(temp > 30)
print(temp == 30)
print(temp != 30)
```

```output
True
False
True
```

```notes
2 | > | is it bigger? | circle sky
3 | == | two = signs: compare | square yel
```

## [explanation] Making a decision with if and else

A program often has to choose between two actions. `if` runs a block of code only when a condition is `True`; `else` runs a different block when it is `False`.

```python
if condition:
    print("this line runs when the condition is True")
else:
    print("this line runs when the condition is False")
```

Three details matter:

- a **colon** `:` ends the `if` line and the `else` line;
- the lines that belong to each branch are **indented** (pushed right, usually by 4 spaces); that indentation is how Python knows where each branch starts and ends;
- exactly one of the two branches runs, never both.

## [code] A temperature-controlled fan

The program reads the temperature. If it is above 30, the fan switches on; otherwise it stays off. Run it, then change the typed temperature to `25` and run it again.

```python program run
temp = int(input("Enter temperature: "))

if temp > 30:
    print("Fan ON")
else:
    print("Fan OFF")
```

```input
35
```

```output
Enter temperature: 35
Fan ON
```

```notes
1 | int(input( | a number, not text | circle sky
3 | temp > 30 | True or False? | square yel
3 | : | a colon ends the line | diamond green
4 | print | indented: inside if | tri coral
```

## [note] Check yourself

::: check What does this program print?
```python
a = 7
b = 2
print(a / b, a // b, a % b)
```
???
```output
3.5 3 1
```
`/` always gives a float, 3.5. `//` drops the decimal part, 3. And 7 = 3 × 2 + 1, so the remainder is 1.
:::

::: check What does this program print when the user types 30?
```python
temp = int(input("Enter temperature: "))
if temp > 30:
    print("Fan ON")
else:
    print("Fan OFF")
```
???
`Fan OFF`. 30 is not *greater* than 30, so `temp > 30` is `False` and the `else` branch runs. To switch the fan on at 30 as well, the condition would be `temp >= 30`.
:::

## [common_mistakes] Common mistakes

- **Using = to compare.** `if temp = 30:` is a `SyntaxError`. Comparing needs `==`.
- **Forgetting the colon.** `if temp > 30` without `:` is a `SyntaxError`, and so is `else` without one.
- **Forgetting to indent.** A `print` under `if` that isn't indented gives `IndentationError: expected an indented block`.
- **Comparing text with a number.** Without `int()`, `input()` gives a String, and `"35" > 30` stops with `TypeError: '>' not supported between instances of 'str' and 'int'`.
- **Calling a variable sum.** `sum = num1 + num2` works, but it hides Python's own `sum()` function for the rest of the program. Choose a name like `total`.

## [key_takeaways] Key takeaways

- `+ - * /` work as in maths; `/` always gives a float, `//` gives the whole part and `%` the remainder.
- Python follows the usual order of operations; brackets are worked out first.
- Comparisons (`> < >= <= == !=`) give `True` or `False`. Equal to is `==`.
- `if condition:` runs the indented block when the condition is `True`; `else:` runs when it is `False`.
