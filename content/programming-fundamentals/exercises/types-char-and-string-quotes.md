---
slug: types-char-and-string-quotes
type: mcq
title: Single quotes or double quotes?
lesson: data-types
difficulty: medium
multiple: true
updated: 2026-10-10
---

## Question

The program has `#include <iostream>`, `#include <string>` and `using namespace std;` at the top. Which of these declarations are **correct** C++? Pick **all** the correct ones.

## Options

- [x] `char grade = 'B';`
  Correct: a `char` holds one character, written in single quotes.
- [x] `string name = "Mona";`
  Correct: a `string` holds text, written in double quotes.
- [ ] `char grade = "B";`
  Wrong: `"B"` in double quotes is text (a string), even though it has only one letter. A `char` needs single quotes: `'B'`. The compiler refuses this line.
- [ ] `string city = 'Cairo';`
  Wrong: single quotes are for **one** character only. Text such as `Cairo` needs double quotes: `"Cairo"`. The compiler refuses this line.

## Hints

- Which type uses single quotes, and which uses double quotes?
- Does a one-letter value in double quotes become a `char`?

## Explanation

The kind of quotes tells C++ what kind of value you wrote:

- **Single quotes** `'B'` make one character, a `char`.
- **Double quotes** `"Mona"` make text, a `string`. This is true even for one letter: `"B"` is text, not a `char`.

So `char grade = 'B';` and `string name = "Mona";` are correct. `char grade = "B";` tries to put text in a one-character box, and `string city = 'Cairo';` puts five characters in single quotes, which C++ does not read as text. The compiler gives an error for both.
