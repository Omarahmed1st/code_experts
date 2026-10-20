---
slug: obj-trace-city-list
type: trace
title: A String method and two List methods
lesson: objects-and-methods
difficulty: medium
updated: 2026-10-16
---

## Question

What exactly does this program print?

## Code

```python
city = "giza"
places = ["Luxor", "Aswan"]
places.append(city.title())
places.sort()
print(city)
print(places)
print(city.upper(), len(places))
```

## Answer

```output
giza
['Aswan', 'Giza', 'Luxor']
GIZA 3
```

## Hints

- Do String methods change the String, or give back a new one?
- Do List methods change the List itself?

## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 1 | store the String "giza" | city = "giza" | |
| 2 | make a List of two Strings | places = ["Luxor", "Aswan"] | |
| 3 | `city.title()` gives a new String "Giza"; `append` adds it to the List | city = "giza"; places = ["Luxor", "Aswan", "Giza"] | |
| 4 | `sort` puts the List in order | places = ["Aswan", "Giza", "Luxor"] | |
| 5 | print city, which never changed | | giza\n |
| 6 | print the List | | ['Aswan', 'Giza', 'Luxor']\n |
| 7 | `upper()` gives "GIZA"; the List has 3 items | | GIZA 3\n |

## Explanation

String methods such as `title()` and `upper()` **give back a new String**; `city` itself stays `"giza"` the whole time. That is why line 5 prints `giza` in small letters.

List methods such as `append()` and `sort()` **change the List object itself**. After line 3 the List holds three items, and after line 4 they are in alphabetical order, so line 6 prints `['Aswan', 'Giza', 'Luxor']` and `len(places)` is 3.
