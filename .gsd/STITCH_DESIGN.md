# Stitch Design Extraction & UI Design System Specification
**Project:** Revision OS (Remix of Romer Saas Dashboard / Project ID: `6927529279295337026`)  
**Extracted Date:** 2026-10-11  
**Source MCP:** Google Stitch MCP (`@_davideast/stitch-mcp`)  
**Saved Artifacts:** `.gsd/designs/` (HTML & PNG assets for all screens)

---

## 1. Extracted Screens Inventory

| Screen Name | Screen ID | Dimensions | Downloaded Assets |
|-------------|-----------|------------|-------------------|
| **Revision OS — Student Dashboard** | `a2acca299609468b808ab0e682065072` | 2560 × 2622 | `revision-os-student-dashboard.html`, `.png` |
| **Revision OS — Academic Timetable** | `d1470f01829842c39fe38bf5102d5211` | 2560 × 3552 | `revision-os-academic-timetable.html`, `.png` |
| **Revision OS — Course Library** | `633eaf7c654d4cab984c5b9a17ea542d` | 2560 × 5102 | `revision-os-course-library.html`, `.png` |
| **Revision OS — Revision Planner** | `1ac14ed61c214eaab2fee7efe4ec1065` | 2560 × 3528 | `revision-os-revision-planner.html`, `.png` |
| **Revision OS — Academic Analytics** | `33fd07b5faf2480191f17c09ee9a2120` | 2560 × 4262 | `revision-os-academic-analytics.html`, `.png` |

---

## 2. Design Tokens & Visual Hierarchy

### Color Palette (M3 Editorial Academic Theme)

```css
:root {
  /* Primary — Warm Terracotta / IITG Academic Amber */
  --color-primary: #8d4b00;
  --color-primary-container: #b15f00;
  --color-on-primary: #ffffff;
  --color-on-primary-container: #fffbff;
  --color-primary-fixed: #ffdcc3;
  --color-on-primary-fixed: #2f1500;
  --color-primary-fixed-dim: #ffb77d;

  /* Secondary — Steel Slate */
  --color-secondary: #545f73;
  --color-secondary-container: #d5e0f8;
  --color-on-secondary: #ffffff;
  --color-on-secondary-container: #586377;
  --color-secondary-fixed: #d8e3fb;
  --color-on-secondary-fixed: #111c2d;

  /* Tertiary — Academic Forest Green (Success / Verified / Synced) */
  --color-tertiary: #006948;
  --color-tertiary-container: #00855d;
  --color-on-tertiary: #ffffff;
  --color-on-tertiary-container: #f5fff7;
  --color-tertiary-fixed: #85f8c4;
  --color-on-tertiary-fixed: #002114;

  /* Error / Overdue / High Priority */
  --color-error: #ba1a1a;
  --color-error-container: #ffdad6;
  --color-on-error: #ffffff;
  --color-on-error-container: #93000a;

  /* Surfaces & Containers (Light Mode Academic Sand) */
  --color-background: #f9f9f6;
  --color-surface: #f9f9f6;
  --color-surface-dim: #dadad7;
  --color-surface-bright: #f9f9f6;
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #f4f4f1;
  --color-surface-container: #eeeeeb;
  --color-surface-container-high: #e8e8e5;
  --color-surface-container-highest: #e2e3e0;

  /* Typography & Text */
  --color-on-surface: #1a1c1b;
  --color-on-surface-variant: #554336;
  --color-outline: #887364;
  --color-outline-variant: #dbc2b0;

  /* Dark Theme Tokens (from Stitch Design System Asset `ccaa7562...`) */
  --color-dark-bg: #121317;
  --color-dark-surface: #121317;
  --color-dark-surface-container: #1f1f24;
  --color-dark-surface-container-high: #292a2e;
  --color-dark-surface-container-highest: #343439;
  --color-dark-primary: #c0c1ff;
  --color-dark-on-surface: #e3e2e7;
  --color-dark-outline: #908fa0;
}
```

### Typography Scale
- **Headings & Body**: `Inter, system-ui, -apple-system, sans-serif`
- **Monospace / Metric Tags / Codes**: `JetBrains Mono, monospace`
- `headline-xl`: `2rem` (32px), `line-height: 2.5rem`, `font-weight: 600`, `letter-spacing: -0.025em`
- `headline-lg`: `1.5rem` (24px), `line-height: 2rem`, `font-weight: 600`, `letter-spacing: -0.02em`
- `headline-md`: `1.25rem` (20px), `line-height: 1.75rem`, `font-weight: 600`
- `headline-sm`: `1.125rem` (18px), `line-height: 1.5rem`, `font-weight: 500`
- `metric-display`: `1.75rem` (28px), `line-height: 2rem`, `font-weight: 600`
- `body-lg`: `1rem` (16px), `line-height: 1.625rem`
- `body-md`: `0.875rem` (14px), `line-height: 1.45rem`
- `body-sm`: `0.75rem` (12px), `line-height: 1.25rem`
- `label-code`: `0.75rem` (12px), `font-family: JetBrains Mono`, `letter-spacing: 0.02em`, `font-weight: 500`
- `label-status`: `0.6875rem` (11px), `text-transform: uppercase`, `letter-spacing: 0.04em`, `font-weight: 600`

