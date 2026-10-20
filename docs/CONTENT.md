# Writing lessons for Code_Expert

Lessons are Markdown files kept in this repository. A build step checks them and loads them into the database. In Phase 4 the admin pages will edit the same fields in the browser. Until then, this file is how lessons are written.

```
content/
  <course-slug>/
    course.json            course id and its topics, in teaching order
    lessons/*.md           one lesson per file (file names only set the order of ties)
    images/*.png           pictures used by [diagram] sections
```

The workflow:

```
npm run content:check      # compile/run every program and compare outputs (needs g++ and python3; OpenCV lessons need opencv-python)
npm run content:build      # write seed/0002_content.sql and seed/r2-objects.json
npm run db:seed:local      # load courses, lessons and images into the local D1 and R2
```

`content:check` must pass before a lesson is published. It runs C++ with `g++ -std=c++17 -Wall -Wextra` and shows warnings. It runs Python with `python3 -I` in a temporary folder that holds the course's images. To check only some files while you write, run the two checkers directly with part of a file name: `node --experimental-strip-types tools/check-lesson-code.ts strings` checks the lesson files whose path contains `strings`, and `tools/check-exercise-code.ts` takes the same argument for questions.

## A lesson file

```markdown
---
slug: strings-indexing-and-slicing        # lower-case words joined by hyphens, unique in the course
title: "Strings: indexing and slicing"    # quote it if it contains a colon
topic: strings                            # a topic slug from course.json
lecture: 5                                # optional: the lecture (week) in the course's slides; several lessons can share one
difficulty: easy                          # easy | medium | hard
description: One sentence for cards and search results.
objectives:
  - Read one character with an index
prerequisites:
  - Variables and print()
related:
  - lists-storing-many-values             # other lesson slugs in the same course
updated: 2026-10-08
status: published                         # optional: published (default) or draft
---

## [explanation] A String is a sequence of characters

Plain Markdown: **bold**, `code`, lists, tables, links.
```

Each `## [kind] Title` starts a section. A lesson needs at least three sections. The kinds are:

| Kind | Shown as |
|---|---|
| `explanation` | "Read" |
| `example` | "Example" |
| `code` | "Code", or "Try it" when the program has a Run button (`run`) |
| `diagram` | "Picture": the only kind that may have an image |
| `common_mistakes` | "Watch out", in a coral panel |
| `key_takeaways` | "Remember", in a yellow panel |
| `note` | "Note", or "Quick check" when the title says "check yourself" |

## Programs and the lec stage

A section can hold **one program**. It is shown on the lec stage: the INPUT box, the yellow Run button and the OUTPUT box. Write the program last in its section; text after it belongs in a new section.

````markdown
```python program run
word = "Python"
print(word[0])
```

```input
(optional) what the user types, one line per input()
```

```output
P
```

```notes
2 | [0] | first character | circle sky
```

```strip
1 | "Python" | chr | auto | neg
```
````

- **`python program run`**: Python with Edit and a Run button that really runs in the browser. Only the standard library is allowed, because the browser runtime has no other packages; the checker enforces this.
- **`cpp program run`**: C++ with Edit and a Run button; it is compiled (Clang) and run in the browser. All C++ programs in the lectures use this. The checker still compiles and runs every one with g++ and compares the OUTPUT box. A program meant to fail (a compile error, an endless loop) can have no OUTPUT box: Run then shows the compiler's message or stops at the 10-second limit, which is the lesson. Keep to what the browser compiler supports: no exceptions (`try`/`throw`), threads, `system()` or files.
- **`python program`** (no `run`) or **`cpp program`** (no `run`): no Run button. The button says "Show output" and replays the OUTPUT box, labelled as recorded output. Use this for OpenCV and for Zelle's `graphics.py`, which need a screen the browser runtime doesn't have.

  The checker still runs every such Python program, through `tools/lesson-runtime/run_lesson.py`: windows don't open (`cv2.imshow()` keeps the image, `cv2.waitKey()` returns -1 at once), `from graphics import *` loads a stand-in that records the drawing, and `cv2.VideoCapture(0)` plays a 10-frame clip made from `street.png` instead of a camera, then ends. If the program has an OUTPUT box, the output must match. If it has none (a program that only shows windows), it must **run without error**; the checker reports that as a pass of its own, not as a comparison. Outputs recorded this way come from the test clip, not a real camera, and the lesson must say so.
