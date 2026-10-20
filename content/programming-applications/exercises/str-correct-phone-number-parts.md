---
slug: str-correct-phone-number-parts
type: correct_code
title: Fix the phone number parts
lesson: strings-indexing-and-slicing
difficulty: easy
updated: 2026-10-10
---

## Question

This program reads a mobile number with 11 digits, such as `01012345678`, as a String. It should print the **first three** digits and the **last four** digits. It has **two** bugs. Find them and fix the program.

## Code

```python
number = input()
first3 = number[0:2]
last4 = number[-4:-1]
print("Starts with:", first3)
print("Ends with:", last4)
```

## Expected behavior

The user types an 11-digit number. The program prints two lines. For `01012345678` it prints:

```
Starts with: 010
Ends with: 5678
```

## Tests

### 01012345678

```input
01012345678
```

```output
Starts with: 010
Ends with: 5678
```

### 01198765432

```input
01198765432
```

```output
Starts with: 011
Ends with: 5432
```

### a number that ends in zeros and a 9

```input
01500000009
```

```output
Starts with: 015
Ends with: 0009
```

## Solution

```python
number = input()
first3 = number[0:3]
last4 = number[-4:]
print("Starts with:", first3)
print("Ends with:", last4)
```

## Also accepted

```python
number = input()
first3 = number[:3]
last4 = number[-4:]
print("Starts with:", first3)
print("Ends with:", last4)
```

```python
number = input()
first3 = number[0:3]
last4 = number[7:]
print("Starts with:", first3)
print("Ends with:", last4)
```

```python
number = input()
first3 = number[:3]
last4 = number[7:]
print("Starts with:", first3)
print("Ends with:", last4)
```

```python
number = input()
first3 = number[0:3]
last4 = number[7:11]
print("Starts with:", first3)
print("Ends with:", last4)
```

```python
number = input()
first3 = number[:3]
last4 = number[7:11]
print("Starts with:", first3)
print("Ends with:", last4)
```

```python
number = input()
first3 = number[0:3]
last4 = number[len(number) - 4:]
print("Starts with:", first3)
print("Ends with:", last4)
```

```python
number = input()
first3 = number[:3]
last4 = number[len(number) - 4:]
print("Starts with:", first3)
print("Ends with:", last4)
```

## Hints

- How many characters does `number[0:2]` give? Is the character at the stop index included?
- `number[-4:-1]` stops **before** index -1. Which character is at index -1?

## Explanation

1. **`number[0:2]` gives only two digits.** A slice stops **before** the stop index, so `[0:2]` takes indexes 0 and 1. To get three digits, the stop must be 3: `number[0:3]` (or `number[:3]`).
2. **`number[-4:-1]` drops the last digit.** Index -1 is the last character, and the stop is never included, so this slice gives only three digits (`567` for `01012345678`). Leave the stop out so the slice runs to the end: `number[-4:]`.

The number is read as a String on purpose. As text, the leading `0` stays, and you can slice it like any other String.
