---
slug: order-py-numbered-playlist
type: correct_code
ask: order
title: Put the playlist program in order
lesson: lists-storing-many-values
difficulty: medium
updated: 2026-10-10
---

## Question

A playlist already has two songs. The program reads the name of one more song, adds it to the end, prints every song with its number, and finally prints how many songs there are. Move the mixed-up lines into the right order. The indentation of each line stays as it is.

## Code

```python
songs = ["Intro", "Sunrise"]
# [order]
songs.append(input())
number = 1
for song in songs:
    print(number, song)
    number = number + 1
print("Songs:", len(songs))
# [/order]
```

## Expected behavior

The user types a song name. For `Cairo Nights` the program prints:

```
1 Intro
2 Sunrise
3 Cairo Nights
Songs: 3
```

## Tests

### Cairo Nights

```input
Cairo Nights
```

```output
1 Intro
2 Sunrise
3 Cairo Nights
Songs: 3
```

### Sea Breeze

```input
Sea Breeze
```

```output
1 Intro
2 Sunrise
3 Sea Breeze
Songs: 3
```

## Also accepted

```python
songs = ["Intro", "Sunrise"]
number = 1
songs.append(input())
for song in songs:
    print(number, song)
    number = number + 1
print("Songs:", len(songs))
```

## Hints

- The new song must be in the List before the loop visits the items.
- The first song is printed with the number 1. Should `number` grow before or after the `print`?

## Explanation

1. `songs.append(input())` adds the new song to the end, so the loop will see 3 songs.
2. `number = 1` starts the counter before the loop.
3. `for song in songs:` visits each song in order.
4. `    print(number, song)` prints the number and the song (indented: inside the loop).
5. `    number = number + 1` then moves on to the next number (also inside the loop).
6. `print("Songs:", len(songs))` (not indented) runs once, after the loop.

Lines 1 and 2 don't depend on each other, so they can swap: setting `number = 1` first and then appending also works. Everything else is fixed. If the `append` comes after the loop, the new song is never printed with a number; if `number` grows before the `print`, the list starts at 2; and if the last `print` comes before the loop, `Songs: 3` would be printed first instead of last.
