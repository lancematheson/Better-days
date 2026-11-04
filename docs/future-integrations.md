# Future Integrations: HubSpot, Calendar Sync and AI Photo To-dos

Status: **tabled by Lance (Nov 2026).** Nothing here is built. This is the agreed path for when he wants them.
Read `docs/spec.md` first; these plans assume the app as described there.

## Why both need extra pieces
Better Days is a web page saved to the phone with no server. All data lives in the phone's browser storage
(`dayscore.v1`). Two things block a direct connection:
- **HubSpot** won't accept calls straight from a web page (no CORS for its API), and its access key must never
  sit on a phone.
- **Apple Calendar** can't be written to by a web page. It *can* subscribe to a calendar link and refresh it on
  its own.

So the plan is one small, private server (a "middleman") that both features share, plus a Google Calendar
option that needs no server.

## Shared piece: the middleman server
- **Host:** Cloudflare Workers (free tier is plenty) with Workers KV for storage. Lance creates a free
  Cloudflare account; Claude writes the code and walks him through deploying it (about 15 minutes).
- **Privacy:** only to-dos (personal, work, repeats) are sent. Scores, notes and journal stay on the phone.
  Settings gets an on/off switch and a "What's shared" line. This changes the "no cloud" line in spec §8, so the
  spec must be updated when it ships.
- **Access:** one long random secret, entered once in Settings on Lance's phone. Every call sends it; the
  server rejects anything without it. Beta testers never see Lance's data, and the feature stays off for them
  unless they set up their own.
- **Sync:** the app pushes its to-do lists to the server whenever they change (debounced, like the existing
  save) and when the app opens. If offline, it retries next time. The phone stays the source of truth.

## 1. HubSpot tasks in the Work list
**Goal:** HubSpot tasks assigned to Lance show up in Planner → Work on their due date, marked with a small
HubSpot tag. Checking one off in the app completes it in HubSpot.

**Steps**
1. **HubSpot private app.** In HubSpot: Settings → Integrations → Private Apps → Create. Scopes:
   `crm.objects.tasks.read` and `crm.objects.tasks.write` (plus `crm.objects.owners.read` to find Lance's
   owner ID). Needs HubSpot super-admin rights; if it's a company account, check with IT first.
2. **Store the token** as a secret in the Cloudflare Worker (`HUBSPOT_TOKEN`). It never reaches the phone.
3. **Worker routes**
   - `GET /hubspot/tasks?from=YYYY-MM-DD&to=YYYY-MM-DD`: search tasks
     (`POST /crm/v3/objects/tasks/search`) filtered to Lance's owner ID, not completed, due in range. Return
     `{ id, subject, dueDate (local YYYY-MM-DD), status }`.
   - `POST /hubspot/tasks/:id/complete`: `PATCH /crm/v3/objects/tasks/:id` with `hs_task_status: COMPLETED`.
4. **App changes** (`src/app.js`)
   - Fetch when the Work list opens and on pull-to-refresh, for about 2 weeks either side of the shown day.
   - Keep them in a separate `hubspot` cache in state, not in `work`, so a sync can never delete Lance's own
     items. `workForDay(k)` adds them in, the same way repeating to-dos are added in.
   - Rows show a "HubSpot" tag. Toggling done calls the complete route, and the row updates when it succeeds.
   - Overdue HubSpot tasks show on today with "Due [date]", following the carry-over rule.
5. **Tests:** fake the Worker in `tests/logic.test.js` (cached tasks merge, done calls the route, failure leaves
   the row unchanged); add a Settings screenshot to the end-to-end test.

**Effort:** about a day of work once HubSpot access is granted.

## 2. Automatic calendar sync
Two routes were agreed as viable. Pick one when the time comes.

### Option A: calendar subscription (recommended; shares the server above)
**What Lance gets:** Apple Calendar (or Google or Outlook) shows his to-dos automatically and updates on its
own every 15 to 60 minutes (iPhone Settings → Calendar → Accounts → Fetch). One-way: viewing only in Calendar.

**Steps**
1. Worker route `GET /cal/<secret>.ics` builds an iCalendar file from the stored to-dos:
   - To-dos with a time become 30-minute events at that time (`DTSTART`/`DTEND` with the phone's time zone, sent as
     `TZID`). Without a time they become all-day `VEVENT`s (`DTSTART;VALUE=DATE`). Anytime-this-week ones go on the week's
     Monday with "(this week)".
   - Repeats become one `VEVENT` with `RRULE`: daily → `FREQ=DAILY`; weekdays → `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR`;
     weekly → `FREQ=WEEKLY;BYDAY=<days>`. Skipped days go in `EXDATE`, and "stop repeating" becomes `UNTIL`.
   - Done items get "✓ " in front of the title.
   - Stable `UID`s (`bd-task-<id>@betterdays`, `bd-series-<id>@betterdays`) so updates replace events instead of
     duplicating them.
   - Personal and work as two separate links (two calendars), so each can have its own color.
   - **No alarms (`VALARM`)**, per the no-reminders decision.
