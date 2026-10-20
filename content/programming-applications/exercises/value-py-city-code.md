---
slug: value-py-city-code
type: trace
ask: value
title: What is the city code?
lesson: strings-indexing-and-slicing
difficulty: medium
updated: 2026-10-10
---

## Question

The program builds a code from the name of a city. What is the value of `code` **when the last line runs**? Type the characters only, without quotes.

## Code

```python
city = "Hurghada"
part = city[2:5]
code = part[-1] + city[::3]
print("The code is ready")
```

```python verify
city = "Hurghada"
part = city[2:5]
code = part[-1] + city[::3]
print(code)
```

## Answer

```output
hHgd
```

## Hints

- Write the indexes under the letters first: H is 0, u is 1, r is 2 … the last `a` is 7.
- `part[-1]` is the last character of `part`, not of `city`.

## Explanation

Number the characters of `"Hurghada"`:

| Index | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| Character | H | u | r | g | h | a | d | a |

1. `city[2:5]` takes indexes 2, 3 and 4 (5 is not included), so `part` is `"rgh"`.
2. `part[-1]` is the last character of `part`: `h` (small h).
3. `city[::3]` starts at index 0 and jumps 3 each time: indexes 0, 3 and 6, which are `H`, `g` and `d`.
4. `+` joins them: `"h" + "Hgd"` is **`hHgd`**.

Capital letters matter: the first character is the small `h` from `part`, and the second is the capital `H` from index 0 of `city`.
