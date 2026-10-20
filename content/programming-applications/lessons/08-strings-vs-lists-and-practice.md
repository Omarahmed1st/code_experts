---
slug: strings-vs-lists-and-practice
title: Strings vs Lists, and a final practice
topic: lists
lecture: 2
difficulty: medium
description: Strings and Lists are both sequences, but only Lists can be changed. See what happens when you try to change a String, how to build a changed copy instead, and finish with a step-by-step List practice.
objectives:
  - List what Strings and Lists have in common
  - Explain the difference between mutable and immutable
  - Build a changed copy of a String with slicing and +
  - Solve a multi-step List task using indexes and List methods
prerequisites:
  - String operations and methods
  - "Lists: storing many values"
related:
  - lists-storing-many-values
  - string-operations-and-methods
updated: 2026-10-15
---

## [explanation] Two sequences, side by side

Strings and Lists are both **sequences**, so a lot of what you learned works on both:

| | String | List |
|---|---|---|
| Written as | `"Python"` | `["Ahmed", "Omar", "Sara"]` |
| Holds | characters (text) | items (any values) |
| Indexing `[i]` | gives one character | gives one item |
| Slicing `[a:b]` | gives a new String | gives a new List |
| `len()` | counts characters | counts items |
| Can be changed? | **No** (immutable) | **Yes** (mutable) |

The last row is the key difference, and it is the subject of this lecture.

## [explanation] Mutable and immutable

**Mutable** means "can be changed"; **immutable** means "cannot be changed".

- A **List is mutable**. You can replace an item (`colors[1] = "Black"`), add items with `append()` and `insert()`, and remove them with `remove()` and `pop()`. The same List object changes.
- A **String is immutable**. Once a String exists, none of its characters can be replaced, added or removed. Every String method, such as `upper()`, gives you a **new** String and leaves the old one as it was.

## [example] Trying to change a String

Run this program. Python stops at line 2 with `TypeError: 'str' object does not support item assignment`.

```python program run
word = "Python"
word[0] = "J"
print(word)
```

```notes
2 | word[0] = "J" | a String can't change | tri coral
```

## [code] Building a changed copy instead

To "change" a String, build a **new** one from pieces of the old one. `word[1:]` is everything except the first character, so `"J" + word[1:]` is `"Jython"`. The original `word` is still `"Python"`.

```python program run
word = "Python"
new_word = "J" + word[1:]
print(new_word)
print(word)

colors = ["Red", "Blue", "Green"]
colors[0] = "Pink"
print(colors)
```

```output
Jython
Python
['Pink', 'Blue', 'Green']
```

```strip
1 | "Python" | chr | auto
6 | ["Red", "Blue", "Green"] | item | auto
```

```notes
2 | word[1:] | everything after P | circle sky
4 | word | the original is unchanged | square yel
7 | colors[0] = "Pink" | a List can change | diamond green
```

## [explanation] Why it matters

The difference explains two kinds of line you will write all the time:

- With a String, you **store the result**: `name = name.upper()`. Without `name =`, the new String is lost.
- With a List, you **don't**: `students.append("Ali")` changes `students` itself. Writing `students = students.append("Ali")` would be a mistake, because `append()` returns `None`, and `students` would become `None`.

## [note] Check yourself

::: check What does this program print?
```python
word = "cat"
word.upper()
letters = ["c", "a", "t"]
letters.append("s")
print(word, letters)
```
???
```output
cat ['c', 'a', 't', 's']
```
`word.upper()` makes a new String `"CAT"`, but nothing stores it, so `word` is still `"cat"`. `append()` changes the List itself, so `letters` now has 4 items.
:::

## [explanation] Final practice: six steps on one List

Start with this List:

```python
subjects = ["Math", "Programming", "Physics"]
```

Write the Python code for each step:

1. Display the first subject.
2. Add `"Electronics"`.
3. Replace `"Math"` with `"Calculus"`.
4. Remove `"Physics"`.
5. Display the final List.
6. Display the number of subjects.

Try it yourself first: open the solution below, press **Edit**, delete everything after the first line and write your own steps. Then compare.

## [code] Final practice: one possible solution

```python program run
subjects = ["Math", "Programming", "Physics"]

print(subjects[0])
subjects.append("Electronics")
subjects[0] = "Calculus"
subjects.remove("Physics")
print(subjects)
print(len(subjects))
```

```output
Math
['Calculus', 'Programming', 'Electronics']
3
```

```strip
1 | ["Math", "Programming", "Physics"] | item | auto
```

```notes
3 | [0] | 1. the first subject | circle sky
4 | append | 2. add to the end | square yel
5 | subjects[0] = | 3. replace Math | diamond green
6 | remove | 4. remove by value | tri coral
8 | len | 6. counts items, not letters | circle green
```

## [explanation] Following the List step by step

| After step | `subjects` |
|---|---|
| start | `['Math', 'Programming', 'Physics']` |
| 2. `append("Electronics")` | `['Math', 'Programming', 'Physics', 'Electronics']` |
| 3. `subjects[0] = "Calculus"` | `['Calculus', 'Programming', 'Physics', 'Electronics']` |
| 4. `remove("Physics")` | `['Calculus', 'Programming', 'Electronics']` |

Step 3 could also be written `subjects[subjects.index("Math")] = "Calculus"`, which finds Math wherever it is. Here Math is known to be first, so `[0]` is enough.

## [common_mistakes] Common mistakes

- **Trying to change a character.** `word[0] = "J"` is a `TypeError`. Build a new String: `"J" + word[1:]`.
- **Forgetting to store a String result.** `name.title()` alone changes nothing; write `name = name.title()`.
- **Storing a List method's result.** `subjects = subjects.append("Art")` replaces your List with `None`.
- **Doing steps in the wrong order.** In the practice, replacing `subjects[0]` *before* step 1 would print Calculus instead of Math. With a mutable List, the order of the lines decides what each line sees.

## [key_takeaways] Key takeaways

- Strings and Lists are both sequences: indexing, slicing and `len()` work on both.
- Lists are **mutable** (they can change); Strings are **immutable** (they can't).
- To "change" a String, build a new one, for example `"J" + word[1:]`, and store it.
- String methods return new Strings; List methods like `append()` change the List and return `None`.
- **Store → access → modify → use**: that is what Strings and Lists let a program do with collections of data.
