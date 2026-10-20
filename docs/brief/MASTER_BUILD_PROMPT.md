# MASTER BUILD PROMPT — CODELAB EDUCATIONAL PLATFORM

## ROLE AND MISSION

Act as a senior software architect, full-stack engineer, UI/UX designer, database engineer, security specialist, technical SEO expert, DevOps engineer, educational technology specialist, and Google AdSense monetization consultant.

Build a professional, production-ready, scalable educational website called **CodeLab** (working name, configurable).

This must be a fully functional application, not a static mockup, landing-page-only demo, or collection of disconnected components.

The platform will provide free educational programming content and interactive exercises for university students, particularly in Egypt, while also targeting a wider international English-speaking audience.

**The highest business priority is legitimate long-term advertising revenue through Google AdSense.**

However, never sacrifice content quality, student trust, website usability, accessibility, or compliance merely to increase ad impressions.

Design the platform for:

- Organic search traffic
- Excellent educational content
- High-quality user engagement
- Repeat visitors
- Mobile-first usability
- Sustainable advertising monetization
- Low initial infrastructure costs
- Excellent performance
- Long-term growth
- Easy administration
- Secure, scalable operations

The finished product should feel like a premium commercial educational platform, not a student assignment.

---

# 1. NON-NEGOTIABLE REQUIREMENTS

1. NO VIDEO FUNCTIONALITY.
   - Do not build a video library.
   - Do not embed YouTube videos.
   - Do not add video players.
   - The platform is based on written content, presentations, programming practice, and assessments.

2. Educational content must be publicly accessible without requiring registration.

3. Student accounts are optional and are used for saving progress, bookmarks, achievements, and assessment history.

4. All core learning content must be crawlable by search engines.

5. Implement real persistent database functionality, not mock data disguised as production data.

6. Build a fully operational admin dashboard.

7. Design an AdSense integration architecture from the beginning.

8. Never display actual Google ads before the account and website have received the necessary approval.

9. Never fabricate AdSense publisher IDs, ad unit IDs, or verification status.

10. No forced advertising interactions, artificial impressions, invalid traffic, or deceptive ad placements.

11. Design desktop, tablet, and mobile layouts to a very high professional standard.

12. Use clean, modular, maintainable, well-tested code.

13. The application must be deployable to Cloudflare.

14. Never expose database credentials, secrets, or administrative privileges to the browser.

15. Do not describe a feature as complete unless it has been implemented and tested.

---

# 2. TECHNOLOGY AND ARCHITECTURE

Preferred stack:

Frontend:
- Next.js
- React
- TypeScript with strict mode
- Tailwind CSS
- Accessible component library such as shadcn/ui
- Lucide icons
- Code highlighting and responsive typography

Infrastructure:
- Cloudflare Workers
- Cloudflare DNS
- Cloudflare CDN
- Cloudflare SSL/TLS
- Cloudflare WAF and rate limiting where available
- Cloudflare Turnstile for abuse-sensitive forms

Database:
- Cloudflare D1
- Drizzle ORM
- Version-controlled SQL migrations
- Indexed relational tables
- Database integrity constraints

Object storage:
- Cloudflare R2
- PowerPoint presentations
- PDF lecture material
- Course images
- Educational resources
- Downloadable assignments

Monitoring:
- Cloudflare Web Analytics
- Google Analytics 4, configured according to applicable consent requirements
- Google Search Console
- Server-side error monitoring

Code editing:
- Monaco Editor for suitable programming tasks
- Syntax highlighting
- Line numbers
- Appropriate language support

Authentication:
- Secure, maintained authentication solution compatible with Cloudflare Workers
- Server-side sessions
- HTTP-only cookies
- Secure password hashing
- Session rotation and expiration
- Optional email verification and password reset
- RBAC authorization

Cloudflare compatibility is mandatory.

Before writing application code, verify the currently recommended Cloudflare deployment approach for the chosen framework.

Evaluate Cloudflare's current Next.js/vinext compatibility and use the officially recommended supported deployment pathway.

If a dependency is incompatible with Cloudflare Workers, replace it with a suitable alternative rather than introducing an undocumented deployment workaround.

Use environment bindings and secrets correctly.

---

# 3. PROFESSIONAL UI/UX DESIGN SYSTEM

Create a visually impressive, polished educational SaaS-style website.

