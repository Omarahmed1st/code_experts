---
slug: io-write-welcome
type: write_code
title: A welcome message
lesson: input-processing-and-output
difficulty: easy
updated: 2026-10-16
---

## Question

Write a program that reads a name, a city and a year of birth (each on its own line), and prints two lines:

1. `Welcome,` followed by the name, `from` and the city
2. `You will be` followed by the person's age at the end of 2030, then `in 2030`

Use `input()` without prompts, and convert only what you calculate with.

## Code

```python
# read the three values here

```

## Expected behavior

For `Mona`, `Alexandria` and `2006` the program prints:

```
Welcome, Mona from Alexandria
You will be 24 in 2030
```

## Tests

### Mona from Alexandria

```input
Mona
Alexandria
2006
```

```output
Welcome, Mona from Alexandria
You will be 24 in 2030
```

### Omar from Aswan

```input
Omar
Aswan
2004
```

```output
Welcome, Omar from Aswan
You will be 26 in 2030
```

## Solution

```python
name = input()
city = input()
year = int(input())
print("Welcome,", name, "from", city)
print("You will be", 2030 - year, "in 2030")
```

## Hints

- The name and the city stay as text. Only the year needs `int()`.
- The age at the end of 2030 is 2030 minus the year of birth.

## Explanation

The three `input()` lines read the values in the order they are typed. Only the year takes part in a calculation, so only it goes through `int()`. In `print`, commas put a space between the items, which gives `Welcome, Mona from Alexandria` with no extra work.
