---
slug: final-m4-intro-precise-enough-steps
type: mcq
title: Steps a computer can follow
lesson: what-is-programming
difficulty: medium
multiple: true
reserved: true
updated: 2026-10-10
---

## Question

A kiosk program sells phone cards. A student wrote down the steps for the program in plain English before writing any code. A computer follows steps **exactly** and never guesses what you meant.

Which of these steps are **precise enough** for a computer to follow as they are? Pick **all** of them.

## Options

- [x] Multiply the price of one card by the number of cards, and store the result in `total`.
  Precise: it says exactly which two values to use, what to do with them, and where to keep the result.
- [ ] Add a reasonable service fee to the total.
  Not precise: how much is "reasonable"? A person can guess; a computer can't. The step needs an exact amount, such as "add 2 pounds".
- [x] If `total` is 100 or more, take 5 pounds off `total`; otherwise leave `total` as it is.
  Precise: the condition (`total >= 100`) and both paths are exact. This is a decision a computer can follow.
- [ ] Keep asking the customer for cards until they seem happy.
  Not precise: a computer can't tell whether someone "seems happy". A loop needs an exact condition, such as "until the customer types 0".

## Hints

- For each step, ask: could two different people follow it and get **different** results? If yes, it is not precise.
- Think of the lecture's recipe: "add some salt" is fine for a person, but a computer needs "add 5 grams of salt".

## Explanation

A program is a list of **precise steps**, carried out exactly in order. The computer does exactly what each step says and never fills in a gap with common sense.

- "Multiply the price by the number of cards and store it in `total`" names the input values, the operation and where the result goes. It can be written straight away as `total = price * cards;`.
- "If `total` is 100 or more, take 5 pounds off" is an exact decision, `if (total >= 100)`, with a clear action on each path.
- "A reasonable service fee" and "until they seem happy" depend on someone's judgement. Two people could do them differently, so a computer can't do them at all. They must be made exact first, for example "add 2 pounds" or "until the customer types 0".

This is why programmers **understand** and **design** first: turning vague wishes into exact steps is the real work, and the code comes after.
