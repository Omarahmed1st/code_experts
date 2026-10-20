---
slug: vars-legal-names
type: mcq
multiple: true
title: Allowed variable names
lesson: variables-and-data-types
difficulty: easy
updated: 2026-10-16
---

## Question

Which of these can be used as variable names? Pick **all** that are allowed.

## Options

- [x] `student_age`
  Allowed: small letters and an underscore.
- [x] `max_temp2`
  Allowed: a digit is fine, as long as it isn't the first character.
- [ ] `2nd_mark`
  Not allowed: a name can't start with a digit. `mark_2` would work.
- [ ] `my name`
  Not allowed: names can't contain spaces. Use `my_name`.
- [ ] `if`
  Not allowed: `if` is one of Python's own words.

## Explanation

A variable name may only use **letters, digits and the underscore**, it must **not start with a digit**, and it can't be one of Python's own words such as `if`, `else`, `for` or `True`. Breaking any of these rules is a `SyntaxError`.
