---
slug: cvm-crosscheck
type: mcq
title: What crossCheck keeps
lesson: feature-matching
difficulty: medium
updated: 2026-10-16
---

## Question

Feature 4 in image A has feature 9 in image B as its best match. But feature 9 in image B has feature 2 in image A as **its** best match. With `crossCheck=True`, what happens to the pair A4–B9?

## Options

- [x] It is dropped, because the two features don't choose each other.
  Right: cross-checking keeps a match only when A's best is B **and** B's best is A.
- [ ] It is kept, because A4 chose B9.
  Without cross-checking it would be kept. Cross-checking also asks B9.
- [ ] It is kept, together with A2–B9.
  A2–B9 is only kept if A2's best match is B9 too. A4–B9 is dropped either way.
- [ ] The matcher stops with an error, because B9 is chosen twice.
  Disagreements are normal; cross-checking simply drops one-sided matches.

## Explanation

`crossCheck=True` keeps a match only if the two features **choose each other**. One-sided matches, like A4 → B9 here, are often wrong matches between patches that only look a bit alike, so dropping them makes the result more reliable.