Visual inspiration:
- Modern developer platforms
- High-quality educational interfaces
- Premium technical documentation websites
- Professional coding challenge platforms

Do not copy another platform's proprietary design.

Visual identity:
- Deep navy and sophisticated neutral colors
- Electric blue as the primary accent
- Subtle purple secondary accents
- Clean white surfaces in light mode
- Excellent typography
- Beautiful code blocks
- Rounded cards
- Subtle shadows and borders
- Consistent spacing
- Restrained, purposeful animations
- Distinct visual hierarchy

Create both light and dark themes.

User interface must include:

- Professional responsive navigation
- Logo and brand identity
- High-quality homepage hero section
- Course cards
- Category filtering
- Global search
- Breadcrumb navigation
- Sticky documentation-style table of contents where appropriate
- Progress indicators
- Difficulty badges
- Elegant assessment components
- Accessible forms
- Loading skeletons
- Empty states
- Error states
- Custom 404 page
- Helpful search-empty pages
- Responsive footer
- Keyboard navigation
- High contrast and visible focus states

Responsive design:
- 320px mobile layouts
- Common mobile widths
- Tablet layouts
- Laptop layouts
- Large desktop screens

Maintain accessibility aligned with WCAG 2.2 AA where practical.

Avoid:
- Excessive visual effects
- Unnecessary animation
- Layout shifts
- Oversized hero sections that hide content
- Generic AI-generated-looking page designs
- Cluttered dashboards
- Misleading interactions
- Decorative elements that reduce legibility

The website should be elegant enough to launch as a real commercial brand.

---

# 4. PUBLIC WEBSITE STRUCTURE

Implement the following routes:

/
- Homepage

/courses
- All courses

/courses/[courseSlug]
- Individual course overview

/courses/[courseSlug]/[topicSlug]
- Topic overview

/lessons/[lessonSlug]
- Individual written lesson

/exercises
- Exercise library

/exercises/[exerciseSlug]
- Individual exercise page

/quizzes
- Quiz directory

/quizzes/[quizSlug]
- Individual quiz

/practice
- Interactive practice hub

/challenges
- Programming challenge directory

/challenges/[challengeSlug]
- Individual challenge

/resources
- Educational resources

/resources/[resourceSlug]
- Resource details

/exams
- Practice exams

/search
- Search page

/about
- About the platform

/contact
- Contact page

/privacy-policy
- Privacy Policy

/terms
- Terms and Conditions

/cookie-policy
- Cookie Policy

/disclaimer
- Educational Disclaimer

/accessibility
- Accessibility information

/dashboard
- Student dashboard

/dashboard/progress
- Student progress

/dashboard/bookmarks
- Saved content

/dashboard/history
- Assessment history

/settings
- Account settings

/admin
- Administrator dashboard

Admin subroutes must be protected by server-side authorization.

Implement clean, readable, SEO-friendly slugs.

---

# 5. INITIAL EDUCATIONAL COURSES

The platform launches with three primary courses.

## Course A: Programming Fundamentals

Languages:
- C++
- Foundational programming concepts

Topics:
- Introduction to programming
- Problem-solving methodology
- Algorithms
- Flowcharts
- Pseudocode
- Variables
- Data types
- Input and output
- Operators
- Conditional statements
- Nested conditions
- For loops
- While loops
- Do-while loops
- Nested loops
- Arrays
- Functions
- Debugging
- Tracing programs

## Course B: Programming Applications

Primary language:
- Python

Topics:
- Python introduction
- Variables and data types
- Input and output
- Operators
- Strings
- Lists
- Tuples
- Dictionaries
- Functions
- Objects
- Basic object-oriented programming
- Python graphics
- Practical programming exercises

## Course C: Computer Vision

Primary language:
- Python with OpenCV

Topics:
- Introduction to computer vision
- Digital images
- Pixels and color channels
- Image reading and display
- Image resizing
- Image enhancement
- Brightness and contrast
- Noise reduction
- Filtering
- Edge detection
- Feature detection
- Feature matching
- Image transformations
- Object recognition basics
- Introductory Jetson-based project concepts

Course content must remain independently editable.

Do not generate hundreds of repetitive or low-quality pages just to increase the website's size.

Create a smaller set of genuinely useful sample lessons, then build a content management workflow for expansion.

---

# 6. LESSON CONTENT SYSTEM

Each lesson should support:

