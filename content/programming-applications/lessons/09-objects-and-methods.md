---
slug: objects-and-methods
title: Objects and methods
topic: objects
lecture: 3
difficulty: easy
description: Every value in Python is an object that holds data and can perform operations. Learn the words object, method and dot notation, using the Strings and Lists you already know, and see how new objects are created.
objectives:
  - Explain what an object is, with data and operations
  - Call a method with dot notation and name each part of the call
  - Tell which methods belong to Strings and which to Lists
  - Describe how calling a function such as Point(100, 150) creates a new object
prerequisites:
  - Strings vs Lists, and a final practice
related:
  - graphics-windows-and-coordinates
  - string-operations-and-methods
updated: 2026-10-15
---

## [explanation] You have already used objects

Look at this program. Every line uses something you learned in the last lecture.

```python
name = "Omar"
grades = [90, 85, 88]
print(name)
print(grades)
name.upper()        # gives "OMAR"
grades.append(95)   # grades is now [90, 85, 88, 95]
```

What is `name`? A String. What is `grades`? A List. What can we do with them? Print them, index them, slice them, and call things like `upper()` and `append()`.

And what are `.upper()` and `.append()`? They are **methods**: actions that belong to the String and to the List. In this lecture you get the words for what you have been doing all along: **we have already been using objects and methods; we just did not call them that yet.**

## [code] The review program, run

```python program run
name = "Omar"
grades = [90, 85, 88]
print(name.upper())
grades.append(95)
print(grades)
print(name)
```

```output
OMAR
[90, 85, 88, 95]
Omar
```

```notes
3 | .upper() | a String method | circle sky
4 | .append(95) | a List method | square yel
6 | name | upper() made a new String | diamond green
```

## [explanation] What is an object?

**An object is something in a program that contains information and can perform operations.**

Think of a car. A car has information about itself, its **data**: its colour, its current speed, its model. And it can do things, its **actions**: start, stop, move.

| | A car | A Python object |
|---|---|---|
| Data (what it knows) | colour, speed, model | the values it holds |
| Actions (what it can do) | start, stop, move | its methods |

A Python object is the same idea: **data + operations**. Try it with a phone: what data does a phone have? (A battery level, a list of contacts.) What can it do? (Call, take a photo, ring.)

## [explanation] Objects are everywhere

Every value you have used is an object.

| Object | Data it holds | Some operations it can do |
|---|---|---|
| `name = "Omar"` (a String object) | the characters `O`, `m`, `a`, `r` | `.upper()`, `.lower()`, `.title()` |
| `students = ["Ali", "Omar"]` (a List object) | the items `"Ali"` and `"Omar"` | `.append("Sara")`, `.sort()`, `.pop()` |

`type()` tells you what kind of object a value is. You saw `<class 'str'>` in the first lecture; now you know that a String is one kind of object, and a List is another.

## [code] One List object, two methods

`sort()` is another List method: it puts the items in order. The List object changes itself, as Lists do.

```python program run
students = ["Ali", "Omar"]
students.append("Sara")
students.sort()
print(students)
print(type(students))
```

```output
['Ali', 'Omar', 'Sara']
<class 'list'>
```

```strip
1 | ["Ali", "Omar"] | item | auto
```

```notes
2 | append | adds Sara | circle sky
3 | sort | puts them in order | square yel
5 | type | a list object | diamond green
```

## [explanation] Objects and methods

**A method is an operation that belongs to an object.** You call it with this pattern:

**object.method()**

Follow one call from start to end. The object is the List `students`, holding `["Ali", "Omar"]`. It receives the method call `.append("Sara")`. The action: the List now holds `["Ali", "Omar", "Sara"]`.

Each kind of object has **its own** methods. Strings have `upper()`; Lists have `append()`. Calling a method that the object doesn't have stops the program: `"Omar".append("x")` gives `AttributeError: 'str' object has no attribute 'append'`.

## [explanation] Dot notation

Read a method call from left to right:

| `students` | `.` | `append` | `("Ali")` |
|---|---|---|---|
| the **object** | the **dot** | the **method** | the **argument** |

- The **dot** means **"use something belonging to this object."**
- The **argument**, inside the brackets, is extra information the method needs: *which* item to append.
- Some methods need no argument, like `upper()`, but the brackets are still required.

The same pattern appears everywhere:

```python
name.upper()
students.append("Ali")
circle.draw(win)
```

The last line is a preview of the next lecture: shapes in a window are objects too, and they use the same dot.

## [note] Check yourself

::: check In `name.upper()`, which part is the object and which is the method?
???
`name` is the **object** (a String), `upper` is the **method**, and the brackets are empty because `upper()` needs no argument.
:::

::: check What does this program print?
```python
word = "Hello"
letters = list(word)
letters.append("!")
print(word.lower(), letters[-1], len(letters))
```
???
```output
hello ! 6
```
`list(word)` makes a new List object holding the 5 characters. `append("!")` adds a sixth item. `word.lower()` gives a new String, `"hello"`.
:::

## [explanation] Creating objects

Strings and Lists can be written directly in the code: `"Omar"`, `[1, 2]`. Many other objects are created by **calling a special function** whose name tells you what kind of object you get.

```python
p = Point(100, 150)
```

Here is what happens, in three steps:

1. **Call the function**: `Point(100, 150)`.
2. **A new object is made**: a Point object that remembers `x → 100` and `y → 150`.
3. **`p` refers to it**: `p` is a variable, a name stuck on the new object like a label.

What would `Point(250, 50)` create? Another, separate Point object, at x = 250 and y = 50.

`Point` comes from the graphics library you will meet in the next lecture. You have used the same idea already: `int("42")` creates an int object from text, and `list("Hi")` creates a List object `['H', 'i']`.

## [code] Calling a type's name creates an object

```python program run
number = int("42")
text = str(7)
letters = list("Hi")
print(number + 1)
print(text + "!")
print(letters)
```

```output
43
7!
['H', 'i']
```

```notes
1 | int("42") | a new int object | circle sky
3 | list("Hi") | a new List object | square yel
```

## [common_mistakes] Common mistakes

- **Leaving out the brackets.** `name.upper` without `()` names the method but doesn't call it.
- **Calling a method the object doesn't have.** `"Omar".append("x")` is an `AttributeError`: `append` belongs to Lists, not Strings.
- **Putting a space around the dot.** `students . append("Ali")` happens to work, but nobody writes it that way. Write `students.append("Ali")`.
- **Forgetting that some methods change the object and some don't.** List methods like `append()` change the List; String methods like `upper()` return a new String.

## [key_takeaways] Key takeaways

- An object holds **data** (what it knows) and has **operations** (what it can do).
- Every value in Python, including Strings and Lists, is an object.
- A **method** is an operation that belongs to an object, called with dot notation: `object.method(argument)`.
- The dot means "use something belonging to this object"; each kind of object has its own methods.
- Some objects are created by calling a function named after their kind, such as `Point(100, 150)`.