### Geometry & Elevation
- **Border Radius**:
  - `card`: `0.75rem` (12px) `rounded-xl`
  - `button / input`: `0.5rem` (8px) `rounded-lg`
  - `badge / code pill`: `0.25rem` (4px) `rounded`
  - `full pill`: `9999px` `rounded-full`
- **Box Shadows**:
  - Soft Card Shadow: `box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04)`
  - Elevated Popover/Modal: `box-shadow: 0 12px 36px -4px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.08)`

---

## 3. Stitch Screen Architecture & Component Blueprints

### A. Dashboard (`revision-os-student-dashboard.html`)
1. **Semester Rhythm Header**:
   - Status ribbon: `SPRING 2025 • SEM VI | MID-SEM IN 18 DAYS | WEEK 8 (TERM ELAPSED: 57.1%)`
   - Greeting with dynamic counters: `You have X revisions due today and Y scheduled lectures remaining.`
   - Primary action buttons: `Quick Log Lecture (⌘L)`, `Start Daily Revision`.
2. **4-Tile Academic Metric Grid**:
   - `Daily Revision Target`: Circular SVG progress ring (e.g. 3/5 Topics, 60%).
   - `Spaced Repetition Due`: Urgent indicator ping, critical Day-7 and regular breakdown.
   - `Lecture Log Health`: Consecutive logged streak + stale log alert if > 2 eligible days.
   - `Exam Readiness Index`: Aggregate subject readiness with countdown to next high-stakes assessment.
3. **Daily Schedule & Class Log Cards**:
   - Room tag, session status toggle (`Not logged`, `Ongoing`, `Completed`, `Class missed`).
   - Quick "Topic Taught" input linking directly to topic library and same-day revision trigger.
4. **Active Recall Queue**:
   - Cards showing interval badge (`Day 1`, `Day 3`, `Day 7`, `Day 14`), confidence rating actions (`Struggled`, `Good`, `Easy`).

### B. Academic Timetable (`revision-os-academic-timetable.html`)
1. **Header with Slot Filtering & Exam Mode Toggle**:
   - Toggle: `Standard Teaching Week` vs `Exam Slotting (Mid-Sem / End-Sem)`.
   - Visual unconfirmed mapping pills (`ME3101L (B) → Mapping Needed`).
2. **Weekly Matrix**:
   - Monday to Friday time grid (09:00 to 18:00).
   - Color-coded subject cards with course code, room number (5102, 5103, 5G1), and instructor.

### C. Course Library (`revision-os-course-library.html`)
1. **Course Dossiers**:
   - Course Code, Course Title, Credits, Department.
   - Syllabus completion progress bar.
   - Confidence level meter (1 to 5).
   - Assignment tracker with submission tags.
   - Exam weightage breakdown section.

### D. Revision Planner (`revision-os-revision-planner.html`)
1. **Timeline & Date Navigator**:
   - Spaced repetition queue grouped by `Overdue`, `Today`, `Upcoming`.
   - Interval tracking pills (`1d`, `3d`, `7d`, `14d`).
   - Quick reschedule and holiday status integration.

### E. Academic Analytics (`revision-os-academic-analytics.html`)
1. **Performance & Spaced Repetition Velocity**:
   - Retention curve visualization.
   - Session density and backlog burn-down charts.
   - Exam prep window tracking.

---

## 4. Exam Tracker Screen Blueprint (Adapted from Design System)

Applying the extracted Stitch design tokens and component patterns to `EXAM_TRACKER.md`:

```
┌────────────────────────────────────────────────────────────────────────┐
│  EXAM CALENDAR & PERFORMANCE TRACKER                                    │
│  [Spring 2025]  [All Courses ▼]  [All Types ▼]  [+ Add Assessment]     │
├────────────────────────────────────────────────────────────────────────┤
│  Top Metrics:                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ Next Exam    │ │ Confirmed    │ │ Priority 1   │ │ Average %    │  │
│  │ Mid-Sem (18d)│ │ 6 of 8 Seeded│ │ ME 311 (82/100)│ │ 78.4%        │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
├────────────────────────────────────────────────────────────────────────┤
│  Tabs: [📅 Semester Calendar]  [📊 Marks & History]  [🎯 Subject Priority]│
├────────────────────────────────────────────────────────────────────────┤
│  Tab 1: Calendar View                                                  │
│  • Chronological list of confirmed exams with countdown badges          │
│  • Overdue (Red), Within 7 days (Orange), Within 14 days (Yellow)      │
│  • "Date Not Announced" section for unannounced assessments            │
│  • Inline actions: Edit, Mark Completed (prompts marks), Reschedule, Del│
│                                                                        │
│  Tab 2: Marks & Past-Exam History                                      │
│  • Course-wise performance table                                       │
│  • Marks Obtained / Max Marks with safe % calculation                  │
│  • Missing marks displayed as "—" (never treated as 0)                 │
│  • Weightage % breakdown                                               │
│                                                                        │
│  Tab 3: Subject Priority ("Which subjects are most messed up?")        │
│  • Explainable 0–100 priority score cards with breakdown               │
│  • (35% weakness + 25% urgency + 20% backlog + 10% syllabus + 10% stale)│
│  • Sliders: Confidence (1-5), Syllabus (0-100%), Difficulty (L/M/H)    │
│  • Manual override toggle with automatic score visible alongside       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Summary of Next Execution Steps

All designs are extracted and preserved locally in `.gsd/designs/`.
The executable plan is updated with precise color tokens, typography scales, layout structures, and component rules.
