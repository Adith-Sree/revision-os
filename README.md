# Revision OS — IIT Guwahati academic tracker

A responsive React app for daily lecture capture, same-day revision, spaced repetition, backlog tracking, timetable mapping and course-level progress. It is configured for Supabase Auth + Postgres JSONB storage so one account can sync across devices. Without Supabase credentials it runs in browser-local demo mode.

## 1. What was transcribed from your images

### Course catalogue

| Course code | Course name |
|---|---|
| EE 380 | Electrical Machines |
| HS 1xx | HSS Elective - II |
| HSS Game Theory | HSS Game Theory |
| ME 311 | Heat Transfer |
| ME 312 | Manufacturing Technology - II |
| ME 313 | Dynamics of Machinery |
| ME 314 | Design of Machine Elements |
| ME 315 | Mechanical Engineering Lab - III |

The user additionally confirmed that they take **HSS Game Theory**, so it is now included as a separate selectable course in the app. The timetable also contains `MINOR`, whose exact course name was not shown in the course catalogue image. If the `HSS` timetable slots are Game Theory, map `HSS` to `HSS Game Theory` in the app; the mapping remains editable and is not pre-confirmed automatically.

### Timetable labels that do not match the catalogue codes

The uploaded timetable uses `ME3101L (B)`, `ME3101L (A)`, `HSS`, `ME3103 (B)`, `ME3312`, `EE3005`, `ME3101`, `ME3103`, `ME3104`, `MINOR`, and `ME3103 (A)`. The catalogue instead lists `EE 380`, `HS 1xx`, and `ME 311`–`ME 315`. The images alone do not establish reliable equivalences. Revision OS therefore starts with **unconfirmed mappings left blank**; use Timetable & mapping to set each mapping after checking your official course page. You can edit course names and add courses too.

### Timetable transcription

- Monday 09:00–12:00 — ME3101L (B)
- Thursday 09:00–12:00 — ME3101L (A)
- Wednesday 13:00–13:55 — HSS
- Thursday 13:00–13:55 — HSS
- Friday 13:00–13:55 — HSS
- Monday 14:00–14:55 — ME3103 (B), room 5103
- Tuesday 14:00–14:55 — ME3312, room 5102
- Wednesday 14:00–14:55 — EE3005, room 5G1
- Thursday 14:00–14:55 — ME3103, room 5102 / 5103
- Friday 14:00–14:55 — ME3104, room 5102 / 5103
- Monday 15:00–15:55 — ME3312, room 5102
- Tuesday 15:00–15:55 — EE3005, room 5G1
- Wednesday 15:00–15:55 — ME3101, room 5102
- Thursday 15:00–15:55 — MINOR
- Friday 15:00–15:55 — ME3103 (A), room 5102
- Monday 16:00–16:55 — EE3005, room 5G1
- Tuesday 16:00–16:55 — ME3101, room 5102
- Thursday 16:00–16:55 — ME3104, room 5102 / 5103
- Friday 16:00–16:55 — ME3312, room 5102
- Monday 17:00–17:55 — ME3104, room 5102 / 5103
- Tuesday 17:00–17:55 — MINOR
- Wednesday 17:00–17:55 — ME3103, room 5102 / 5103
- Thursday 17:00–17:55 — ME3101, room 5102

The source timetable has no Friday 17:00 slot. The Monday/Tuesday 13:00 cells appear shaded/blocked and were not added as classes.

## 2. Run locally

Requires Node.js 20+.

```bash
cd revision-os
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). In demo mode the app stores data in this browser's local storage. This is useful for testing, but it is **not cross-device sync**.

## 3. Enable database-backed sync across devices (Supabase)

1. Create a project at https://supabase.com/.
2. In the Supabase SQL Editor, run all of `supabase/schema.sql`. It creates `public.revision_os_data`, enables row-level security, and restricts each signed-in user to their own row.
3. In Supabase Project Settings → API, copy the Project URL and the publishable key (or legacy anon key). Never put a `service_role` key in a frontend app.
4. Create `.env.local` in this folder, using `.env.example` as the template:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

5. Restart `npm run dev`, create an account in Revision OS, and sign in. If email confirmation is enabled in Supabase Auth, confirm the email before signing in.
6. Open the same deployed app on another device and sign in with the same account. The app reads/writes that account's JSON payload in Supabase. Local browser storage is retained as a quick cache.

Deploy to Vercel, Netlify, or another static host by running `npm run build` and publishing `dist/`. Configure the same two `VITE_` environment variables in the hosting provider before building. Add the deployed site URL to Supabase Auth's Site URL / redirect URL configuration.

## 4. Daily workflow

1. Open Overview or Daily planner and choose the relevant date.
2. For each class, select **Log class** / **Log lecture & add topic**. Record only what was actually taught. Entering a topic creates a topic-library entry and a same-day revision task.
3. Add older topics in Topic library or create manual tasks.
4. Mark a task complete after doing active recall or practice. For topic-linked tasks, completion advances that topic's review counter and schedules the next review using the configured default intervals `[1, 3, 7, 14]` days.
5. Use Revision backlog to see overdue, due-today and upcoming tasks. Reschedule a task if necessary; tasks are not silently deleted.
6. Use Timetable & mapping to confirm the mismatched course codes. Course coverage only groups correctly after mapping.
7. Use **Export backup** on the timetable page for a portable JSON backup. Import it on another browser if needed.

## 5. Current scope / honest limitations

- This is a working frontend scaffold with editable timetable, tasks, topic capture, review queue, filters, local fallback and Supabase auth/storage integration.
- It does not automatically know what an instructor taught. The student must confirm topics after class; this avoids fabricated class content.
- The app does not yet send scheduled push/email reminders. Dates are generated when tasks/topics are created or marked complete.
- Current Supabase persistence stores a user's application state in one JSONB row. This is simple and suitable for a personal tracker; for multi-user classrooms or advanced reporting, normalize topics/tasks into separate tables.
- The uploaded timetable is treated as Monday–Friday repeating weekly. Check/edit any transcription errors in the UI.
- This starter does not use an AI model API. “Agent” behavior is deterministic planning (task generation, overdue visibility, review intervals); AI summarization can be added later with a server-side API route.