- Title
- Slug
- Course
- Topic
- Difficulty
- Description
- Learning objectives
- Prerequisites
- Estimated reading time
- Written explanation
- Step-by-step examples
- Syntax-highlighted code blocks
- Diagrams or instructional illustrations
- Common mistakes
- Key takeaways
- Associated exercises
- Associated quizzes
- PowerPoint attachment
- PDF attachment
- Related lessons
- Publication status
- Last updated date
- SEO fields

Students should be able to:

- Read the lesson without logging in
- View public presentations
- Download permitted files
- Copy code snippets
- Navigate between lessons
- Bookmark lessons when signed in
- Mark lessons as completed when signed in
- Access related practice exercises

Use semantic HTML and server-rendered educational content.

Do not publish nearly empty lesson pages.

---

# 7. POWERPOINT AND DOCUMENT MANAGEMENT

The owner must be able to upload:

- PPTX
- PDF
- Supporting images
- Educational handouts
- Sample code files

Store uploaded assets securely in Cloudflare R2.

Do not store large presentation binaries inside the SQL database.

Implement:

- File-type validation
- Maximum upload size controls
- Filename sanitization
- File metadata
- Access permissions
- File preview
- Download functionality
- Upload progress
- File replacement
- File deletion
- Appropriate cache headers

For PowerPoints:
- Provide direct PPTX downloads.
- Provide an in-browser preview based on a separately generated PDF or slide images.
- Do not assume browsers can natively render PPTX accurately.
- Use a secure, compatible conversion workflow outside Cloudflare Workers when server-side document conversion is necessary.
- Never execute arbitrary uploaded documents.
- For the first version, support uploading both PPTX and a preview PDF.

Ensure the presentation page contains original explanatory context, not just an isolated download link.

---

# 8. COMPLETE INTERACTIVE EXERCISE ENGINE

This is one of the most important features.

Build a reusable question engine with at least four core question types.

## TYPE 1 — MULTIPLE CHOICE QUESTIONS

Features:
- Single-answer MCQ
- Optional multiple-answer MCQ
- Four or more configurable answer choices
- Support code snippets in questions
- Immediate feedback in practice mode
- Explanation of the correct answer
- Optional hints
- Question randomization
- Option randomization
- Difficulty levels
- Attempt tracking
- Time tracking

## TYPE 2 — WRITE THE CODE

Example:

Instruction:
Write a C++ program that prints numbers from 1 to 10.

Student experience:
- View problem description
- Read expected behavior
- Write code in an editor
- Save work
- Submit solution
- Review feedback

Support:
- C++
- Python

Two grading modes:

A. Manual/reference-based review when safe execution is unavailable.

B. Automated test-case grading only when connected to an isolated and secure code-execution service.

Never execute untrusted C++ or Python code directly inside Cloudflare Workers or the main application process.

Provide a clear execution-service integration interface.

The code-execution backend must:
- Use isolated, disposable environments
- Prevent unnecessary network access
- Enforce CPU, memory, execution-time, and output limits
- Prevent access to host files or secrets
- Restrict filesystem activity
- Limit concurrent submissions
- Handle compilation errors
- Capture runtime errors
- Compare actual output against expected output
- Support multiple test cases
- Avoid infinite loops
- Securely clean up environments
- Protect against abuse

Do not pretend to have implemented secure remote code execution if no runner is actually configured.

## TYPE 3 — TRACE THE CODE

Example:

int x = 2;
x = x + 3;
x = x * 2;
cout << x;

Question:
What is the final output?

Features:
- Student enters output
- Automatic comparison with the answer key
- Configurable whitespace normalization
- Case-sensitive evaluation when appropriate
- Explanation of each execution step
- Optional variable tracing table
- Hints
- Retry functionality

For output containing meaningful whitespace, preserve exact-output grading semantics.

## TYPE 4 — CORRECT THE CODE

Show students broken code.

Example:

int main() {
    int x = 10
    if (x > 5) {
        cout << "Greater"
    }
    return 0;
}

The student must identify and correct errors.

Features:
- Editable code interface
- Hints
- Expected behavior
- Explanation
- Multiple valid corrected solutions
- Compilation checks where available
- Functional test cases
- Feedback on errors
- Retry attempts
- Difficulty levels

Grading must not rely exclusively on an exact string comparison against one reference solution.

---

# 9. ADVANCED EXERCISE FEATURES

Support:

