-- The three launch courses. Courses are data, not code: a new course is a new row.
-- Safe to re-run (updates the rows in place). Content (topics, lectures,
-- questions) is added per course in Phase 2.
--
-- Apply locally:  npm run db:seed:local (also loads 0002_content.sql)

INSERT INTO courses (id, slug, title, short_title, description, primary_language, tags, status, sort_order, published_at)
VALUES
  ('course_programming_fundamentals', 'programming-fundamentals', 'Programming Fundamentals', 'C++',
   'Start programming with C++: problem solving, algorithms, flowcharts and pseudocode, then variables, conditions, loops, arrays and functions, with tracing and debugging practice throughout.',
   'cpp', '["C++","Foundations"]', 'published', 1, unixepoch() * 1000),
  ('course_programming_applications', 'programming-applications', 'Programming Applications', 'Python',
   'Practical Python: strings, lists, tuples, dictionaries, functions, objects and basic object-oriented programming, plus simple graphics and hands-on programming exercises.',
   'python', '["Python","Applications"]', 'published', 2, unixepoch() * 1000),
  ('course_computer_vision', 'computer-vision', 'Computer Vision', 'Computer Vision',
   'Computer vision with Python and OpenCV: digital images and pixels, resizing and enhancement, filtering, edge and feature detection, transformations and the basics of object recognition.',
   'python', '["Python","OpenCV"]', 'published', 3, unixepoch() * 1000)
ON CONFLICT (id) DO UPDATE SET
  slug = excluded.slug,
  title = excluded.title,
  short_title = excluded.short_title,
  description = excluded.description,
  primary_language = excluded.primary_language,
  tags = excluded.tags,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = unixepoch() * 1000;
