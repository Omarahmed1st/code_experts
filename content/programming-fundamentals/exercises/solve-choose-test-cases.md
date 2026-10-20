---
slug: solve-choose-test-cases
type: mcq
title: Choosing good test cases
lesson: from-problem-to-program
difficulty: medium
updated: 2026-10-10
---

## Question

A program reads a student's mark and prints `PASS` if the mark is 50 or more, and `FAIL` otherwise. Which set of test marks is the **best** for checking that it works?

## Options

- [ ] 70
  One test only shows the program works for that one mark. It never checks the `FAIL` path.
- [ ] 70, 80, 90
  Three tests, but all of them should print `PASS`. A mistake in the `FAIL` path would not be found.
- [x] 30, 50, 70
  Right: one mark that should fail, the exact pass mark (the edge), and one mark that should pass.
- [ ] 50
  Testing the edge is good, but alone it does not check a normal pass or a normal fail.

## Hints

- The program has two possible outputs. Do your tests check both?
- What is the most likely place for a mistake: far from 50, or exactly at 50?

## Explanation

A program that gives the right answer once is not proven correct. One test only shows it works for that one input. Good tests cover every possible output **and** the edges.

Here, 30 should print `FAIL`, 70 should print `PASS`, and 50 checks the edge: "50 or more" includes 50 itself, so it must print `PASS`. A common mistake is to write "greater than 50", which only the test with 50 can catch.