- Easy, medium, and hard filters
- Topic filters
- Programming language filters
- Questions by course
- Random practice sets
- Practice modes
- Timed quizzes
- Untimed quizzes
- Retry incorrect questions
- Explanation after submission
- Bookmarks
- Practice history
- Optional streak tracking
- Completed-question indicators
- Recommended next exercises
- Adaptive practice recommendations based on previous mistakes

Quiz behavior:
- Save answers
- Calculate scores
- Show correct and incorrect questions
- Support configurable pass thresholds
- Separate practice mode from exam mode
- Prevent answer keys from being exposed through public quiz APIs before submission when the quiz requires delayed feedback

Keep practice interactions fast.

Never require unnecessary page refreshes between questions.

---

# 10. EXAM SYSTEM

Build an exam practice section with:

- Exams by course
- Exams by topic
- Mixed-topic tests
- Timers
- Question navigation
- Autosave
- Configurable question order
- Clear submit confirmation
- Results summary
- Explanation review
- Retake functionality
- Historical scores
- Difficulty distribution
- Performance by topic

Scoring must happen through trusted server-side logic for scored assessments.

---

# 11. STUDENT ACCOUNTS

Allow public learning without accounts.

Accounts unlock:
- Saved progress
- Bookmarks
- Assessment history
- Personalized dashboard
- Saved code drafts
- Recommended practice
- Achievements

Account functionality:
- Registration
- Login
- Logout
- Password reset
- Email verification if enabled
- Account deletion
- Data export
- Session management

Roles:
- Guest
- Student
- Editor
- Administrator

Enforce permissions on the server, not merely through hidden buttons.

Avoid collecting unnecessary personal information.

Do not require university IDs or phone numbers.

---

# 12. ADMIN DASHBOARD

Create a complete admin control center.

Modules:

### Content management
- Create courses
- Edit courses
- Delete or archive courses
- Add topics
- Organize lessons
- Publish and unpublish content
- Schedule publication
- Edit SEO metadata

### Resource management
- Upload PPTX files
- Upload preview PDFs
- Replace files
- Manage downloads
- Delete obsolete resources

### Question bank
- Create MCQs
- Create tracing questions
- Create debugging questions
- Create writing-code questions
- Set difficulty
- Assign course and topic
- Create answer explanations
- Add hints
- Add test cases
- Import questions from validated CSV/JSON
- Export question collections
- Preview questions
- Duplicate questions

### Quiz management
- Create quizzes
- Choose questions
- Set time limits
- Set pass thresholds
- Publish quizzes
- Review results

### Student analytics
- Registered students
- Completed exercises
- Topic performance
- Most difficult questions
- Course completion trends
- Repeat usage statistics

### Content analytics
- Popular lessons
- Popular exercises
- Search terms
- Pages with poor engagement
- Broken internal links
- Content requiring updates

### Advertising management
- Manage configured ad locations
- Enable/disable approved units
- Exclude sensitive or unsuitable pages
- Configure allowed ad formats
- Maintain publisher configuration
- Review policy-readiness checks

### Administration
- Manage roles
- Audit administrative actions
- Manage settings
- Review error logs

Use server-side validation, audit logging, and least-privilege access.

---

# 13. GOOGLE ADSENSE — HIGHEST BUSINESS PRIORITY

Design the entire website for legitimate, sustainable Google AdSense monetization.

The objective is to maximize long-term advertising opportunities through useful original content, discoverability, engagement, and repeat visits.

Do not optimize for artificial ad clicks.

Treat the most current official Google Publisher Policies, AdSense Program Policies, ad placement policies, and consent requirements as authoritative.

## 13.1 AdSense readiness

Before enabling ads:

- Verify domain ownership.
- Use a production custom domain.
- Ensure the website is accessible.
- Verify HTTPS.
- Publish useful original content.
- Remove demo and placeholder pages.
- Ensure proper navigation.
- Publish truthful legal and informational pages.
- Ensure no broken important routes.
- Ensure content is accessible to Google's review systems.
- Validate policy compliance.
- Submit the website for AdSense review.

Approval is not guaranteed.

Google can reject a website even if technical integration is correct.

## 13.2 Centralized advertising system

Create a reusable AdSlot component.

Features:
- Named placement IDs
- Responsive sizing
- Optional manual units
- Configurable exclusions
- Production-only behavior
- Ad loading controls
- Layout stability
- Error handling
- AdSense script loaded only when appropriate
- Consent-aware behavior
- No duplicate script injection

