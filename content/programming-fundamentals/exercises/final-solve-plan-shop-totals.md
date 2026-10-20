---
slug: final-solve-plan-shop-totals
type: mcq
title: Planning the shop totals
lesson: from-problem-to-program
difficulty: medium
multiple: true
updated: 2026-10-10
reserved: true
---

## Question

**Problem:** a shop program reads the prices of **10** items, one by one. A price can have piastres, for example `12.75` pounds. At the end it prints the **total** of all the prices and **how many** items cost more than 100 pounds.

A student plans the solution with a loop that reads one price in each pass. Which parts of the plan are **correct**? Pick **all** the correct ones.

## Options

- [x] `total` is a `float`, and it is set to 0 **before** the loop.
  Right: prices have decimals, and an accumulator must start at 0 before the first price is added.
- [ ] `expensiveCount` is a `float`, because the prices have decimals.
  A count is always a whole number (0, 1, 2 …), so it is an `int`. Only the prices and the total need decimals.
- [x] The check `price > 100` goes **inside** the loop, so it is made for each price.
  Right: each pass reads a new price, so the decision must be made again in each pass.
- [ ] The total is printed **inside** the loop, right after it is updated.
  Then it would be printed 10 times, once per price. The final total is only known after the last price, so print it after the loop.

## Hints

- For each variable, ask the data-type questions: is it a whole number, or can it have a decimal point?
- What must happen once (before or after the loop), and what must happen for every price?

## Explanation

Analyzing the requirements means choosing the right data type for each value and deciding where each step goes.

- **Data types:** a price like 12.75 needs `float`, so the total of the prices is a `float` too. A count of items is a whole number, so it is an `int`.
- **Before the loop:** accumulators and counters start at 0, once, before the loop. If `total` started inside the loop, it would be reset in every pass.
- **Inside the loop:** read the price, add it to `total`, and decide `price > 100`. The decision sits inside the loop because there is a new price in every pass.
- **After the loop:** print the results once, when all 10 prices are in.
