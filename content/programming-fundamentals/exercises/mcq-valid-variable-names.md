---
slug: mcq-valid-variable-names
type: mcq
title: Which variable names are allowed?
lesson: variables-named-boxes-in-memory
difficulty: easy
multiple: true
updated: 2026-10-09
---

## Question

A student wants to store some marks. Which of these are **valid** variable names in C++? Pick **all** the valid ones.

## Options

- [x] `total_price`
  Valid: only letters and an underscore, and it starts with a letter.
- [x] `_score2`
  Valid: a name may start with an underscore, and digits are fine after the first character.
- [ ] `2ndPlace`
  Not valid: a name can't start with a digit. `secondPlace` or `place2` would work.
- [ ] `final mark`
  Not valid: a name can't contain a space. C++ would read it as two separate words. Use `final_mark` or `finalMark`.

## Hints

- What may the first character of a name be?
- Which characters are allowed in the rest of the name? Is a space one of them?

## Explanation

C++ names follow a few rules:

1. Start with a **letter** or an underscore `_`.
2. After that, use only **letters, digits and `_`**.
3. No spaces, and no C++ words such as `int` or `while`.

`total_price` and `_score2` follow all the rules. `2ndPlace` starts with a digit, and `final mark` has a space, so the compiler refuses both.

Being valid is not enough, though: a good name also tells the reader what is inside the box. `total_price` is much clearer than `tp`.
