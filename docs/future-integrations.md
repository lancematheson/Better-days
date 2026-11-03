# Future Integrations: HubSpot and Calendar Sync

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
   - One-time to-dos become all-day `VEVENT`s (`DTSTART;VALUE=DATE`). Anytime-this-week ones go on the week's
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

## Suggested order when un-tabled
1. Build the middleman server and the Settings on/off switch with the secret.
2. Calendar subscription (Option A): the quickest visible win, and it proves out the server.
3. HubSpot tasks, once HubSpot private-app access is approved.
