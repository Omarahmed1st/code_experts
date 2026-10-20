---
slug: string-operations-and-methods
title: String operations and methods
topic: strings
lecture: 2
difficulty: easy
description: Join Strings with +, repeat them with *, count their characters with len(), and change their letters with upper(), lower(), capitalize() and title(). Then put it together to format a name.
objectives:
  - Join Strings with + and repeat them with *
  - Count characters with len(), including spaces
  - Call a String method with a dot and brackets
  - Explain why a method gives a new String instead of changing the old one
  - Write a program that formats a user's name
prerequisites:
  - "Strings: indexing and slicing"
related:
  - strings-indexing-and-slicing
  - strings-vs-lists-and-practice
updated: 2026-10-15
---

## [explanation] Three simple tools

You have read parts of a String. Now you will build and change Strings with three simple tools:

| Tool | Name | What it does | Example | Result |
|---|---|---|---|---|
| `+` | concatenation | joins Strings together | `"Py" + "thon"` | `"Python"` |
| `*` | repetition | repeats a String | `"ab" * 3` | `"ababab"` |
| `len()` | length | counts the characters | `len("Python")` | `6` |

## [code] Joining Strings with +

`+` puts two Strings side by side, with nothing in between. To get a space between the first and last name, join a String that contains just a space, `" "`, in the middle.

```python program run
first = "Omar"
last = "Ahmed"
full_name = first + " " + last
print(full_name)
print(first + last)
```

```output
Omar Ahmed
OmarAhmed
```

```notes
3 | " " | a space, joined in the middle | circle sky
5 | first + last | no space added for you | tri coral
```

## [code] Repeating with * and counting with len()

`*` repeats a String a whole number of times. `len()` counts every character, including spaces.

```python program run
print("Hi" * 3)
print("-" * 20)
print(len("Python"))
print(len("Omar Ahmed"))
```

```output
HiHiHi
--------------------
6
10
```

```notes
2 | "-" * 20 | a quick dividing line | circle sky
4 | "Omar Ahmed" | the space counts: 10 | square yel
```

## [explanation] Spaces are characters too

`len("Omar Ahmed")` is 10, not 9: the space between the two names is a character like any other. The same goes for repetition. `"Hi " * 3`, with a space inside the quotes, gives `"Hi Hi Hi "`: three copies of `Hi ` and therefore a space at the very end, which you can't see on the screen but `len()` counts. So `len("Hi " * 3)` is 9.

## [explanation] String methods

A **method** is a function that belongs to a value. You call it with a **dot** after the value or variable, then the method's name and brackets:

**name.method()**

The brackets are required, even when the method needs nothing inside them. These four methods change the letters of a String:

| Method | What it does |
|---|---|
| `upper()` | ALL CAPITAL LETTERS |
| `lower()` | all small letters |
| `capitalize()` | a capital first letter for the **whole text**, small letters after it |
| `title()` | a capital first letter for **every word** |

## [code] Four methods on one name

```python program run
name = "omar ahmed"
print(name.upper())
print(name.lower())
print(name.capitalize())
print(name.title())
print(name)
```

```output
OMAR AHMED
omar ahmed
Omar ahmed
Omar Ahmed
omar ahmed
```

```notes
2 | . | the dot calls a method | circle sky
4 | capitalize | first letter of the text | square yel
5 | title | first letter of each word | diamond green
6 | name | still unchanged | tri coral
```

## [explanation] Methods give you a new String

Look at the last line of output: after four method calls, `name` still holds `"omar ahmed"`. A String method never changes the String it is called on. It **returns a new String**, which you can print or store.

To keep the result, store it in a variable, either a new one or the same one:

```python
name = "omar ahmed"
name = name.title()
print(name)
```

Now `name` holds `"Omar Ahmed"`, because the line stored the new String back in `name`.

## [note] Check yourself

::: check What does this program print?
```python
city = "cairo university"
print(city.capitalize())
print(city.title())
print(len(city))
```
???
```output
Cairo university
Cairo University
16
```
`capitalize()` only changes the very first letter of the whole text; `title()` changes the first letter of each word. `len()` counts the space too: 5 + 1 + 10 = 16.
:::

## [explanation] Practice: format a name

Here is a small task that uses everything in this lecture. Ask the user for their first and last name, then display:

1. the full name;
2. the full name in capital letters;
3. the number of characters in the full name.

Plan it as input, processing and output: **input** the two names, **process** by joining them with a space, **output** three results using `+`, `upper()` and `len()`. Try writing it yourself in the box below before you read the solution: press **Edit**, and add your lines after the comment.

## [code] Format a name: starter code

```python program run
first_name = input("Enter first name: ")
last_name = input("Enter last name: ")
# Complete the program here...
```

```input
Omar
Ahmed
```

```output
Enter first name: Omar
Enter last name: Ahmed
```

```notes
3 | # | your code goes here | circle sky
```

## [code] Format a name: one possible solution

```python program run
first_name = input("Enter first name: ")
last_name = input("Enter last name: ")

full_name = first_name + " " + last_name

print(full_name)
print(full_name.upper())
print(len(full_name))
```

```input
Omar
Ahmed
```

```output
Enter first name: Omar
Enter last name: Ahmed
Omar Ahmed
OMAR AHMED
10
```

```notes
4 | + " " + | join with a space | circle sky
7 | upper | capital letters | square yel
8 | len | the space counts too | diamond green
```

## [explanation] Counting only the letters

The answer is 10, not 9, because `len()` counts the space between the names. To count the letters only, add the lengths of the two names instead:

```python
print(len(first_name) + len(last_name))
```

For Omar Ahmed that gives 4 + 5 = 9.

## [common_mistakes] Common mistakes

- **Forgetting the brackets.** `name.upper` without `()` doesn't run the method. `print(name.upper)` shows something like `<built-in method upper of str object at 0x…>` instead of capital letters.
- **Expecting the variable to change.** `name.upper()` on its own line does nothing useful: the new String is made and thrown away. Write `name = name.upper()` to keep it.
- **Joining a String and a number.** `"Age: " + 20` stops with `TypeError: can only concatenate str (not "int") to str`. Convert first: `"Age: " + str(20)`.
- **Multiplying two Strings.** `"Hi" * "3"` is a `TypeError`. Repetition needs a whole number: `"Hi" * 3`.

## [key_takeaways] Key takeaways

- `+` joins Strings, `*` repeats a String, and `len()` counts its characters, spaces included.
- A method is called with a dot and brackets: `name.upper()`.
- `upper()`, `lower()`, `capitalize()` and `title()` change the letters; `capitalize()` touches only the first letter of the text, `title()` the first letter of every word.
- String methods **return a new String**; the original is unchanged unless you store the result back.