- **`pseudocode program`**: pseudocode on the stage. No computer runs pseudocode, so if it has an OUTPUT box it also needs a **`cpp verify`** block: the same steps in C++. The checker runs that C++ and compares its output with the OUTPUT box. The verify block is never shown on the site, and the stage says the output came from the C++ version.

  ````markdown
  ```pseudocode program
  BEGIN
      INPUT T
      IF T > 30 THEN
          PRINT "Fan ON"
      ELSE
          PRINT "Fan OFF"
      END IF
  END
  ```

  ```input
  32
  ```

  ```output
  32
  Fan ON
  ```

  ```cpp verify
  #include <iostream>
  using namespace std;
  int main()
  {
      float t;
      cin >> t;
      if (t > 30) cout << "Fan ON" << endl;
      else cout << "Fan OFF" << endl;
      return 0;
  }
  ```
  ````
- **`output`**: exactly what the program prints. The checker compares it character by character. Leave it out only when the program is meant to fail or never finishes, such as an infinite-loop example (the section then has nothing to compare, and the checker reports a skip).
- **`input`**: keyboard input. The OUTPUT box is a **terminal transcript**, so write each typed line where the program reads it, as a terminal shows it. The site colours those lines green.

  ```output
  Enter your age: 19
  Next year you will be 20
  ```

  The checker removes the typed lines, compares the rest with what the program printed, and fails if a typed line is missing.

### Notes (chips joined to the code)

One row per chip: `line | code | note | shape colour`.

- `line` is 1-based. `code` is the exact text on that line the chip points at (its first occurrence). Wrap it in backticks to keep spaces at its edges.
- The note text is at most 60 characters. Short is better: 2 to 5 words.
- Shapes are `circle`, `square`, `diamond` and `tri`. Colours are `sky`, `yel`, `coral` and `green`. Use coral for mistakes.
- At most 8 notes per program.

### Strips (index boxes under a value)

One row per strip: `line | code | chr or item | items or auto | neg`.

- `chr` makes one box per character of a String, and `item` one box per item of a List.
- `auto` takes the boxes from the code itself (`"Python"` gives P y t h o n; `[3, 5, 8]` gives 3 5 8). Otherwise list the labels, comma-separated.
- Add `neg` to show the negative indexes too.
- At most 2 strips per program and 16 boxes per strip.

## Pictures

Only in `[diagram]` sections, one per section, on its own line:

```markdown
![A 6 by 4 grid of grey squares with their values written inside](images/pixel-grid.png)
```

The alt text is required. Describe what the picture shows, not just its name. Images go to R2 under `courses/<course_id>/lessons/<lesson_id>/` and are served only while the lesson is live. Each picture has a download link under it. Every picture is drawn by a script, so there are no photo rights to check and anyone can recreate them:

| Pictures | Script |
|---|---|
| Programming Fundamentals flowcharts | `tools/content-images/make_flowcharts.mjs` (an SVG for each chart, then a PNG with Playwright's Chromium; see the top of that file) |
| Computer vision: `shapes`, `pixel-grid`, `bgr-channels`, `marked`, `scene`, `brightness-contrast`, `overflow` | `tools/content-images/make_cv_images.py` |
| Computer vision: the test images `street`, `poor-street`, `noisy-street`, `view-a`, `view-b`, and every `cv-*.png` | `tools/content-images/make_cv_lab_images.py` |
| Python: every `py-*.png` (graphics.py windows) | `tools/content-images/make_py_graphics.py` |

The last two scripts take the program from the lesson file itself, run it through the lesson runtime and draw the windows it showed, so a picture can't drift from its code. `make_py_graphics.py` simply redraws whatever the program now draws. `make_cv_lab_images.py` also checks that the code it uses for a picture still matches the lesson, and stops with an error if it doesn't; numbers written on its pictures are read from the programs' output. Run them with `python3 tools/content-images/<script>`. `make_py_graphics.py` needs the Liberation Sans and DejaVu Sans fonts (set `FONT_DIR` if they aren't in `/usr/share/fonts/truetype`); `make_cv_lab_images.py` uses Poppins from `node_modules` after `npm install`, falling back to DejaVu Sans.