Configuration must include:
- ADS_ENABLED
- ADSENSE_CLIENT_ID
- Ad unit identifiers
- Allowed placements
- Excluded paths
- Consent state
- Environment setting

Real ads must not load until the site is approved and the administrator explicitly enables the integration.

Never create fake ad traffic.

## 13.3 Advertising placement strategy

Plan potential advertising placements on the following content-rich pages.

Homepage:
- A responsive ad below substantial introductory content
- Additional ads only where suitable based on page length and layout

Course directory:
- Ads between natural groups of course listings when appropriate

Course pages:
- One potential placement after the course introduction
- Additional placements between meaningful educational sections

Written lessons:
- A potential placement after the first substantial explanation section
- Ads between sufficiently separated long-form content sections
- Desktop sidebar advertising where sufficient room exists

Exercises:
- A placement in the surrounding content area, sufficiently separated from answer controls
- No ad inside the answer interface

Quizzes:
- Prefer an ad-free focused assessment experience
- Consider ads on content-rich preparation or review pages when permitted

Results pages:
- Do not rely on thin score-only pages as advertising inventory
- Place ads only on qualifying pages containing meaningful original review content

Resources:
- Advertising may appear in original educational resource description pages
- Avoid ad-only download gateways

Do not implement universal ad placement counts or fixed spacing as though they are official Google compliance thresholds.

Review placement density and suitability case by case.

## 13.4 Strict advertising restrictions

Never:
- Ask users to click ads
- Reward ad clicks
- Incentivize ad views
- Display misleading ad labels
- Make ads look like exercise answers
- Insert ads inside code editors
- Place ads over buttons
- Place ads close enough to create accidental clicks
- Force ad interaction before revealing solutions
- Require users to watch ads to unlock exercises
- Use pop-unders
- Automatically refresh ads contrary to policy
- Generate fake impressions
- Purchase invalid traffic
- Use click-exchange networks
- Automatically click ads in testing
- Load ads on pages prohibited by publisher policies
- Display ads on account/login/admin screens without a valid policy basis

Ads must be clearly distinguishable from educational content.

Use labels such as "Advertisement" or "Sponsored Links" where appropriate.

Never use labels that imply an ad is a recommended lesson or an official learning resource.

## 13.5 Prevent accidental clicks

Pay special attention to mobile interfaces.

Ads must not interfere with:
- MCQ options
- Submit buttons
- Next question buttons
- Code editors
- Copy-code buttons
- Download buttons
- Navigation menus
- Answer explanations

Reserve suitable ad container space when feasible to reduce layout shifts.

Avoid ad-driven interface movement.

## 13.6 Consent and privacy

Implement compliant privacy and cookie consent behavior.

For users in the EEA, UK, and Switzerland, evaluate Google's requirements for a Google-certified CMP integrated with the IAB Transparency and Consent Framework.

Use an appropriate certified solution where required.

Support:
- Consent choice
- Rejection where applicable
- Preference management
- Cookie policy information
- Consent-state handling
- Appropriate ad loading based on consent and regional requirements

Do not claim a generic home-built cookie banner automatically satisfies legal requirements.

Do not load advertising or analytics technologies in ways that violate applicable consent requirements.

Include an easily accessible privacy choices link where required.

## 13.7 ads.txt

Support:

https://yourdomain.com/ads.txt

Serve it as plain text with a valid response and correct content type.

Only add authorized publisher records supplied by the actual advertising account or partner.

Do not invent publisher IDs.

Validate file accessibility in production.

## 13.8 Advertising dashboards

Build an internal advertising readiness and operations dashboard containing:

- AdSense setup checklist
- Domain status checklist
- ads.txt configuration status
- Approved unit configuration
- Consent configuration status
- Enabled placements
- Excluded pages
- Ad layout QA checklist
- Policy-risk notes

If real revenue analytics are available through authorized Google integrations, display them.

Otherwise, provide configuration and approved manual reporting imports.

Do not fabricate revenue, RPM, CPC, CTR, fill rate, or impression numbers.

## 13.9 Revenue planning

Include an internal revenue scenario calculator.

Inputs:
- Monthly pageviews
- Assumed page RPM
- Optional scenario assumptions

Formula:

Estimated Revenue = Pageviews / 1000 × Page RPM

