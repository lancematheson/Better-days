# Better Days — App Specification

Owner: Lance Matheson
Status: Beta, live as an iPhone home-screen web app
Live app: https://lancematheson.github.io/Better-days/  (the capital B matters)
Code: https://github.com/lancematheson/Better-days  (source in src/, built app in index.html; see CLAUDE.md)

## 1. Purpose
Rate each day across three pillars: **Physical, Emotional, Financial**. Each pillar has five factors.
Every night: score today, set its importance, predict tomorrow, and plan to-dos. The app shows grades,
trends, what dragged the day down, and expected vs. actual. It also holds a personal and a work to-do list
and a daily journal.

## 2. Factors (15, editable in Settings)
| Pillar | Factor | 0 means | 10 means | Default importance |
|---|---|---|---|---|
| Physical | Sleep | barely slept or very poor sleep | full, restful night | High |
| Physical | Exercise | sedentary all day | did the planned workout or very active | High |
| Physical | Nutrition | mostly junk or skipped meals | balanced, on-plan eating | Medium |
| Physical | Hydration | barely drank water | hit your water goal | Low |
| Physical | Body / Energy | sick, in pain or exhausted | felt strong and energized | Medium |
| Emotional | Mood | low or down all day | upbeat and positive | High |
| Emotional | Stress | overwhelmed | calm and in control | High |
| Emotional | Connection | isolated, or conflict with people | meaningful time with others | Medium |
| Emotional | Purpose | felt wasted or aimless | did what mattered to you | Medium |
| Emotional | Mental Rest | no downtime at all | recharged (hobby, quiet time, reflection) | Low |
| Financial | Spending | impulsive or well over plan | stayed within plan | High |
| Financial | Saving | pulled from savings | moved money toward goals | Medium |
| Financial | Earning / Work | unproductive or lost income | strong work day or income progress | High |
| Financial | Obligations | missed a bill or added debt | everything on track or paid down | Medium |
| Financial | Awareness | no idea where money stands | checked accounts, tracked or planned | Low |

"Money stress" is deliberately not a Financial factor (it would double-count Emotional → Stress).