2. Settings → "Calendar sync" shows the two `webcal://` links with copy buttons and a short "Add to iPhone
   Calendar" guide (Settings → Calendar → Accounts → Add Account → Other → Add Subscribed Calendar).
3. Tests: unit-test the `.ics` builder (dates, RRULE mapping, EXDATE, UNTIL, escaping commas and semicolons).

**Effort:** about half a day on top of the server.

### Option B: Google Calendar, two-way, no server
**What Lance gets:** to-dos appear in a "Better Days" Google Calendar (visible in Apple Calendar once Google is
added to the iPhone). Edits made in the calendar flow back into the app. It syncs only while the app is open.

**Steps**
1. Google Cloud project, Calendar API enabled, OAuth web client with the app's URL as an authorized origin.
   Scope: `https://www.googleapis.com/auth/calendar.app.created` (only calendars the app creates). The app stays in
   "testing" mode, which allows up to 100 named test users; more than that needs Google's verification review.
2. Sign in with Google Identity Services (token client, loaded from the allowed script host), then create a
   "Better Days" calendar on first run.
3. Sync on open and after changes: upsert events by a stored mapping (to-do id ↔ event id). Pull changes with
   `syncToken` and apply title or date edits back to the to-dos. Repeats map to RRULE as in Option A.
4. Tokens last about an hour; renew them silently when the app opens.

**Effort:** 1 to 2 days. More moving parts than Option A.

### Not chosen (for the record)
- **One-time .ics export** (share sheet → Add All): easy, but it's a copy rather than sync, and re-exporting can
  duplicate events.
- **Native iOS app with EventKit:** true two-way sync with Apple Calendar, but means a Swift rewrite, a Mac and
  $99/yr. Already listed in spec §10.

## 3. AI photo to-dos ("snap a list")
**Goal:** in Planner, a camera button lets Lance take or pick a photo of a handwritten or printed list, or a paper
calendar. AI reads it and proposes to-dos with dates and times, then he reviews them and adds them to the Planner.
This does not involve Apple Calendar.

**Decided (Nov 2026):** wait for the middleman server. The AI key stays on the server and never goes on the phone.
(Rejected for now: keeping a personal key on the phone, which would have been simpler.)

**Steps**
1. **Anthropic account and key.** Lance creates an account at console.anthropic.com, adds a little credit and sets a
   monthly spend limit. The key is stored as a Worker secret (`ANTHROPIC_API_KEY`).
2. **Worker route `POST /ai/todos`** (same secret check as the other routes). The body holds the photo (shrunk on the
   phone to about 1500px on the long side, JPEG, base64), today's date, the shown Planner day, and whether
   Personal or Work is open. The route calls the Claude Messages API with the image and a tool or JSON schema that
   returns `[{ text, date (YYYY-MM-DD or null), time (HH:MM or null), pillar (physical|emotional|financial|null),
   repeat (none|daily|weekdays|weekly + days) , confidence }]`. The prompt resolves relative or partial dates
   ("Tue", "the 14th") against today, and ignores crossed-out items. Use the current Claude model with vision; check
   the model ID and pricing when building (load the `claude-api` skill). Nothing is stored on the server.
3. **App changes**
   - A camera button next to + in Planner (both modes) opens `<input type="file" accept="image/*">`, which gives
     iPhone's Take Photo / Photo Library choice.
   - While it works, show "Reading your photo…". If it's offline or fails, show a clear message, and the photo is
     never kept.
   - **Review sheet (always):** one row per suggested to-do with a checkbox, editable text, day, optional time,
     pillar buttons (Personal) and repeat. Rows missing a pillar are flagged. Then "Add N to-dos".
   - It adds through the existing `addTask` / `addWorkItem` / `addSeries`, so carry-over, sorting, the check-in and the
     pop-up calendar all work with no other changes.
   - Hidden for anyone without server access set up in Settings (beta testers), the same as the other integrations.
4. **Tests:** fake the route in `tests/logic.test.js` (review rows map to the right lists, unchecked rows are skipped,
   personal rows need a pillar); add a review-sheet screenshot to the end-to-end test.

**Cost and privacy:** roughly 1 to 2 cents per photo. The photo is sent to Anthropic only to be read, and the app
keeps only the to-dos Lance approves. Spec §8 (data and privacy) must be updated when this ships.

**Effort:** 1 to 2 days, or about 1 day if the server already exists.

**Stopgap (no AI, no server), if wanted sooner:** a "Paste list" box. iPhone Live Text copies the text from a photo,
each pasted line becomes a row in the same review sheet, and Lance sets days and pillars by hand. About half a day.

## Suggested order when un-tabled
1. Build the middleman server and the Settings on/off switch with the secret.
2. Calendar subscription (Option A): the quickest visible win, and it proves out the server.
3. AI photo to-dos (reuses the server, plus the review sheet).
4. HubSpot tasks, once HubSpot private-app access is approved.