Clearly label calculated output as an estimate, not guaranteed income.

Do not hardcode supposed Egyptian AdSense payout rates.

Actual earnings depend on traffic geography, niche, advertiser demand, ad eligibility, seasonality, and other factors.

---

# 14. CONTENT STRATEGY FOR ORGANIC SEARCH

The website must attract students searching for programming problems and explanations.

Content categories:

- C++ programming exercises
- Python programming exercises
- C++ tracing questions
- Debugging exercises
- Flowchart examples
- Pseudocode examples
- Python list exercises
- Loop exercises
- Beginner programming quizzes
- OpenCV tutorials
- Computer vision lab exercises

Each valuable public content page should contain:

- Specific descriptive title
- Clear educational objective
- Original explanation
- Relevant code examples
- Problem statement
- Appropriate difficulty
- Learning context
- Helpful links to related content

Do not create low-value doorway pages for every keyword variation.

Do not produce duplicate pages solely to obtain additional ad placements.

Do not invent fake student reviews or statistics.

Do not index thin empty question pages.

---

# 15. TECHNICAL SEO

Implement:

- Server-rendered or prerendered content where appropriate
- Unique title tags
- Unique meta descriptions
- Canonical URLs
- Open Graph tags
- Twitter/X card metadata
- XML sitemap
- robots.txt
- Search-engine-friendly internal linking
- Breadcrumbs
- Descriptive URLs
- Structured data where genuinely applicable
- Educational content metadata
- Correct heading hierarchy
- Image alt text
- Descriptive navigation labels
- Proper redirects
- 404 handling
- Pagination where appropriate
- Noindex for private dashboards
- Noindex for login and administrative pages
- Proper indexing decisions for user-specific and low-value pages

Use schema.org structured data accurately.

Do not add structured data that misrepresents the actual content.

Integrate Google Search Console verification through configurable environment or metadata settings.

Provide a content indexing checklist.

---

# 16. PERFORMANCE ENGINEERING

Target excellent Core Web Vitals.

Performance goals:
- LCP at or below 2.5 seconds
- INP at or below 200 milliseconds
- CLS at or below 0.1

Treat these as performance targets, not guaranteed results.

Use:
- Edge caching
- Static rendering where possible
- Optimized fonts
- Modern image formats
- Lazy loading
- Code splitting
- Minimal JavaScript
- Efficient database queries
- Proper database indexes
- Streaming only where beneficial
- Stable layout dimensions
- Accessible loading states
- Efficient search
- CDN asset caching

Do not cache authenticated user data in publicly shared caches.

Do not use excessive tracking scripts.

Ad loading must not dominate page performance.

---

# 17. DATABASE DESIGN

Use Cloudflare D1 with Drizzle ORM.

Create well-structured relational tables including:

users
sessions
roles
user_roles
courses
topics
lessons
lesson_sections
lesson_resources
resources
exercises
exercise_options
exercise_answers
exercise_test_cases
exercise_hints
quizzes
quiz_questions
quiz_attempts
quiz_responses
exercise_attempts
code_submissions
student_progress
bookmarks
achievements
student_achievements
exam_templates
exam_attempts
content_revisions
seo_metadata
site_settings
ad_placements
consent_configuration
admin_audit_logs

You may normalize or consolidate entities where architecturally justified.

Requirements:
- Primary keys
- Foreign keys
- Relevant unique constraints
- Indexes
- Referential integrity
- Created/updated timestamps
- Publication status
- Ownership metadata
- Audit trails
- Safe migration files
- Data validation
- Backup and restore planning

Protect unreleased answer keys and hidden test cases.

Do not expose hidden solutions through public APIs.

---

# 18. SECURITY AND ABUSE PROTECTION

Implement:

- Server-side authorization
- Secure session handling
- CSRF protection where applicable
- XSS prevention
- SQL injection prevention through safe query handling
- Content validation
- Upload restrictions
- Rate limiting
- Bot protection
- Secure HTTP headers
- Content Security Policy
- Least-privilege access
- Secure environment variables
- Secret rotation procedures
- Administrative audit logging
- Safe error messages
- Dependency monitoring
- Secure file access
- Account recovery protections
- Authentication abuse prevention

Cloudflare Turnstile validation must be performed server-side.

Protect endpoints for:
- Login attempts
- Registration
- Contact forms
- Quiz submissions
- Code submissions
- File uploads
- Administrative mutations

