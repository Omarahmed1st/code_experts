---
slug: list-trace-insert-and-change
type: trace
title: Insert, append and change names
lesson: lists-storing-many-values
difficulty: medium
updated: 2026-10-10
---

## Question

Trace the program by hand. What exactly does it print? Type one line of output per line.

## Code

```python
names = ["Ali", "Mona"]
names.insert(1, "Sara")
names.append("Omar")
names[0] = "Hoda"
print(names)
print(len(names), names[1], names[-2])
```

## Answer

```output
['Hoda', 'Sara', 'Mona', 'Omar']
4 Sara Mona
```

## Hints

- `insert(1, "Sara")` puts `"Sara"` at index 1. The items after it move one place to the right.
- Write down the whole List after every line before you work out the prints.

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 1 | make the List | names = ['Ali', 'Mona'] | |
| 2 | `insert(1, "Sara")` adds Sara at index 1; Mona moves to index 2 | names = ['Ali', 'Sara', 'Mona'] | |
| 3 | `append("Omar")` adds Omar to the end | names = ['Ali', 'Sara', 'Mona', 'Omar'] | |
| 4 | item 0 is replaced by Hoda | names = ['Hoda', 'Sara', 'Mona', 'Omar'] | |
| 5 | print the whole List | names = ['Hoda', 'Sara', 'Mona', 'Omar'] | ['Hoda', 'Sara', 'Mona', 'Omar']\n |
| 6 | 4 items; index 1 is Sara; -2 is the second from the end, Mona | names = ['Hoda', 'Sara', 'Mona', 'Omar'] | 4 Sara Mona\n |

## Explanation

The List changes three times:

- `insert(1, "Sara")` puts `"Sara"` **at** index 1. `"Mona"` was at index 1, so it moves to index 2: `['Ali', 'Sara', 'Mona']`.
- `append("Omar")` adds to the end: `['Ali', 'Sara', 'Mona', 'Omar']`.
- `names[0] = "Hoda"` replaces the first item. Nothing moves: `['Hoda', 'Sara', 'Mona', 'Omar']`.

When you print a whole List, Python shows the Strings inside it with quotes. On the last line, `len(names)` is 4, `names[1]` is `Sara`, and `names[-2]` is the second item from the end, `Mona`. Printing a single String shows it without quotes.
