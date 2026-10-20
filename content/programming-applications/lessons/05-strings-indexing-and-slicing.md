---
slug: strings-indexing-and-slicing
title: "Strings: indexing and slicing"
topic: strings
lecture: 2
difficulty: easy
description: Move from one value to many with sequences. See how Python numbers the characters of a String from 0, and pick out one character with an index or a piece of the text with a slice.
objectives:
  - Explain what a sequence is and name Python's two most common ones
  - Read one character of a String with a positive or a negative index
  - Take part of a String with a slice, and predict exactly where it stops
  - Use len() and avoid IndexError
prerequisites:
  - Variables and data types
  - "Input, processing and output"
related:
  - string-operations-and-methods
  - lists-storing-many-values
updated: 2026-10-15
---

## [explanation] From one value to many values

So far every variable has held **one** value. Storing four students' names takes four variables:

```python
student1 = "Ahmed"
student2 = "Omar"
student3 = "Sara"
student4 = "Ali"
```

Now imagine 100 students: 100 variables, and 100 `print` lines to show them all. There has to be a better way.

The better way is a **sequence**: one name that holds many values, in order. Python gives you two sequences you will use all the time, **Strings** and **Lists**. This lecture starts with Strings; Lists come two lectures later.

## [explanation] What is a sequence?

A **sequence** is an **ordered collection of elements**. "Ordered" means every element has a fixed position, and each position has a number called its **index**.

| Element | P | y | t | h | o | n |
|---|---|---|---|---|---|---|
| **Index** | 0 | 1 | 2 | 3 | 4 | 5 |

The most important rule: **Python indexing starts from 0**. The first element is at index 0, so in `"Python"` the sixth character, `n`, is at index 5.

Python's two common sequences:

- a **String**, written in quotes, such as `"Python"`: a sequence of **characters**;
- a **List**, written in square brackets, such as `["Ahmed", "Omar", "Sara"]`: a sequence of **items**.

Both are ordered, so both use indexes starting from 0.

## [explanation] A String is a sequence of characters

A **String** (Python's type `str`) represents text: a name, a course title, a message. Each letter, digit, space or symbol in it is one **character**.

```python
name = "Omar"
course = "Programming Applications"
message = "Hello World"
```

You can write a String with double quotes or single quotes, as long as the opening and closing quotes match. `"Hello"` and `'Hello'` are exactly the same String.

## [code] String indexing

To read one character, write the variable's name and the index in **square brackets**. The boxes under the code show every character with its index.

```python program run
word = "Python"
print(word[0])
print(word[2])
print(word[5])
```

```output
P
t
n
```

```strip
1 | "Python" | chr | auto
```

```notes
2 | [0] | first element: index 0 | circle sky
3 | [2] | the 3rd character | square yel
4 | [5] | the last character | diamond green
```

## [explanation] The last index is one less than the length

`"Python"` has 6 characters, so its indexes are 0, 1, 2, 3, 4 and 5. There is **no index 6**. The last index is always the length minus one, and the `len()` function gives the length: `len(word)` is `6`, so the last character is `word[len(word) - 1]`.

::: warning Index out of range
Asking for an index that doesn't exist stops the program. `word[6]` on a 6-character String raises `IndexError: string index out of range`.
:::

## [code] Counting from the end with negative indexes

Python also numbers the characters from the end, using **negative indexes**: `-1` is the last character, `-2` the one before it, and so on. This is handy when you don't know how long the text is: `word[-1]` is always the last character.

```python program run
word = "Python"
print(word[-1])
print(word[-2])
print(word[-6])
```

```output
n
o
P
```

```strip
1 | "Python" | chr | auto | neg
```

```notes
2 | [-1] | -1 is always the last | diamond coral
4 | [-6] | same as word[0] | square sky
```

## [note] Check yourself

::: check What does this program print?
```python
s = "Cairo"
print(s[1] + s[-1])
```
???
```output
ao
```
`s[1]` is the second character, `a`, and `s[-1]` is the last character, `o`. Using `+` on two Strings joins them.
:::

## [explanation] Slicing: getting part of a String

Indexing gives you **one** character. **Slicing** gives you a piece of the String:

**string[start:end]**

The slice starts **at** index `start` (included) and stops **before** index `end` (not included). A handy check: `end - start` is the number of characters you get.

## [code] Your first slice

`word[0:4]` takes indexes 0, 1, 2 and 3, and stops before index 4. That is 4 − 0 = 4 characters.

```python program run
word = "Programming"
print(word[0:4])
```

```output
Prog
```

```strip
1 | "Programming" | chr | auto
```

```notes
2 | 0 | start: included | circle green
2 | 4 | end: not included | tri coral
```

## [code] More slicing examples

You can leave out `start` or `end`:

- `[:end]` starts **from the beginning**;
- `[start:]` runs **until the end**;
- `[:]`, with neither, copies the whole String.

```python program run
word = "Programming"
print(word[:4])
print(word[4:])
print(word[3:8])
print(word[:])
```

```output
Prog
ramming
gramm
Programming
```

```strip
1 | "Programming" | chr | auto
```

```notes
2 | :4 | from the beginning | circle sky
3 | 4: | until the end | square yel
4 | 3:8 | indexes 3 to 7 | diamond green
5 | [:] | the whole String | tri coral
```

## [example] A slice never goes out of range

Indexing past the end is an error, but slicing past the end is not: Python simply stops at the last character. A slice that starts past the end gives an empty String.

```python program run
word = "Python"
print(word[4:10])
print(word[10:])
print(len(word[10:]))
```

```output
on

0
```

```notes
2 | 4:10 | stops at the real end | circle sky
3 | 10: | an empty String | square coral
```

## [explanation] A third number: the step

A slice can take a third number, the **step**: `string[start:end:step]`. A step of 2 takes every second character. `"Programming"[::2]` is `"Pormig"` (indexes 0, 2, 4, 6, 8 and 10). A step of -1 walks backwards, so `"Python"[::-1]` is `"nohtyP"`, the String reversed.

## [note] Check yourself

::: check What does `"Programming"[3:7]` give?
Count the indexes first: P is 0, r is 1, o is 2, g is 3.
???
`"gram"`. The slice starts at index 3 (`g`) and stops **before** index 7, so it takes indexes 3, 4, 5 and 6: `g`, `r`, `a`, `m`.
:::

::: check What does this program print?
```python
word = "Python"
print(word[1:3], word[-3:])
```
???
```output
yt hon
```
`word[1:3]` takes indexes 1 and 2: `yt`. `word[-3:]` starts at the third character from the end, `h`, and runs to the end: `hon`.
:::

## [common_mistakes] Common mistakes

- **Starting to count at 1.** The first character is `word[0]`. `word[1]` is the second character.
- **Expecting the end index to be included.** `word[0:4]` is four characters, `Prog`, not five.
- **Using the length as an index.** `word[len(word)]` is always out of range. Use `word[-1]` or `word[len(word) - 1]`.
- **Round brackets instead of square ones.** `word(0)` makes Python try to call the String like a function: `TypeError: 'str' object is not callable`.
- **Trying to change one character.** `word[0] = "J"` raises a `TypeError`, because Strings can't be changed. The Strings vs Lists lecture shows what to do instead.

## [key_takeaways] Key takeaways

- A **sequence** is an ordered collection; every element has an index, **starting at 0**.
- A String is a sequence of characters, written in single or double quotes.
- `word[i]` reads one character; negative indexes count from the end, and `-1` is the last one.
- `word[start:end]` takes from `start` up to, but not including, `end`; either number can be left out.
- `len(word)` is the number of characters, so the last index is `len(word) - 1`.