Document security boundaries clearly.

---

# 19. ANALYTICS

Implement privacy-conscious analytics.

Use:
- Cloudflare Web Analytics
- Google Analytics 4 when appropriately configured
- Google Search Console

Track useful platform events such as:
- Course viewed
- Lesson opened
- Exercise started
- Exercise completed
- Quiz started
- Quiz submitted
- Resource downloaded
- Search performed

Avoid sending:
- Passwords
- Personal identifying information unnecessarily
- Student code containing sensitive data
- Private account information

Build reports showing:
- Popular courses
- Popular topics
- Organic landing pages
- Returning visitor trends
- Completed exercises
- Search engagement
- Broken pages
- Important conversion events

Respect analytics consent requirements.

Keep first-party educational analytics distinct from advertising analytics.

---

# 20. CLOUDFLARE DEPLOYMENT

The platform must be deployable to Cloudflare production infrastructure.

Use:
- Cloudflare Workers for the application
- Cloudflare D1 for relational data
- Cloudflare R2 for educational files
- Cloudflare DNS for the domain
- HTTPS with correctly configured TLS
- Cloudflare caching where appropriate
- Cloudflare Turnstile for abuse protection

Provide a complete deployment guide.

Include:

1. Local development setup
2. Cloudflare account preparation
3. Project creation
4. Dependency installation
5. Environment variable setup
6. D1 database provisioning
7. D1 migration deployment
8. R2 bucket provisioning
9. R2 bindings
10. Secure secret configuration
11. Cloudflare framework adapter setup
12. Production build
13. Local preview/testing
14. Production deployment
15. Custom domain connection
16. HTTPS verification
17. DNS setup
18. File upload verification
19. Database connectivity verification
20. Authentication tests
21. SEO endpoint verification
22. robots.txt and sitemap verification
23. ads.txt verification
24. Monitoring and logging setup
25. Backup and recovery procedures
26. Rollback procedures

Use current official Cloudflare documentation.

Do not assume Vercel deployment instructions work on Cloudflare.

Include accurate package scripts and commands matching the selected implementation.

Explain any paid infrastructure requirements before introducing them.

---

# 21. AUTOMATED DEPLOYMENT PIPELINE

Create a maintainable deployment workflow.

Support:
- Git repository
- Separate development and production configuration
- Environment-specific secrets
- Type checking
- Linting
- Unit tests
- Build verification
- Migration verification
- Preview deployments where practical
- Protected production deployments
- Deployment logs
- Rollback documentation

Do not commit environment secrets.

Do not expose production database credentials.

---

# 22. TESTING AND QUALITY ASSURANCE

Implement meaningful tests.

Unit tests:
- MCQ grading
- Tracing-answer normalization
- Quiz scoring
- Permissions
- Input validation

Integration tests:
- Course retrieval
- Exercise submission
- Student progress persistence
- Resource loading
- Admin CRUD operations
- Authentication flow

End-to-end tests:
- Guest browses courses
- Guest opens lesson
- Guest solves MCQ
- Guest submits trace answer
- User registers
- User logs in
- User saves progress
- Admin creates a course
- Admin creates an exercise
- Admin uploads a PDF
- Admin publishes content

Advertising validation:
- Ads disabled in development
- Ads disabled before approval
- No fake ad requests
- Approved configuration loads only under suitable conditions
- No deceptive ad placements
- No accidental-click-inducing controls
- Privacy consent respected
- No actual ad-click automation

Mobile testing:
- iOS Safari
- Android Chrome
- Responsive breakpoints
- Keyboard usability
- Slow network scenarios

Performance testing:
- Lighthouse
- Core Web Vitals
- Bundle size
- Layout shifts
- Database query efficiency

Do not make unsupported claims that tests have passed.

---

# 23. REQUIRED INITIAL CONTENT

Create a realistic educational content starter set.

Minimum functional examples:
- 3 course overview pages
- 3 complete original written lessons
- 12 MCQ questions
- 8 trace-the-code questions
- 8 correct-the-code questions
- 8 write-the-code questions
- 2 mixed-topic quizzes

Use high-quality, technically accurate explanations.

All example code must be checked for correctness.

Any sample exercises intended only as demonstrations should be identified as demo content.

Do not bulk-generate hundreds of shallow pages.

