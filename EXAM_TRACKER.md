# Revision OS — Exam Calendar & Performance Tracker

## Purpose

Maintain one editable source of truth for the semester's assessments: Quiz 1, Midsem, Quiz 2, Endsem, labs/practicals, assignments, and any additional assessment. The student must be able to add, edit, reschedule, or delete an upcoming exam for any course without changing application code.

> **Data rule:** exam dates, marks, maximum marks, and weightages are unknown until entered by the student. Never invent dates or grades. A blank field means “not entered,” not zero.

## Courses to seed

Use the course catalogue as the initial course list. Keep every course editable and allow adding/removing courses.

| Course code | Course name | Initial priority |
|---|---|---|
| EE 380 | Electrical Machines | Needs assessment |
| HS 1xx | HSS Elective - II | Needs assessment |
| HSS-GT | HSS Game Theory | Needs assessment |
| ME 311 | Heat Transfer | Needs assessment |
| ME 312 | Manufacturing Technology - II | Needs assessment |
| ME 313 | Dynamics of Machinery | Needs assessment |
| ME 314 | Design of Machine Elements | Needs assessment |
| ME 315 | Mechanical Engineering Lab - III | Needs assessment |

`MINOR` and any timetable code that has not been mapped to a course should remain an editable, unconfirmed entry rather than being silently assigned.

## Assessment types

Seed these assessment types for each course, but do not create fictional dates or marks:

1. Quiz 1
2. Midsem
3. Quiz 2
4. Endsem
5. Assignment (allow multiple)
6. Lab / practical / viva (allow multiple)
7. Other (custom label)

A student can add multiple assessments of the same type when a course has more than one quiz or assignment.

## Exam record fields

Each assessment record should support:

- `id` — stable unique identifier
- `courseId` — linked course
- `title` — e.g. “Quiz 1”, “Midsem”, “Assignment 2”
- `type` — Quiz 1, Midsem, Quiz 2, Endsem, Assignment, Lab/Practical, Other
- `scheduledAt` — date and optional time; nullable until announced
- `status` — tentative, confirmed, completed, postponed, cancelled
- `marksObtained` — nullable numeric value
- `maxMarks` — nullable numeric value
- `weightagePercent` — optional numeric value
- `syllabus` — topics/chapters included
- `notes` — preparation notes, room, instructor updates, etc.
- `createdAt`, `updatedAt`

Validation: marks must be non-negative; when both marks fields are present, marks obtained cannot exceed maximum marks unless the student explicitly enables extra-credit scoring. Weightage must be between 0 and 100. Date edits should immediately update countdowns and preparation priorities.

## Required screens and behavior

### 1. Semester exam calendar

- Show upcoming assessments in chronological order and a month/calendar view.
- Provide filters for course, assessment type, and status.
- Highlight assessments that are overdue, within 7 days, and within 14 days.
- Include a clear **Add assessment** action.
- Each assessment must have **Edit**, **Mark completed**, and **Delete** actions. Confirm before deletion and preserve the record in history only if the user chooses archive instead of delete.
- Permit dates to be changed when an exam is postponed. Update the countdown and priority immediately.
- An unannounced assessment can exist without a date and should appear under “Date not announced.”

### 2. Marks and past-exam history

- Record marks obtained, maximum marks, and optional weightage after an assessment.
- Calculate percentage only when marks obtained and maximum marks are known and maximum marks is greater than zero.
- Display course-wise assessment history and trends; never treat missing marks as zero.
- Allow correcting a mark later.
- If the instructor changes the maximum marks or weightage, update derived summaries without deleting the original assessment record.

### 3. Subject priority — “which subjects are most messed up?”

Do not claim to know which subjects are difficult based on the course name or web search. Determine priority from the student's own performance and current preparation state. For each course, allow the student to set:

- Confidence: 1 (very weak) to 5 (very strong)
- Syllabus completion: 0–100%
- Recent quiz/exam percentage, when available
- Number of overdue revision topics
- Number of unlogged class days
- Optional self-rated difficulty: low / medium / high

Use an explainable priority score from 0–100, with configurable weights. Recommended initial formula:

`priority = 35% weakness + 25% exam urgency + 20% backlog + 10% syllabus incomplete + 10% stale class log`

Where:
- **Weakness** is higher when confidence and recent marks are low.
- **Exam urgency** rises as the next confirmed assessment approaches.
- **Backlog** rises with overdue topic reviews and overdue assignments.
- **Syllabus incomplete** is based on the student's entered completion percentage.
- **Stale class log** rises when a scheduled class has not been logged for more than two non-holiday days.

Normalize each component to 0–100. If a data source is missing, redistribute its weight proportionally among available components and label the score “provisional.” Do not use invented marks or dates.

Priority labels:
- **Must do**: score 70–100 or overdue/high-risk assessment
- **High**: score 50–69
- **Normal**: score 25–49
- **Maintain**: score 0–24

Let the student override priority manually, with the automatic score still visible for comparison.

### 4. Main-screen alerts

Show a concise prioritized list:

- Assessment overdue or happening today
- Confirmed exam in the next 7 days
- Assignment due within 48 hours
- Assignment due within 7 days
- Course not logged for more than two non-holiday days
- Weak course with a low recent mark or confidence rating

Each alert should explain why it appears and link to the relevant course or assessment. Avoid duplicate alerts for the same underlying issue.

## Suggested data model

For a normalized Supabase implementation:

- `courses`: `id`, `user_id`, `code`, `name`, `confidence`, `syllabus_completion`, `self_rated_difficulty`, `manual_priority_override`, timestamps
- `assessments`: `id`, `user_id`, `course_id`, `title`, `type`, `scheduled_at`, `status`, `marks_obtained`, `max_marks`, `weightage_percent`, `syllabus`, `notes`, timestamps
- `course_performance`: optional derived view or records for snapshots and trends

Use UUIDs, foreign keys, indexes on `(user_id, scheduled_at)` and `(user_id, course_id)`, and row-level security. Users must only read or modify their own rows. Never ship a Supabase service-role key to the browser.

## Acceptance checklist

- [ ] Every course can have Quiz 1, Midsem, Quiz 2 and Endsem records.
- [ ] Student can add, edit, reschedule, complete, cancel, archive or delete an assessment.
- [ ] Dates and countdowns update after edits.
- [ ] Past marks and maximum marks are editable and percentages are calculated safely.
- [ ] Unknown dates and marks remain blank rather than fabricated.
- [ ] Main screen surfaces imminent assessments and due assignments.
- [ ] Priority is explainable, based on student-entered evidence, and can be manually overridden.
- [ ] Exam and marks data persists across devices through the authenticated database.
- [ ] Data export/backup includes assessments and marks.
