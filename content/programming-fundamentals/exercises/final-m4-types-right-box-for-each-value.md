---
slug: final-m4-types-right-box-for-each-value
type: mcq
title: The right type for a phone number
lesson: data-types
difficulty: medium
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

A program for a mobile phone shop stores some facts about each customer. Each option pairs a value with the data type a student chose for it.

Which choices are **right**? Pick **all** of them.

## Options

- [x] The customer's phone number, such as `01001234567` → `string`
  Right: a phone number is a label made of digits, not an amount. You never add or multiply phone numbers, and an `int` would lose the first 0: reading `01001234567` into an `int` stores `1001234567`.
- [ ] The price of a phone cover, such as `87.5` pounds → `int`
  An `int` keeps only whole numbers, so 87.5 would be stored as 87. A price with piastres needs `float` or `double`.
- [x] Whether the customer has paid → `bool`
  Right: the answer is only ever yes or no, which is `true` or `false`.
- [ ] The number of phones the customer bought, such as `2` → `char`
  A `char` holds one character, such as `'A'`. A count is a whole number that you calculate with, so it needs an `int`.

## Hints

- Go through the lecture's five questions for each value: whole number? decimal point? one character? text? true or false?
- For the phone number, ask: will the program ever do arithmetic with it? And what happens to a 0 at the start of a number?

## Explanation

Choosing a type means asking what **kind** of value it is and what the program will **do** with it:

| Value | Type | Why |
|---|---|---|
| phone number `01001234567` | `string` | digits used as a label: no arithmetic, and the leading 0 must be kept |
| price `87.5` | `float` or `double` | it has a decimal part |
| has paid? | `bool` | only true or false |
| phones bought `2` | `int` | a whole number you count and calculate with |

The phone number is the tricky one. It is made of digits, but it is not a quantity: adding two phone numbers means nothing. If you store it in an `int`, the number 01001234567 is the same as 1001234567, so the leading 0 is lost when you print it. Text keeps every character exactly as typed, so `string` is the right box (with `#include <string>`).
