---
slug: lists-storing-many-values
title: "Lists: storing many values"
topic: lists
lecture: 2
difficulty: easy
description: Keep many values in one variable with a Python List, then read items by index, take slices, change items, and add or remove items with append(), insert(), remove() and pop().
objectives:
  - Create a List and read its items with positive and negative indexes
  - Take a slice of a List and explain why the result is a new List
  - Change an item by assigning to its index
  - Add items with append() and insert(), and remove them with remove() and pop()
  - Loop over a List to add up its items
prerequisites:
  - "Strings: indexing and slicing"
related:
  - strings-indexing-and-slicing
  - strings-vs-lists-and-practice
updated: 2026-10-15
---

## [explanation] One variable, many values

Back to the problem from the start of the Strings lecture: one variable per student doesn't scale. A **List** stores **multiple values inside one variable**. Instead of

```python
student1 = "Ahmed"
student2 = "Omar"
student3 = "Sara"
```

you write one variable, `students`, and put all the names inside **square brackets**, separated by commas:

```python
students = ["Ahmed", "Omar", "Sara"]
```

Each item gets an index starting from 0, just like the characters of a String. A List can hold numbers too, such as `[10, 20, 30]`, or a mix of types.

## [code] Accessing List elements

List indexing works exactly like String indexing: square brackets and an index, positive from the start or negative from the end. `len()` works on Lists too, and counts the **items**.

```python program run
students = ["Ahmed", "Omar", "Sara"]
print(students)
print(students[0])
print(students[2])
print(students[-1])
print(len(students))
```

```output
['Ahmed', 'Omar', 'Sara']
Ahmed
Sara
Sara
3
```

```strip
1 | ["Ahmed", "Omar", "Sara"] | item | auto | neg
```

```notes
3 | [0] | first item | circle sky
5 | [-1] | last item | diamond coral
6 | len | number of items | square green
```

## [explanation] One whole item, not one character

There is nothing new to memorise, but notice what you get back. With a String, an index gives **one character**. With a List, it gives **one whole item**: `students[0]` is the full name `Ahmed`.

`students[2]` and `students[-1]` both give `Sara`, because Sara is the last item. And `students[3]` doesn't exist: the last index of a 3-item List is 2.

## [code] List slicing

Slicing follows the same rules as for Strings: the start is included, the end is not. The difference is the result. Slicing a String gives a String; slicing a List gives a **new List**, which is why the output has square brackets.

```python program run
numbers = [10, 20, 30, 40, 50]
print(numbers[0:3])
print(numbers[2:])
print(numbers[-2:])
```

```output
[10, 20, 30]
[30, 40, 50]
[40, 50]
```

```strip
1 | [10, 20, 30, 40, 50] | item | auto
```

```notes
2 | 0:3 | indexes 0, 1 and 2 | circle sky
3 | 2: | index 2 to the end | square yel
4 | -2: | the last two items | diamond green
```

## [code] Changing an item: Lists are mutable

To change one item, assign a new value to its index. The List itself changes. Because Lists can be changed, they are called **mutable** (mutable means "can be changed").

```python program run
colors = ["Red", "Blue", "Green"]
print(colors)
colors[1] = "Black"
print(colors)
```

```output
['Red', 'Blue', 'Green']
['Red', 'Black', 'Green']
```

```strip
1 | ["Red", "Blue", "Green"] | item | auto
```

```notes
3 | colors[1] = "Black" | replaces Blue | circle sky
```

## [explanation] Adding and removing items

Four methods change the length of a List. Like String methods, they are called with a dot:

| Method | What it does |
|---|---|
| `append(item)` | adds an item **to the end** |
| `insert(index, item)` | adds an item **at a position**; the items after it move one place to the right |
| `remove(value)` | removes the first item **equal to** that value, wherever it is |
| `pop()` | removes the **last** item, and gives it back |

## [code] One List, four changes

Read this program as one story. The List starts with two names; each line changes it, and the `print` after it shows the result.

```python program run
students = ["Ahmed", "Omar"]
print(students)
students.append("Ali")
print(students)
students.insert(1, "Sara")
print(students)
students.remove("Omar")
print(students)
students.pop()
print(students)
```