## Check yourself and callouts

````markdown
::: check What does this print?
```python
s = "Cairo"
print(s[1] + s[-1])
```
???
`ao`: index 1 is `a`, and index -1 is the last character, `o`.
:::

::: tip
A tip for the reader.
:::

::: warning
Something that often goes wrong.
:::
````

The part after `???` is hidden behind "Show answer". When a check contains a program and an `output` block, the checker runs it too.

## Rules for content

- Write everything yourself, in plain words. Don't copy text from books or other sites.
- Every program must pass `npm run content:check`. Never type an output by hand without running the program.
- Mark mistakes as mistakes: put deliberately wrong code in a `common_mistakes` section and say what goes wrong.
- If something differs between versions (OpenCV 4 vs 5, for example), avoid it or say so in the lesson.

# Exercises, quizzes and practice exams (Phase 3)

Questions live next to the lessons, one file per question:

```
content/<course-slug>/
  exercises/*.md     one question per file (four types)
  quizzes/*.md       a fixed list of questions from this course
  exams/*.md         rules that draw random questions from this course's bank
```

`npm run content:check` runs every exercise's code too (`tools/check-exercise-code.ts`), and `npm run content:build` writes them to `seed/0003_exercises.sql`. A multiple-choice or trace question may use OpenCV, NumPy or graphics.py, because students only read those programs: the checker runs any question that imports `cv2` or `graphics` through the lesson runtime, like the lecture programs. Fix-the-code and write-the-code questions run in the student's browser, so they must use plain Python (no OpenCV, no graphics.py) and `input()` without a prompt. A question, quiz or exam can only use its own course's topics, lessons and questions; the build stops if one points anywhere else.

## An exercise file

```markdown
---
slug: trace-countdown-by-twos       # unique in the course
type: trace                         # mcq | trace | correct_code | write_code
title: Counting down in twos
lesson: while-loops-in-cpp          # optional: the lesson it practises (its topic is used if topic is left out)
topic: while-loops                  # optional when lesson is given
difficulty: easy                    # easy | medium | hard
points: 1                           # optional, default 1
updated: 2026-10-09
status: published                   # optional: published (default) or draft
demo: false                         # optional: true marks demonstration content on the site
---

## Question

Markdown: what the student must do.

## Code

```cpp
…the program: code to read (mcq), to trace, to correct, or starter code to complete…
```

## Explanation

Markdown, shown after the student answers. Required for every question.
```

Every question has `## Question` and `## Explanation`. Optional for every type: `## Hints` (a list; students open them one at a time). The other sections depend on the type:

| Type | Sections | How it is marked |
|---|---|---|
| `mcq` | `## Code` (optional), `## Options`, `## Answer` (optional) | On the server: right when exactly the correct options are picked |
| `trace` | `## Code` (cpp, python or pseudocode), `## Answer`, `## Steps` (optional) | On the server: the typed output is compared with the answer |
| `correct_code` | `## Code` (the broken program), `## Expected behavior`, `## Tests`, `## Solution`, `## Also accepted` (optional) | Tests run in the student's browser; the server compares the fix with the solution and every accepted fix, ignoring spaces, blank lines and comments |
| `write_code` | `## Code` (starter code), `## Expected behavior`, `## Tests`, `## Solution` | Tests run in the student's browser, then the model solution and explanation are shown. Practice only: not used in quizzes or exams until the Phase 9 server runner |

### Options (MCQ)

```markdown
## Options

- [ ] It prints 1, 2 and 3.
  Feedback for this option, indented under it (optional).
- [x] It prints nothing and never finishes.
  Why this one is right.
```