## 3. Scoring
- **Scores:** 0.0–10.0. New check-ins are swiped: **Good = 9, Okay = 7, Bad = 4** (no typing; days saved before the swipe check-in keep their exact one-decimal numbers). N/A is allowed and is left out of the math. Tips (below 7.0) show only for Bad.
- **Importance weights:** High = 3, Medium = 2, Low = 1. Set per factor in **Settings only** (not asked during check-in). A change applies from today on (today's saved check-in picks it up); earlier days keep the importance they were saved with.
- **Focus ("Big Three"):** 3 factors for the week (Mon 12:01 AM – Sun midnight), **exactly one from each pillar**, picked in Settings or setup (factors are grouped by pillar; tapping another factor in a pillar swaps that pillar's pick; Save / Continue wait until all three pillars have one). Default for new users: Sleep, Mood, Saving. Past weeks keep whatever Focus they had. Focus factors get **×1.2** on top of that day's importance. *Planned, not built yet:* an automatic Sunday-night prompt with a weekly review of last week's Focus.
- **Pillar %** = points earned ÷ points possible = Σ(score × weight) ÷ Σ(max × weight) × 100, where max is the top answer: **Good (9) for swipe check-ins**, so all Good = 100%, all Okay = 77.8%, all Bad = 44.4%. Days saved before the swipe check-in keep max = 10 (their percentages don't change). Each day stores its scale (`scale: 9`). Swipe days show scores as Good / Okay / Bad in History, Needs Attention and the vs. Expected lines.
- **Pillar weights:** percentages that total 100, set at setup (default 40/35/25), editable later with dated history; past days keep the weights in effect at the time. Same for Focus and factor edits.
- **Overall %** = weighted average of the pillars (pillars with all N/A are skipped and the rest re-normalize).
- **Display:** whole-number % plus "X% left on the table". The letter grade comes from the **displayed (rounded) %**, so "90%" is always an A.
- **Grades:** straight US letters, no +/−: A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, F < 60.
- **Change arrows** are computed from the displayed numbers so they always match what's on screen.
- **Expected vs. actual:** tomorrow's predicted scores are scored with that day's final importance and compared to the actual. Shown as **a general direction, not a size**: "Expected 84% → actual 78%" then "▲ Better than expected" / "▼ Below expectations" / "Right on expectations" (decided from the shown whole-number %), with no letter grade on that line.
- **Comparisons are up/down words, not score gaps** (swipe answers have no fine-grained numbers): vs. Expected pillar chips say ▲ Above / ▼ Below / On target; factor lines list "Better than expected: …" and "Worse than expected: …"; Highlights say "X is trending up/down from last week" (factor's 7-day average share of possible points vs. the week before, at least 3 points apart); Big Three shows "Mostly Good / Okay / Bad" (≥89% / ≥61% / below of possible points) with ▲ Up / ▼ Down / Steady. Whole-day and pillar % changes (e.g. "▲ 2 vs previous day", 7-/30-day cards) still show numbers.

## 4. Colors (dark background)
- 50% and below: full red (#E0201B)
- 50–70%: red → orange → yellow
- 70–75%: yellow (#FFD60A)
- 75–85%: yellow → green (green starts showing above 75)
- 85% and up: full green (#1FA34A)
Used on rings, grades, graphs, dots and the History calendar (each checked-in day is filled with its overall color).
Pillar tags on to-dos use their own colors so they never read as grades: Physical cyan, Emotional pink, Financial purple.

## 5. Pages (iOS tab bar, Apple Fitness–style dark look)
Tabs, in order: Summary · Check-in · Planner · History · Journal.

1. **Summary** — gear icon opens Settings. Top to bottom:
   - Latest day as three nested rings in grade colors (outer Physical, middle Emotional, inner Financial) with overall grade.
   - **[Today/Yesterday] vs. Expected**: overall and each pillar as actual %, ▲ Above / ▼ Below / On target compared
     with the prediction made the night before, and "expected N%"; then "Better than expected: …" and "Worse than
     expected: …" listing factors. Hidden when that day had no prediction.
   - Previous 7 days as mini rings (tap to open a day).
   - Needs Attention (expandable; tips).
   - Highlights (streak, biggest improvement, biggest drop, expectation record).
   - Expandable cards: 7-Day Score, 30-Day Score (graph with trend line, pillar filter), Big Three.
2. **Check-in**:
   - Opens on a big **Start Today's Check-in** button (or "Edit…" if already saved), with **today's to-dos below**, grouped
     by pillar (Physical, Emotional, Financial, then Other for old untagged ones), each with ✓ / ✗. They can be checked
     off anytime during the day; this is the review step.
   - Rate: **swipe cards**, one per factor (15). Each card takes two swipes: first **today**, then **Expected
     tomorrow** (the card shows "Today: Good" while asking about tomorrow). **Swipe up = Good, right = Okay, down = Bad,
     left = back** (previous answer). The card follows the finger and flies off; short drags snap back. Bad / Okay / Good
     buttons under the card do the same, and an "N/A today / N/A tomorrow" button skips. The card shows the factor, pillar,
     Focus badge, what Good and Bad mean, and its importance ("change it in Settings"). A one-line box above lists that
     pillar's to-dos (reminder only; to-dos never change scores). Tab bar hidden during the cards; they fit an iPhone 13
     screen without scrolling.
   - Plan Tomorrow: add to-dos for tomorrow (pillar required).
   - Optional free-text note, then Save Day → results (rings, expected vs. actual, Needs Attention, safety message).
3. **Planner** — a big **Personal | Work** switch at the top. Tapping the date opens a **pop-up month calendar** (dots on
   days with to-dos in the current list; Today button); picking a day jumps the list to it. This calendar only picks dates
   and is separate from History.
   - **Personal:** Day / Week views. Blue + opens an add sheet: text, **pillar (required: Physical / Emotional /
     Financial)**, repeat (below), day chips (M–S or "Week" for anytime), week arrows to plan ahead. Each to-do shows a
     colored pillar tag. Day view shows that day's check-in status (view it, or start it).
   - **Work:** one list per day with ‹ › arrows and Back to Today; quick-add box for the shown day; + opens the same add
     sheet without pillars. Done items sink to the bottom. Work to-dos are never part of the check-in or scores.
   - **Repeating to-dos (both lists):** Once / Daily / Weekdays / Weekly (pick one or more days, e.g. "Every Tue" for leg
     day). Each day's copy is checked off separately. A missed repeat just stays not done on its day (it does not carry
     over). × on a repeat asks: skip only that day, or stop repeating (past check marks are kept).
   - **Optional time (both lists):** the add sheet has an optional start time (iPhone time wheel; × clears it). Shown as
     "6:00 AM" on the row; timed to-dos sort first in time order, untimed after. Not offered for anytime-this-week
     to-dos. Repeats and carried-over to-dos keep their time.
   - **Scan (both lists):** the Scan button (next to +) takes or picks a photo of a list. A text reader running on the
     phone (Tesseract, bundled in `vendor/ocr/`, about 7 MB downloaded on the first scan and stored on the phone, then works offline) reads it;
     the photo is never saved or sent anywhere, and there's no AI or cost. Each line becomes a to-do: bullets, checkboxes,
     numbers and headings like "To do" are dropped; days ("today", "tomorrow", weekday names → the next one on or after
     today, "Nov 14", "14th of Jan", "11/14"; month/day with no year more than 60 days past → next year), times ("3pm",
     "6:30 pm", "noon"; a bare "3:30" means 1–6 → PM, 7–11 → AM) and repeats ("daily", "weekdays", "every Tue") are
     picked out. Personal rows get a pillar guessed from keywords (gym, call, pay, …). A review sheet shows every row
     (tick/untick, edit text, day, time, pillar); rows with no date use the day shown in Planner; personal rows without a
     pillar wait for one tap. Best on printed or neat text; messy handwriting and calendar grids read poorly. There is
     no manual paste/typing import (decided).
   - **Carry-over (both lists):** unfinished one-time to-dos from earlier days move to today with "Carried over from
     [date]". Anytime-this-week to-dos stay on their week.
4. **History** — monthly calendar: each checked-in day is filled with its overall score color; days with no check-in are
   left blank; today has a blue outline. Tap a day for its full detail: rings, grade and expected vs. actual on top, then
   tappable sections (Physical, Emotional, Financial with each pillar's %, To-dos with count, Note, and Journal if that day
   has an entry). Tap a section to open it (factor scores, importance, expected). The Note starts open; the rest start collapsed each time a day is opened.
   "Edited on [date]" shows under the date. Every past day can be filled in or edited anytime. (The old Compare page was removed; its
   key numbers live in the Summary card and each day's detail.)
5. **Journal** — one blank page per day, ‹ › to move between days, Back to Today, word count. Tapping the date opens the
   same pop-up calendar as Planner (dots on days with an entry) to jump to any day. Saves as you type. Separate
   from the check-in's short note.

## 6. Advice / tips
- Shown for anything **below 70%** (factor < 7.0, or a pillar/overall below 70%).
- **Only with internet.** Offline: "Connect to the internet to see tips."
- **Never run out:** ↻ New tip always shows another tip. Each factor's tips go in order the first time through, then
  start a new shuffled round; the same tip never shows twice in a row. (Older saves pick up after the tips already seen.)
- Each tip shows the advice, author + book/show, and "Open source ›".
- Sources: **Physical** — Andrew Huberman (Huberman Lab), Matthew Walker (Why We Sleep), Peter Attia (Outlive), Michael
  Pollan (Food Rules), Mayo Clinic (hydration guidance). **Emotional** — David Burns (Feeling Good), Kristin Neff (Self-Compassion), Emily & Amelia Nagoski (Burnout), Kelly McGonigal (The Upside of Stress), Robert Waldinger & Marc Schulz (The Good Life), Viktor Frankl (Man's Search for Meaning), Alex Soojung-Kim Pang (Rest), Cal Newport (Digital Minimalism), Martin Seligman (Flourish). **Financial** — Morgan Housel (The Psychology of Money), Ramit Sethi (I Will Teach You to Be Rich), JL Collins (The Simple Path to Wealth), Dave Ramsey (The Total Money Makeover), Vicki Robin & Joe Dominguez (Your Money or Your Life), Cal Newport (Deep Work).
- Current build: 150 built-in tips (10 per factor) written in plain words from each source's main ideas. Live pulling from the sources needs a small server (future).
- **Safety net (always offline):** if the Emotional pillar or any emotional factor is below 50%, show a gentle message to reach out to someone and the 988 crisis line.

## 7. Settings & setup
- First launch runs a 5-step setup: Welcome → Pillar weights → Importance → This week's Focus → Done. "Run Setup Again" in Settings.
- Settings: pillar weights (must total 100), Focus (one per pillar), factor names + importance, tip sources, change history, Export CSV (share sheet), Delete All Data (tap twice; also clears to-dos and journal), About.
- No reminders or alarms anywhere in the app (removed by decision; see §9).

## 8. Data & platform
- Works offline. All data saved only on the phone (browser storage). No accounts, no cloud, no passcode.
- Days follow the calendar (midnight to midnight). Missed days are left out of all averages and graphs.
- CSV export: one row per day with overall/pillar %, every factor's score, importance and expected score, note, edited date, journal text. Deleting the home-screen app deletes its data, so export now and then.
- Installed via Safari → Share → Add to Home Screen. Anyone with the link can install it; each person's data is separate.

## 9. Decisions explicitly rejected
- Per-factor goals (scores stay out of 100; color scale was adjusted instead).
- Nightly "gut check" rating.
- Per-factor notes (one note per day only).
- iCloud sync, passcode / Face ID, CSV import.
- Reminders / alarms of any kind (setup step and Settings section removed).
- Compare page (replaced by the Summary "vs. Expected" card).
- Paste-a-list import (Lance wants Scan only).

## 10. Ideas / next steps
- Sunday-night Focus prompt and weekly review (decided, not built yet).
- Send Feedback button for beta testers.
- Live tip feeds (needs a small server).
- **HubSpot tasks in the Work list** — tabled; plan ready in `docs/future-integrations.md`.
- **Automatic calendar sync** (Apple / Google Calendar) — tabled; plan ready in `docs/future-integrations.md`.
- **AI photo reading** (better handwriting and calendar grids than the on-phone Scan) — tabled until the middleman
  server exists; plan ready in `docs/future-integrations.md`. Would plug into the same Scan review sheet.
- Native iOS app (Swift) for real reminders and App Store distribution (needs a Mac; $99/yr Apple Developer Program for TestFlight/App Store).
- Smaller-screen polish (iPhone SE needs a short scroll on check-in pages).
