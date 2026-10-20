---
slug: pseudo-input-to-cpp
type: mcq
title: Turning INPUT into C++
lesson: pseudocode-planning-before-code
difficulty: medium
updated: 2026-10-10
---

## Question

Your pseudocode has the line `INPUT width`. Which C++ line does the same thing?

## Options

- [ ] `cout << width;`
  `cout` **displays** a value. That matches `PRINT width`, not `INPUT width`.
- [x] `cin >> width;`
  Right: `cin >>` reads a value typed by the user and stores it in `width`.
- [ ] `width = cin;`
  This is not how C++ reads a value. Reading uses `cin >>` followed by the name.
- [ ] `cin << width;`
  The arrows point the wrong way. Reading uses `>>`, as if the value flows from `cin` into `width`.

## Hints

- `INPUT` reads a value. Which C++ word reads, and which one prints?
- Look at the direction of the arrows in the C++ lines from the lecture.

## Explanation

When the plan is right, turning pseudocode into C++ is mostly a matter of swapping words for symbols:

| Pseudocode | C++ |
|---|---|
| `INPUT width` | `cin >> width;` |
| `PRINT width` | `cout << width;` |
| `area ← length * width` | `area = length * width;` |

`INPUT` reads a value, so it becomes `cin >>`. `PRINT` shows a value, so it becomes `cout <<`. In C++ every statement also ends with a semicolon `;`.