`[x]` marks the correct option. Use 4 options where you can. Several `[x]` need `multiple: true` in the front matter (students must pick all of them). Options are shuffled unless `shuffle: false`. An MCQ about output can prove its answer with an `## Answer` block (below); the checker runs the code and compares.

### Answer (trace)

````markdown
## Answer

```output
7
5
Done
```
````

Exactly what the program prints. Add more `output` blocks for other accepted answers. Front matter `compare:` sets how a typed answer is compared:

- `trim_trailing` (default): spaces at line ends and blank lines at the end don't count
- `exact`: every space counts (use it when spacing is the point of the question)
- `normalize_whitespace`: any spacing or line breaks count as one space

`case: insensitive` ignores upper/lower case (default `sensitive`). Pseudocode can't run, so a pseudocode trace needs a ```` ```cpp verify ```` block in `## Code` with the same steps in C++; it is never shown.

### Steps (trace, optional)

A trace table shown after answering. The checker joins the Output column and compares it with the answer, so fill it in fully or leave the column empty.

```markdown
## Steps

| Line | What happens | Variables | Output |
|---|---|---|---|
| 5 | `n` starts at 7 | n = 7 | |
| 8 | print 7 | n = 7 | 7\n |
```

Variables are `name = value` pairs separated by `;`. Write `\n` for a line break in Output.

### Tests (correct_code, write_code)

````markdown
## Tests

### n is 5

```input
5
```

```output
Sum = 15
```

### a test only the Phase 9 runner uses (hidden)
…
````

Each `###` heading is one test: optional `input` (what the user types) and the exact `output` (only what the program prints; typed input isn't echoed here). `compare:` in the front matter applies to tests too. Visible tests run in the student's browser; tests marked `(hidden)` are kept for the Phase 9 server runner and never sent to the browser, so at least one test must be visible.

### Solution and Also accepted

`## Solution` is one complete program that passes every test (shown after answering). For `correct_code`, `## Also accepted` lists other correct fixes (for example `i < n + 1` instead of `i <= n`). The server accepts a fix that matches any of them token for token; layout and comments don't matter. The checker proves the broken program fails at least one test and every fix passes all of them.

Python that students run in the browser may only use the standard library.

### Question formats (`ask:`)

Four formats sit on top of `trace` and `correct_code`. Add `ask:` to the front matter:

| Format | Type | What the student does | How it's marked |
|---|---|---|---|
| `ask: count` | `trace` | types how many times something happens ("How many times does the loop run?") | like a trace answer: against `## Answer`, which is one whole number |
| `ask: value` | `trace` | types the value of a variable at a point ("What is `total` after the loop?") | against `## Answer`, one line; spaces don't matter |
| `ask: blanks` | `correct_code` | fills in each `___` in the program | the filled-in program must match `## Solution` or an `## Also accepted` program |
| `ask: order` | `correct_code` | moves the shuffled middle lines into the right order | the arranged program must match the program in `## Code` or an `## Also accepted` order |

**count and value** need a hidden ```` ```cpp verify ```` (or ```` ```python verify ````) block in `## Code`: a copy of the program that prints the answer (for example with a counter added). The checker runs it and compares its output with `## Answer`; students never see it. `## Steps` are allowed but not checked against the answer.

**blanks:** `## Code` is the program with three or more underscores (`___`) for each blank (1 to 12 blanks). `## Solution` and every `## Also accepted` program must be exactly `## Code` with the blanks filled in. List every other correct way to fill the blanks under `## Also accepted` (for example `i < n + 1` for `i <= n`). `## Tests` and `## Expected behavior` are required: the checker runs every accepted program on the tests, and in practice mode the student's filled-in program runs on them too.

**order:** `## Code` is the complete, correct program with the lines to arrange between two marker lines, `// [order]` and `// [/order]` (`# [order]` / `# [/order]` in Python). Put 3 to 15 lines between them. There is no `## Solution`: it is the program without the markers. When lines can swap and the program still works (two independent declarations, for example), list each other correct order under `## Also accepted` as a complete program; the build checks that each one only moves the marked lines. Students only ever receive the marked lines in a random order, never the program itself. Python lines keep their indentation as written.