Create a reusable content authoring system so the administrator can gradually build a genuine educational library.

---

# 24. DOCUMENTATION AND DELIVERABLES

Deliver:

- Complete source code
- Clean folder structure
- Database schema
- Database migrations
- Seed scripts
- Environment variable template
- Deployment configuration
- Working responsive UI
- Functional public website
- Functional admin dashboard
- Functional educational practice engine
- Authentication
- R2 resource integration
- SEO implementation
- AdSense integration scaffolding
- Privacy and cookie consent architecture
- Technical documentation
- Local installation guide
- Cloudflare deployment guide
- Security checklist
- Monetization readiness checklist
- Testing report

Include:

README.md
ARCHITECTURE.md
DATABASE.md
DEPLOYMENT.md
ADSENSE_CHECKLIST.md
SECURITY.md
CONTENT_GUIDELINES.md

Do not populate legal pages with invented business identity, contact information, or legal claims.

Use clearly marked fields requiring owner review before launch.

---

# 25. BUILD ORDER

Build the project in controlled phases.

PHASE 1 — Foundation
- Architecture
- Database design
- Design system
- Application scaffold
- Cloudflare configuration
- Initial deployment verification

PHASE 2 — Public educational platform
- Homepage
- Courses
- Topics
- Written lessons
- Resource pages
- Search
- Navigation

PHASE 3 — Exercise engine
- MCQs
- Trace questions
- Debugging questions
- Write-code interface
- Scoring
- Explanations
- Quizzes

PHASE 4 — Administration
- Secure authentication
- Admin dashboard
- Course management
- Lesson management
- Exercise management
- Resource uploads
- Publishing system

PHASE 5 — Student experience
- Student accounts
- Saved progress
- Bookmarks
- Practice history
- Personal dashboard

PHASE 6 — Monetization preparation
- Ad placement system
- Consent architecture
- Privacy configuration
- ads.txt support
- Legal page review
- Search Console
- Content quality audit
- AdSense readiness validation

PHASE 7 — Production
- Full testing
- Security review
- Performance audit
- Cloudflare production deployment
- Domain configuration
- Monitoring
- Documentation

PHASE 8 — Post-approval advertising
- Configure the actual AdSense publisher ID
- Configure approved ad units
- Enable advertising only after approval
- Monitor user experience and revenue using real data
- Improve monetization within Google policies

PHASE 9 — Future enhancement
- Secure code execution
- Advanced question banks
- Personalized learning
- Advanced analytics
- Further languages and courses

---

# 26. ACCEPTANCE CRITERIA

The project must not be described as production-ready until:

- The public website renders correctly.
- Database operations work.
- Courses can be created and viewed.
- Lessons can be created and published.
- Students can solve and submit exercises.
- Quiz grading works.
- Submitted progress persists where applicable.
- Resources can be uploaded and downloaded.
- Administrative authorization works.
- Mobile usability is tested.
- Critical security protections are implemented.
- SEO endpoints work.
- Cloudflare production build succeeds.
- Required deployment steps are documented.
- Advertising integration remains disabled before approval.
- No unapproved Google ads are served.
- No fake features are presented as functional.
- Important tests have been run and results recorded.

Document any incomplete or blocked requirements.

---

# 27. FINAL INSTRUCTIONS

Build a serious educational technology business, not merely an attractive frontend.

Prioritize:

1. Google AdSense policy readiness and long-term monetization
2. High-quality original educational content
3. Useful interactive practice
4. Excellent UX/UI
5. Search engine visibility
6. Security and reliability
7. Low infrastructure costs
8. Cloudflare compatibility
9. Scalability
10. Administrative simplicity

Never use deceptive ad monetization practices.

Never guarantee AdSense approval or earnings.

Do not use fake functionality or fake analytics.

Do not substitute a screenshot or static demo for a working application.

Start by providing:

A. A complete architecture overview

B. Database entity relationships

C. A production-oriented folder structure

D. Cloudflare deployment strategy

E. Detailed page and component inventory

F. Advertising policy-readiness architecture

G. Phased implementation checklist

Then implement the actual project, starting with Phase 1.

At the end of each phase:
- Show what was implemented
- Explain how to run it
- Run relevant tests
- Identify incomplete functionality
- Present the next implementation milestone

The final product should be professional, beautiful, educationally valuable, technically sound, and designed for sustainable advertising monetization without compromising compliance or trust.