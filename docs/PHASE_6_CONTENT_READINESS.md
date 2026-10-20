# Phase 6: content readiness

**Short answer:** all three courses now have substantial, checked lectures. On 2026-10-15 the owner chose to write more Python and Computer Vision lectures before applying, and uploaded the slides for both courses (Python weeks 1 to 3, Computer Vision weeks 1 to 3). From them, 14 Python and 17 Computer Vision lectures were written (they replace the 2 + 2 that existed). 12 of 47 topics still say "Coming soon", down from 29. Google publishes no minimum number of pages, but it does say sites should have original, useful content and no pages "under construction". Nothing in this phase can promise approval.

On 2026-10-15 the owner also chose to have practice questions written for the 17 new topics that had none. 124 questions and 17 topic quizzes were written by hand from the lectures on 2026-10-16 (nothing was auto-generated: the owner decided on 2026-10-10 against auto-generated questions). No filler text was written: every new lecture follows the owner's slides, every program in it was run, and every question's answer key was checked by running it.

## What the site has (counted from the seeded database, 2026-10-16)

| Course | Topics | Topics without a lecture | Lectures | Questions | Quizzes | Exams | Files |
|---|---|---|---|---|---|---|---|
| C++ Fundamentals (`programming-fundamentals`) | 19 | 5 | 17 | 230 | 21 | 1 | 0 |
| Python Applications (`programming-applications`) | 13 | 5 | 14 | 68 | 9 | 0 | 0 |
| Computer Vision (`computer-vision`) | 15 | 2 | 17 | 90 | 14 | 0 | 0 |

No lecture or question is a demo or placeholder (`is_demo = 0` everywhere). The new Python and Computer Vision lectures have about 3,800 to 10,400 characters of text outside the code boxes, in 8 to 21 sections each.

Topics with no lecture yet, because the slides for them haven't been uploaded:

- C++: Tracing programs, Nested conditions, Nested loops, Arrays, Functions.
- Python: Basic object-oriented programming, Tuples, Dictionaries, Functions, Practical programming exercises.
- Computer Vision: Image transformations, Object recognition basics.

**Every topic with a lecture now has practice and a quiz.** The 17 topics that had a lecture but no questions (6 Python, 11 Computer Vision) each got 6 to 11 hand-written questions and a practice quiz of 6 to 8 of them:

| Course | New questions | Multiple choice | Trace the output (incl. "what is the value") | Fix the code (incl. blanks, order) | Write the code | New quizzes |
|---|---|---|---|---|---|---|
| Python Applications | 48 | 24 | 13 (4) | 7 (1, 1) | 4 | 6 |
| Computer Vision | 76 | 43 | 20 (4) | 11 | 2 | 11 |

How they were written:

- Each question tests something its own lecture teaches, using that lecture's examples (the street picture's pixels, the sharpening kernel, the camera loop) and, where the lecture already worked an example, mostly new numbers.
- Fix-the-code and write-the-code questions run in the student's browser, so they use plain Python only. For Computer Vision they work on pixel values in Lists (a grey value, a median of five neighbours, a contrast stretch, a minimum-distance filter, a frame loop), the same calculations OpenCV does.
- Questions that use OpenCV, NumPy or graphics.py are multiple choice or "trace the output": students read them, they don't run them. Their outputs were recorded by running them with OpenCV 5.0.0 and NumPy 2.5.3. Images are made in the code (`np.zeros`, `np.full`, small arrays), so no question needs a picture file.
- Fix-the-code questions have tests that the broken program fails (checked), and accepted alternative fixes are checked too.

The test `assessments.test.ts` now expects **no** topic without questions, so a new topic added without them fails it.

## Is it correct?

`npm run content:check` compiles and runs every program in every lecture and every question, and compares the output with what the page says:

- Lecture programs: 299 passed, 0 failed, 7 skipped (114 C++, 134 Python, 51 Computer Vision). The 7 skipped are deliberate "this is broken" examples (an error that stops the program, reading past the end of a list, changing a String, a name starting with a number, two infinite loops, a find-the-bug program) that have no OUTPUT box to compare.
- Questions: 586 checks passed, 0 failed, 0 skipped (452 before the new questions).

How the programs that can't run in the browser were checked:

- **OpenCV** needs a screen and, in lecture 3, a camera. The checker runs these programs with OpenCV 5.0.0 through `tools/lesson-runtime/run_lesson.py`: windows don't open (the images are kept), and the camera is replaced by a 10-frame clip made from the course's street picture. Printed numbers were recorded from those runs. The live-camera lecture says plainly that its numbers come from that test clip, and that numbers can differ slightly between OpenCV versions.
- **graphics.py** (Zelle's library, Python lecture 3) needs a window. The runtime has a stand-in that records what the program draws. The pictures of the windows in the lectures were drawn from those recordings by `tools/content-images/make_py_graphics.py`.
- These programs show "Show output" with the recorded output instead of a Run button, and a note says why.

What the checker can't judge: whether the explanations and questions are clear, whether they match how the owner teaches, whether the difficulty suits the students, and whether every fact is up to date. That needs the owner's review.

## Originality

All lectures were written in this project from the owner's own slides: C++ weeks 1 to 4, Python (ECE3112) weeks 1 to 3 and Computer Vision (ECE4704) weeks 1 to 3. They are not copied from other sites. Every picture is drawn by a script in `tools/content-images/`; the photos and `image.jpg` used in the Computer Vision slides were **not** used, because their rights are unknown, and drawn test images (a street scene and variants of it) take their place. The owner should still confirm that the slides themselves are their own material (or that they may publish it), because the content licence in the terms is left for the owner to fill in.

## Risks for an AdSense review

1. **"Coming soon" topics.** 12 of 47 topics have no lecture (5 C++, 5 Python, 2 Computer Vision). This is much less than before (29), but a reviewer can still read those rows as unfinished work.
2. **No files.** Not a problem by itself; the file pages simply don't exist yet.

## Options for the owner (pick one or combine)

| Option | Effect | Effort |
|---|---|---|
| A. Write lectures for the remaining 12 topics before applying | Removes the "Coming soon" rows at the source. Needs the slides for those topics. | High |
| B. Add exclusions at `/admin/ads` for any course you don't want ads on | Ads would never show there. The reviewer still sees those pages. | Low (already built) |
| C. Hide topics with no lecture from course pages until they have one | Course pages show only finished work. **Not built**: it changes what students see, so it waits for the owner's decision. | Small code change |

The admin's Advertising page shows the same per-course numbers ("Content before applying to AdSense") so the owner can watch them as lectures are added.

## Before applying

- Read each live course page as a stranger would: does anything look unfinished?
- Make sure every lecture link, question and quiz opens (the browser checks found no broken internal requests on the pages they visited, but they don't visit every page).
- Fill in the owner details and review the legal pages (`/admin/site`), so no page says "draft".