## A quiz file

```markdown
---
slug: loops-checkpoint
title: Loops checkpoint
mode: practice        # practice: feedback after each question | exam: answers and explanations only after submitting
time: 15              # optional minutes; the server enforces it
pass: 60              # pass mark in percent (default 60)
shuffle: false        # shuffle question order for each attempt
shuffleOptions: true  # shuffle MCQ options (default true)
topic: while-loops    # optional: the quiz's topic
questions:
  - while-semicolon-after-condition
  - trace-countdown-by-twos | 2      # optional points
---

Markdown description shown above the Start button.
```

Quizzes take `mcq`, `trace` and `correct_code` questions from the same course. `write_code` isn't allowed until a server runner can score it.

Two more quiz settings:

- `attempts: 2` allows that many attempts in any 24 hours, then the quiz locks until 24 hours after the first one. Until student accounts exist (Phase 5) the count lives in a signed cookie in the student's browser, so a private window or cleared site data starts over.
- `topic:` makes it that topic's quiz; the quizzes page lists those under "A quiz for each topic", after the mixed quizzes.

### Reserved questions (a final quiz nobody has seen)

An exercise with `reserved: true` in its front matter belongs to one quiz only. It has no page of its own and never appears in the question library, practice sets, search, the sitemap, custom exams or practice exams. The build refuses a reserved question listed by two different quizzes (the models of one quiz may share them, below).

### Models (versions of one quiz)

A quiz can come in several models with different questions. The quiz file itself is model A. Each other model is its own file whose slug is the quiz's slug plus `-model-b`, `-model-c`, …, with `modelOf:` naming the quiz:

```markdown
---
slug: final-quiz-model-b
title: Final quiz, model B
modelOf: final-quiz
questions:
  - final-b-ops-precedence-and-compare   # shared with the other models
  - final-m2-while-trace-bus-stops       # only in this model
---
```

A model takes its timer, pass mark, shuffling, attempts and status from the quiz; only its questions are its own, and its description is not used. Models are never listed or opened on their own. Each attempt gets a model at random, never the one that browser had on its last attempt, and the attempt limit counts all models together. Give every model the same number of questions and points so the quiz page's facts hold for all of them.

## A practice exam file

```markdown
---
slug: loops-practice-exam
title: Loops practice exam
time: 30
pass: 60
scope: mixed_topics   # course | topic | mixed_topics
draw:
  - count: 4, type: mcq
  - count: 2, type: trace, topic: while-loops
  - count: 1, type: correct_code, difficulty: medium, points: 2
---

Markdown description.
```

Each attempt draws fresh random questions by these rules (never the same question twice in one attempt, never `write_code`). The build stops if the course doesn't have enough published questions for the rules.

# Content files and the admin (Phase 4)

There are now two ways to write content: Markdown files in `content/` (built into `seed/` by `npm run content:build`) and the admin at `/admin`. Both write the same rows and follow the same rules: a question saved in the admin is checked by turning it into this Markdown format and reading it back, so anything the admin accepts can be exported as a content file.

- **Download as Markdown** on a lecture or a question gives the content file for it; **Export all** on the Questions page gives every question of the course as one JSON file. **Import** on the Questions page reads that JSON file or one or more question `.md` files: each is checked, a question whose address already exists in the course is updated, and the others are added as new.
- The seed files write rows by their fixed ids. **Running `npm run db:seed:local` again puts every seeded lecture, question and quiz back to its content-file version, undoing changes made to them in the admin.** Things created in the admin are left alone. So once the admin is in use:
  - on the real database, don't run the seed again; make changes in the admin;
  - to keep an admin change in `content/` too, download it as Markdown and replace the file.
- A new lecture or question made in the admin must not reuse an address that a content file also uses, or the next seed fails on the unique address.
- Pictures uploaded in the admin live only in R2 (`courses/<course id>/lessons/<lesson id>/…`); pictures in `content/` are copied to R2 by the seed.

