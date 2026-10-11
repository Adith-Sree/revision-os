# Revision OS — Daily Prep, Lecture Log & Backlog Rules

## Goal

Turn the uploaded IIT Guwahati timetable into a dependable daily workflow. For every scheduled class, the student should be able to record what was actually taught, mark the class/topic as completed or ongoing, add assignments and deadlines, and review older topics. The home screen must surface overdue work and subjects that have gone unlogged for more than two days.

## Course catalogue

Start with these editable courses from the provided course list:

| Course code | Course name |
|---|---|
| EE 380 | Electrical Machines |
| HS 1xx | HSS Elective - II |
| HSS-GT | HSS Game Theory |
| ME 311 | Heat Transfer |
| ME 312 | Manufacturing Technology - II |
| ME 313 | Dynamics of Machinery |
| ME 314 | Design of Machine Elements |
| ME 315 | Mechanical Engineering Lab - III |

The course catalogue and timetable use different labels. Treat timetable-to-course links as **unconfirmed and editable** until the student confirms them. Do not assume that `HSS` necessarily means HSS Game Theory or that a code maps to a course just because it looks similar. Keep `MINOR` as an unmapped timetable item until its course is identified.

## Timetable transcribed from the uploaded image

Times are local campus time. Use a repeating Monday–Friday timetable, editable in the UI.

| Day | Time | Timetable label | Room shown |
|---|---|---|---|
| Monday | 09:00–12:00 | ME3101L (B) | — |
| Thursday | 09:00–12:00 | ME3101L (A) | — |
| Wednesday | 13:00–13:55 | HSS | — |
| Thursday | 13:00–13:55 | HSS | — |
| Friday | 13:00–13:55 | HSS | — |
| Monday | 14:00–14:55 | ME3103 (B) | 5103 |
| Tuesday | 14:00–14:55 | ME3312 | 5102 |
| Wednesday | 14:00–14:55 | EE3005 | 5G1 |
| Thursday | 14:00–14:55 | ME3103 | 5102 / 5103 |
| Friday | 14:00–14:55 | ME3104 | 5102 / 5103 |
| Monday | 15:00–15:55 | ME3312 | 5102 |
| Tuesday | 15:00–15:55 | EE3005 | 5G1 |
| Wednesday | 15:00–15:55 | ME3101 | 5102 |
| Thursday | 15:00–15:55 | MINOR | — |
| Friday | 15:00–15:55 | ME3103 (A) | 5102 |
| Monday | 16:00–16:55 | EE3005 | 5G1 |
| Tuesday | 16:00–16:55 | ME3101 | 5102 |
| Thursday | 16:00–16:55 | ME3104 | 5102 / 5103 |
| Friday | 16:00–16:55 | ME3312 | 5102 |
| Monday | 17:00–17:55 | ME3104 | 5102 / 5103 |
| Tuesday | 17:00–17:55 | MINOR | — |
| Wednesday | 17:00–17:55 | ME3103 | 5102 / 5103 |
| Thursday | 17:00–17:55 | ME3101 | 5102 |

There is no Friday 17:00 class in the image. The Monday and Tuesday 13:00 cells are shaded/blocked and are not classes in this transcription. The user must be able to edit any transcription errors in the app.

## Daily workflow

### Before or at the start of the day

1. Read the selected date and weekday.
2. If that date is marked as a holiday, do not count its timetable classes as missed and do not increase any “days since logged” counter because of that date.
3. Otherwise show the day's timetable classes, with course mapping status clearly visible.
4. Show pending reviews, overdue assignments, upcoming exams and must-do courses alongside today's classes.

### After each class

For every scheduled class, show a class log card with:

- Timetable label and time
- Mapped course name (or “Mapping needed”)
- Topic/chapter taught today (required to create a topic-based revision task; allow “Topic not known yet” as an explicit option)
- Lecture status toggle: **Not logged**, **Ongoing**, **Completed**, or **Class missed**
- Optional lecture notes, doubts, pages/slides and practice problems
- Assignment action: add title, description, due date, optional submission status and notes

The status must be a real persisted toggle/select control, not just a visual badge. A class marked completed means the class/topic log is complete; it does **not** mean the topic has been revised. Track lecture status and revision-task status separately.

When a topic is entered, create a same-day revision task. When a topic is marked ongoing, allow partial notes and keep the topic in the must-do queue until the student finishes logging it or explicitly defers it.

### End-of-day review

Show a checklist of every class scheduled that day. The student can confirm each class as completed, ongoing, missed or not logged. Provide a short summary of:

