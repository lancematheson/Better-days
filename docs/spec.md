# Better Days — App Specification

Owner: Lance Matheson
Status: Beta, live as an iPhone home-screen web app
Live app: https://lancematheson.github.io/Better-days/  (the capital B matters)
Code: https://github.com/lancematheson/Better-days  (source in src/, built app in index.html; see CLAUDE.md)

## 1. Purpose
Rate each day across three pillars: **Physical, Emotional, Financial**. Each pillar has five factors.
Every night: score today, set its importance, predict tomorrow, and plan to-dos. The app shows grades,
trends, what dragged the day down, and expected vs. actual.

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
- **Scores:** 0.0–10.0, always typed with one decimal (4.0, 6.5, 10.0). N/A is allowed and is left out of the math.
- **Importance weights:** High = 3, Medium = 2, Low = 1.
- **Focus ("Big Three"):** 3 factors for the week (Mon 12:01 AM – Sun midnight), picked in Settings or setup. Focus factors get **×1.2** on top of that day's importance. *Planned, not built yet:* an automatic Sunday-night prompt with a weekly review of last week's Focus.
- **Pillar %** = Σ(score × weight) ÷ Σ(weight) × 10.
- **Pillar weights:** percentages that total 100, set at setup (default 40/35/25), editable later with dated history; past days keep the weights in effect at the time. Same for Focus and factor edits.
- **Overall %** = weighted average of the pillars (pillars with all N/A are skipped and the rest re-normalize).
- **Display:** whole-number % plus "X% left on the table". The letter grade comes from the **displayed (rounded) %**, so "90%" is always an A.
- **Grades:** straight US letters, no +/−: A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, F < 60.
- **Change arrows** are computed from the displayed numbers so they always match what's on screen.
- **Expected vs. actual:** tomorrow's predicted scores are scored with that day's final importance and compared to the actual. Shown to **one decimal** ("Beat expectations by 0.1 points" / "Fell short by 2.8 points"), with no letter grade on that line.

## 4. Colors (dark background)
- 50% and below: full red (#E0201B)
- 50–75%: red → orange → yellow
- 75–80%: yellow (#FFD60A)
- 80–90%: yellow → green (green appears above 80)
- 90% and up: full green (#1FA34A)
Used on rings, grades, graphs and dots. Calendar uses separate logged (green ✓) / missed (red ✗) colors.

## 5. Pages (iOS tab bar, Apple Fitness–style dark look)
1. **Summary** — gear icon opens Settings. Yesterday's (latest) day as three nested rings in grade colors (outer Physical, middle Emotional, inner Financial) with overall grade; previous 7 days as mini rings (tap to open a day); Highlights (streak, biggest improvement, biggest drop, expectation record); expandable cards: 7-Day Score, 30-Day Score (graph with trend line, pillar filter), Big Three, Needs Attention (tips).
2. **Check-in** (nightly, one session):
   - Step 1 Review Tasks: each to-do gets ✓ / ✗ buttons.
   - Step 2 Rate: 15 pages, one per factor. Linked to-dos shown at the top as name + ✓ / ✗. Questions in order: Today's score → Today's importance → Tomorrow's score → Tomorrow's importance. Importances are pre-filled (today = what you planned last night; tomorrow = most common choice in the last 7 days). Phone-style keypad; typing today's score jumps to tomorrow's score; typing tomorrow's score auto-advances to the next factor. Tab bar hidden during these 15 pages.
   - Step 3 Plan Tomorrow: add to-dos for tomorrow (optional factor link).
   - Optional free-text note, then Save Day → results (rings, expected vs. actual, Needs Attention, safety message).
3. **Planner** — Day / Week views. Blue + opens an add sheet: text, day chips (M–S or "Week" for anytime), week arrows to plan ahead, optional factor link. Unfinished daily to-dos carry over to the next day. Day view shows that day's check-in status (view it, or start it).
4. **Compare** — latest check-in vs. the one before it: overall, pillars, every factor (then/now/change/importance), expected vs. actual, both notes. Needs two check-ins.
5. **History** — monthly calendar: logged = green ✓, missed = red ✗, today = blue outline. Tap a day for its full detail (scores, importance, expected, to-dos, note, "Edited on [date]"). Every past day can be filled in or edited anytime.

## 6. Advice / tips
- Shown for anything **below 70%** (factor < 7.0, or a pillar/overall below 70%).
- **Only with internet.** Offline: "Connect to the internet to see tips."
- Never repeat; ↻ New tip moves to the next unseen tip; when exhausted: "No new tips for X right now."
- Each tip shows the advice, author + book/show, and "Open source ›".
- Sources: **Physical** — Andrew Huberman (Huberman Lab). **Emotional** — David Burns (Feeling Good), Kristin Neff (Self-Compassion), Emily & Amelia Nagoski (Burnout), Kelly McGonigal (The Upside of Stress), Robert Waldinger & Marc Schulz (The Good Life), Viktor Frankl (Man's Search for Meaning), Alex Soojung-Kim Pang (Rest), Cal Newport (Digital Minimalism). **Financial** — Morgan Housel (The Psychology of Money), Ramit Sethi (I Will Teach You to Be Rich), JL Collins (The Simple Path to Wealth), Dave Ramsey (The Total Money Makeover), Vicki Robin & Joe Dominguez (Your Money or Your Life).
- Current build: 33 built-in tips written in plain words from each source's main ideas. Live pulling from the sources needs a small server (future).
- **Safety net (always offline):** if the Emotional pillar or any emotional factor is below 50%, show a gentle message to reach out to someone and the 988 crisis line.

## 7. Settings & setup
- First launch runs a 6-step setup: Welcome → Pillar weights → Default importance → This week's Focus → Reminder → Done. "Run Setup Again" in Settings.
- Settings: pillar weights (must total 100), Focus (pick 3), factor names + default importance, reminder info, tip sources, change history, Export CSV (share sheet), Delete All Data (tap twice), About.
- Reminders: home-screen web apps can't schedule alarms; users set a daily repeating reminder in iPhone Reminders.

## 8. Data & platform
- Works offline. All data saved only on the phone (browser storage). No accounts, no cloud, no passcode.
- Days follow the calendar (midnight to midnight). Missed days are left out of all averages and graphs.
- CSV export: one row per day with overall/pillar %, every factor's score, importance and expected score, note, edited date. Deleting the home-screen app deletes its data, so export now and then.
- Installed via Safari → Share → Add to Home Screen. Anyone with the link can install it; each person's data is separate.

## 9. Decisions explicitly rejected
- Per-factor goals (scores stay out of 100; color scale was adjusted instead).
- Nightly "gut check" rating.
- Per-factor notes (one note per day only).
- iCloud sync, passcode / Face ID, CSV import.

## 10. Ideas / next steps
- Sunday-night Focus prompt and weekly review (decided, not built yet).
- Send Feedback button for beta testers.
- Live tip feeds (needs a small server).
- Native iOS app (Swift) for real reminders and App Store distribution (needs a Mac; $99/yr Apple Developer Program for TestFlight/App Store).
- Smaller-screen polish (iPhone SE needs a short scroll on check-in pages).