```output
['Ahmed', 'Omar']
['Ahmed', 'Omar', 'Ali']
['Ahmed', 'Sara', 'Omar', 'Ali']
['Ahmed', 'Sara', 'Ali']
['Ahmed', 'Sara']
```

```notes
3 | append | Ali goes to the end | circle sky
5 | insert(1, | Sara goes to index 1 | square yel
7 | remove | deletes the value Omar | diamond coral
9 | pop | deletes the last item | tri green
```

## [explanation] pop() gives the item back

`pop()` does two things: it removes the last item **and returns it**. So you can keep what was removed:

```python
students = ["Ahmed", "Sara", "Ali"]
name = students.pop()
print(name)
print(students)
```

This prints `Ali`, then `['Ahmed', 'Sara']`. `pop()` can also take an index: `students.pop(0)` removes and returns the **first** item.

## [note] Check yourself

::: check What does this program print?
```python
nums = [4, 8, 15]
nums.append(16)
print(nums[1] + nums[-1])
```
???
```output
24
```
After `append(16)` the List is `[4, 8, 15, 16]`. `nums[1]` is 8 and `nums[-1]` is now 16, and 8 + 16 is 24.
:::

::: check What does this program print?
```python
names = ["Ali", "Mona", "Sara"]
names.insert(0, "Omar")
names.remove("Mona")
print(names)
```
???
```output
['Omar', 'Ali', 'Sara']
```
`insert(0, "Omar")` puts Omar in front: `['Omar', 'Ali', 'Mona', 'Sara']`. Then `remove("Mona")` deletes Mona.
:::

## [explanation] Looping over a List

A `for` loop can visit every item of a List in order. The loop variable (here `mark`) holds one item on each round. This is the usual way to add up, count or search the items. Loops get their own lectures later; this is a first look.

## [code] Adding up the marks

```python program run
marks = [15, 18, 12, 20]
total = 0
for mark in marks:
    total = total + mark
print("Total:", total)
print("Average:", total / len(marks))
```

```output
Total: 65
Average: 16.25
```

```strip
1 | [15, 18, 12, 20] | item | auto
```

```notes
3 | mark | one item each round | circle sky
4 | total + mark | keeps a running sum | square yel
6 | / | / always gives a float | diamond green
```

## [example] Reading past the end

Run this program. It stops with an error, because the List has 3 items with indexes 0, 1 and 2.

```python program run
students = ["Ahmed", "Omar", "Sara"]
print(students[3])
```

```notes
2 | [3] | there is no index 3 | tri coral
```

## [explanation] Reading the error

The last line of the error is the important one: `IndexError: list index out of range`. The fix is to use an index from `0` to `len(students) - 1`, or `students[-1]` for the last item.

## [common_mistakes] Common mistakes

- **Starting at 1.** The first item is `students[0]`.
- **Round brackets.** `students(0)` is a `TypeError`; items are read with square brackets, `students[0]`.
- **Using `append()` to add two items at once.** `students.append("Ali", "Sara")` raises a `TypeError`. Call `append()` once per item.
- **Saving the result of `append()`.** `students = students.append("Ali")` sets `students` to `None`, because `append()` changes the List and returns nothing.
- **Removing a value that isn't there.** `students.remove("Mona")` raises a `ValueError` if Mona is not in the List.
- **Mixing up `remove()` and `pop()`.** `remove()` takes a **value** (`remove("Omar")`); `pop()` takes an **index** or nothing.

## [key_takeaways] Key takeaways

- A List stores many values in one variable: `["Ahmed", "Omar", "Sara"]`. Indexes start at 0, and `-1` is the last item.
- Indexing a List gives one whole item; slicing gives a new List.
- Lists are **mutable**: `colors[1] = "Black"` changes the List itself.
- `append()` adds to the end, `insert(i, x)` adds at index `i`, `remove(x)` deletes by value, and `pop()` removes and returns the last item.
- `for item in my_list:` visits every item, which is how you add up or search a List.