- Classes logged / scheduled
- Topics revised / due
- Tasks carried forward
- Assignments approaching deadlines
- Subjects that need attention

Never mark a task complete automatically just because the class log is complete.

## Holiday mode

Provide a prominent **Mark as holiday** toggle for any date, plus an optional holiday label/reason. The student can turn it off again.

Rules:

- Holiday dates do not count as missed classes.
- Holiday dates do not increase the stale-log counter.
- Do not auto-complete or delete existing revision tasks, assignments or exam preparation because of a holiday.
- Existing overdue work stays visible; the planner may offer a reschedule action.
- Support one-off holidays and an optional date range. Store each date explicitly or expand the range safely.

## Stale class log: more than two days

Track the last logged class date per course using scheduled teaching days, not simple elapsed calendar time.

- If a course had a scheduled class and the student has not logged it for **more than two non-holiday days**, mark the course **Stale log**.
- Do not count weekends or dates on which that course has no scheduled class as missed class logs.
- Do not count a date marked as a holiday.
- A scheduled class marked `Class missed` is still logged and must not be mistaken for unknown status. It may create a catch-up task if the student wants to cover the missed material.
- If a class is marked ongoing, keep it visible as unfinished; don't reset its priority merely because a partial log exists.

Courses with stale logs must appear on the main dashboard in **Must do today**, with a reason such as “No lecture log for 3 eligible teaching days.” Make the threshold configurable; default is more than two eligible teaching days.

## Daily planner and priority order

The main screen should combine class work and older topics without overwhelming the student. Recommended ordering:

1. Exam happening today or overdue assessment action
2. Assignment overdue or due within 48 hours
3. Course with a stale lecture log (>2 eligible teaching days)
4. Overdue revision task / difficult topic
5. Today's new lecture revision
6. Review due today under spaced repetition
7. Upcoming work and optional enrichment

Each task should explain why it is prioritized and include a one-click complete, start/ongoing, or reschedule action. Do not silently drop unfinished work. Keep estimated duration editable so the student can fit tasks into available study time.

## Spaced repetition

Suggested default intervals after a completed revision: 1, 3, 7 and 14 days. These are configurable starting defaults, not guarantees of retention.

- On successful active recall/practice, record the completion timestamp and schedule the next review.
- If the student marks “struggled,” schedule an earlier review (for example, the next day).
- If the student marks “easy,” allow the next interval to extend.
- A holiday does not erase or complete a review; the student may reschedule it.
- Avoid duplicate due tasks for the same topic and interval.

## Assignments and deadline alerts

Each course supports multiple assignments. Fields:

- Title (required)
- Course
- Description / deliverables
- Assigned date (optional)
- Due date and time (required when known; allow unknown)
- Status: not started, ongoing, submitted, completed
- Priority, estimated effort and notes

Dashboard alerts:

- Overdue: due date has passed and not submitted/completed
- Due within 48 hours
- Due within 7 days
- Date not set: show in assignment list, but don't invent a countdown

Alerts must be based on the user's local timezone and the saved due date. Completing/submitting an assignment removes its active deadline alert but preserves its history.

## Persistence and data integrity

All course, timetable, holiday, class-log, topic, revision-task, assignment and exam state must be saved to the authenticated user's database account and sync across devices. Local storage can be a demo/cache fallback, but must be clearly labelled as not cloud-synced.

Recommended entities:

- `courses`
- `timetable_slots`
- `holidays`
- `class_logs`
- `topics`
- `revision_tasks`
- `assignments`
- `assessments`

Every user-owned record needs a user ID and row-level security. Keep course IDs stable so editing a course code or name does not orphan its history. Confirm before deleting a course with related records; offer archive instead.

## Acceptance checklist

- [ ] Timetable from the uploaded image is preloaded and editable.
- [ ] Unconfirmed course-code mappings are visually obvious and editable.
- [ ] HSS Game Theory exists as a separate course option.
- [ ] Each scheduled class has a persistent Not logged / Ongoing / Completed / Class missed status.
- [ ] Student can enter today's topic and create a same-day revision task.
- [ ] Holiday toggle excludes dates from missed-class/stale-log calculations.
- [ ] A course not logged for more than two eligible teaching days appears in Must do today.
- [ ] Assignments support due dates, status, editing and deadline alerts.
- [ ] Old topics remain in a backlog until completed or explicitly rescheduled.
- [ ] Lecture completion and revision completion are separate states.
- [ ] All changes persist across devices after signing into the same account.
- [ ] Main dashboard explains why each task or subject has priority.
- [ ] Export/backup includes timetable, mappings, holidays, logs, topics, assignments, exams and marks.
