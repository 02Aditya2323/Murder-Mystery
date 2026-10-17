# MURDER MYSTERY: Build Spec 


This file is the single source of truth. Keep it private (it contains every answer). Never commit plaintext answers to a public repo.

Legend used below:
- **AGENT BUILDS** means you generate it (code, logs, documents, SQL data, SVGs, Morse pulse data, placeholders).
- **OWNER SUPPLIES** means you cannot produce it. Create a clearly marked placeholder, wire the exact path, and list it in `MISSING_ASSETS.md`. Never fake real content.

---

## 1. What we are building

A web platform for a 3.5 hour team murder mystery event. Teams solve 10 sequential levels. Each solved level reveals one clue card. After level 10 each team submits a written theory of the case, which organizers review.

Hard constraints:
1. The client ships exactly one heavy runtime: **sql.js** (SQLite as WASM) for Level 4. No compilers, interpreters, Pyodide, WebContainers or code runners anywhere on the client. Level 9 (code debugging) is fill in the blank plus answer checking on the server. Nothing is executed.
2. **Self host everything** (fonts, WASM, images). No CDN calls at runtime. Venue Wi-Fi may be weak.
3. **Answers never reach the client before they are earned.** All validation is server side. Later level content and assets are served only to teams that unlocked them.
4. **Names are data.** The event is named **Murder Mystery** (`event.name`). Case number, victim, suspects and place names also live in config and content files so the owner can rename things and the UI stays consistent.
5. Target load: 60 teams, about 200 concurrent browsers, one small VM.
6. **No audio files anywhere.** The only sound in the app is the Level 2 Morse recording, synthesized in the browser with the Web Audio API. Every other recording in the story exists as a typed transcript card.

---

## 2. Stack (decided, do not re-litigate)

| Layer | Choice |
|---|---|
| Frontend | React 18, Vite, TypeScript, React Router, Zustand, Tailwind (tokens mapped to CSS variables), `@dnd-kit/core` (diary ordering) |
| SQL level | `sql.js` WASM, served from our own `/vendor/sqljs/` |
| Backend | Node 20, Express, TypeScript, `better-sqlite3` (WAL mode), `zod` validation, `helmet`, `express-rate-limit` |
| Auth | Team code + password, httpOnly signed cookie session. Admin login on a hidden route |
| Realtime | Server Sent Events for the leaderboard and organizer broadcasts |
| Fonts | `@fontsource` packages, bundled locally |
| Deploy | One Node process serves the built frontend and the API. Provide Dockerfile and docker-compose |
| Tests | Vitest for answer normalization and scoring, Playwright for one happy path through all 10 levels |

Why SQLite on the server: single VM, no ops, trivial backups (copy one file). Do not introduce Postgres or Mongo.

---

## 3. Repo layout

```
/apps/web            React app
/apps/server         Express API
/content
  event.config.json  names, theme tokens, scoring, timers
  characters.json    people and places used in story text
  levels/01..10/     level.json, story.md, hints.md, reveal.md, answers.private.json (gitignored)
  assets-private/    served only through the authenticated asset route
/scripts             generators (logs, SQL db, SVGs, answer hashing)
MISSING_ASSETS.md    generated list of OWNER SUPPLIES files still missing
```

Story text uses variables, for example `{{victim.full}}`, `{{place.claimed}}`, resolved from `characters.json` at render time.
Note: answers that contain a name or ID (JULIAN, LENA_IPAD, 4417) live in `answers.private.json` and must be edited by hand if the owner renames those.

---

## 4. Theme and UI direction

Direction: **tape archive noir**. The story is about a psychologist's recorded sessions, case notes and a records database. The UI is the case file and evidence desk of that investigation. Not neon, not London pastiche, not slasher horror (the previous event UI used hazard tape and drip fonts; do not reuse them).

Design tokens (CSS variables in `apps/web/src/theme/tokens.css`, overridable from `event.config.json`):

| Token | Value | Use |
|---|---|---|
| `--ink` | `#151412` | page background (warm black) |
| `--tape` | `#23201C` | panels, cassette label backs |
| `--manila` | `#D9C9A0` | folders, document paper |
| `--label` | `#F1E8D0` | paper highlights, label stickers |
| `--redact` | `#0B0A09` | redaction bars |
| `--signal` | `#E39B2D` | amber accent, primary action (keeps the orange identity of earlier events) |
| `--alarm` | `#A9362E` | errors, locked stamps |
| `--ok` | `#4F7A5A` | solved state |
| `--dim` | `#9B9488` | secondary text |

Typography (two families plus mono for data):
- Display and stamps: **Special Elite** (typewriter).
- Body and UI: **Source Serif 4**, slightly generous line height, line length under 75 characters.
- Logs, SQL, code, timestamps only: **IBM Plex Mono**.
- Handwriting (Level 6 diary pages only): **Reenie Beanie**.

Layout:
```
+-----------+--------------------------------------------+-------------+
| CASE BOARD| WORKSPACE (document viewer / tool for the  | NOTEBOOK    |
| 10 tape   | current level)                             | + HINTS     |
| labels,   |                                            | + timer     |
| solved =  |                                            |             |
| stamped   |                                            |             |
+-----------+--------------------------------------------+-------------+
```
- Left rail: ten cassette style labels. State shown with stamps (OPEN, SEALED, CLOSED), not color alone.
- Workspace: documents sit on a desk surface as paper sheets with subtle shadow. One tool per level.
- Right drawer: team notebook (autosaved text, per team), hint ladder, event timer, evidence board (all revealed clue cards).
- Mobile: rail collapses to a top strip, drawer becomes a bottom sheet.

The one memorable moment: when a level is solved, the clue card appears covered by redaction bars that wipe away. No other decorative motion. Respect `prefers-reduced-motion` (instant reveal). Visible keyboard focus, AA contrast, responsive down to 360px.

Do not: marquee tape banners, dripping fonts, all caps eyebrow labels over every heading, gradient washes, identical rounded cards everywhere. Buttons say what they do ("Submit answer", "Open hint 1"). Errors say what is wrong and what to do.

---

## 5. Game rules

- Levels are strictly sequential. A team sees only titles for sealed levels.
- A level has one or more **stages** (for example password gate, then questions). Finishing the last stage solves the level and returns the clue card (`reveal.md` plus optional asset).
- **Attempts:** rate limit 6 submissions per minute per team per level. Wrong answers are recorded but carry no penalty.
- **Hints:** 3 tiers per level, revealed one at a time by the team. Hint use is recorded for organizers, with no penalty. Tier text lives in `hints.md`.
- **Soft cap per level:** after it passes, a "Reveal the clue" button appears. It returns the clue card and advances the team, and the level is marked **skipped** (not solved). Caps (minutes): L1 22, L2 22, L3 38, L4 30, L5 30, L6 30, L7 30, L8 30, L9 30, L10 38. Configurable.
- **Ranking, no points yet:** there is no point system in this phase (scoring is phase 2). Rank teams by levels solved (skipped levels do not count), then by earlier total elapsed time. Hint counts, wrong attempts and skips are recorded for organizers only.
- **Event clock:** organizer controls Start, Pause, Resume, End. Nothing is accepted before start or after end. A visible countdown shows the remaining time.
- **Leaderboard:** live over SSE. Show team, levels solved and elapsed time. Organizers can hide it near the end.
- Answer normalization: trim, uppercase, collapse whitespace, strip punctuation except `-`, `_`, `{`, `}`. Each stage declares accepted alternates.
- Answers are stored hashed (HMAC-SHA256 with a server secret and per level salt) in `apps/server/data/answers.hashed.json`, produced by `scripts/hash-answers.ts` from `answers.private.json`.

### Admin (hidden route `/hq`, login labelled "Emergency login")
- Import teams from CSV (team name, members, `kit_no`, generated team code and password), export credentials sheet.
- Kit answers screen and team to kit mapping (see Level 8), with a readiness check before Start.
- Start, pause, resume, end the event. Broadcast a message to all teams (SSE toast).
- Live board: every team, current level, time per level, hints used, wrong attempts.
- Manual overrides: unlock or reset a level for a team, with a reason log.
- Theory review screen: team answers beside the canonical answers (Section 11). Organizers tick correct, partial or missed per question and add notes. No points yet.
- Export final results as CSV.

---

## 5a. Clue unlock rule (important)

Every level solve unlocks a clue. This is the spine of the game.
- Solving the last stage of a level always returns that level's **clue card** from the server (`reveal.md` plus an optional asset) and stores it on the team's **Evidence Board**. Level N+1 opens at the same moment.
- A level cannot be marked solved without a clue card. `scripts/verify-content.ts` fails the build if any level lacks a `reveal.md` or a hashed answer.
- "Reveal the clue" (soft cap skip, level marked skipped) also returns the clue card, so story progress never stalls.
- The clue card appears with the redaction bar reveal and stays readable on the Evidence Board for the rest of the event.

| Level | Clue card unlocked |
|---|---|
| 1 | The clock is staged. The real window of death is 22:37 to 23:07. The archive compartment opens |
| 2 | Recording Seven's recovered line is about Julian. Elias knew something about the old death |
| 3 | The old report's time of death (20:40) is altered. Julian called Elias at 21:12. Badge 4417 signed. The officer arrived before the emergency call was logged |
| 4 | Lena's iPad deleted Recording Three at 23:52. Patient P-0912 is redacted and was edited by Elias after Julian's death |
| 5 | Four suspects lied, each for a different reason. Adrian's statement is still unchecked |
| 6 | Mira's account and the music box. Elias's final recording: someone with a hidden identity was collecting evidence |
| 7 | Adrian's alibi photo is a recycled old photo from the Marsh family's hometown. The memorial registry names Adrian as Julian's brother |
| 8 | The garage panel printout: service code entry at 21:31 by A. Cross, bypass during a maintenance window |
| 9 | The study was locked remotely at 23:08, not from inside. `LIAISON_4417` was erased from the export. Adrian is arrested |
| 10 | Rowan Hale is the accomplice. Recording Nine and Elias's last note play, and the final theory form opens |

## 6. Data model (SQLite)

```
teams(id, name, code, pass_hash, kit_no, members_json, created_at)
kits(kit_no, answer_hash, alternates_json, updated_at)
sessions(id, team_id, created_at, last_seen)
level_state(team_id, level, status, started_at, solved_at, stage_index, hints_used, wrong_attempts, skipped)
attempts(id, team_id, level, stage, answer_norm, correct, created_at)
notebook(team_id, text, updated_at)
theory(team_id, q1..q8, submitted_at, marks_json, reviewed_by)
event(id, state, started_at, paused_total_ms, ended_at, banner)
```

## 7. API

```
POST /api/auth/login            POST /api/auth/logout        GET /api/me
GET  /api/levels                (titles and states only)
GET  /api/levels/:n             (only if open or solved; no answers)
GET  /api/levels/:n/assets/*    (auth plus unlock check; streams images and sqlite)
GET  /api/levels/2/morse         (only after Level 2 is open; Morse pulse timing array)
POST /api/levels/:n/submit      { stage, answer }  ->  { correct, freeAttemptsLeft, reveal? }
POST /api/levels/:n/hint        -> next tier text, records hint use
POST /api/levels/:n/skip        -> clue card, marks the level skipped (only after soft cap)
POST /api/levels/9/check-blanks { lang, picks[] } -> per blank correct or wrong
PUT  /api/notebook              GET /api/leaderboard/stream (SSE)
POST /api/theory                (one editable submission until the event ends)
/api/admin/*                    (admin session only)
```
Never expose a level's asset URL in the sealed level payload. Use per team signed, short lived asset URLs where practical.

---

## 8. Canon facts (use exactly; every level depends on these)

Setting: London, UK. A late October night, 2026-10-23 (Friday), during British Summer Time (UTC+1). All times below are UK local time unless marked UTC. The Vane house is in Hampstead, north London (`{{place.house_area}}`).

**People:** Dr. Elias Vane (victim, psychologist). Mira Vale (former patient, silent for three years). Julian Marsh (Mira's fiancé, killed three years ago, 2023-12-02; mother Helen Marsh). Adrian Cross (assistant, the killer; Julian's half brother using his father's surname). Det. Rowan Hale (lead investigator, Adrian's accomplice, patient code P-0912, badge 4417). Lena Vane (wife). Clara Vane (sister). Daniel Reed (former patient). Noah Mercer (journalist).

**Old night (2023-12-02):** Elias was at a public dinner until about 21:15. Julian phoned Elias at 21:12 (47 seconds). Elias drove over and killed Julian. Mira was upstairs, heard Julian on the phone around a quarter past nine, later heard a door and a police radio (two short chirps and a click). Rowan arrived 22:05. The emergency call was logged 22:20. The official report says first officer badge 4417 and an estimated time of death of **20:40**, back dated by Rowan to clear Elias and frame Mira.

**Since then:** Adrian joined Elias under the Cross name and collected evidence. His tips ended up with Rowan. Six months before the murder he found Recording Nine (Rowan's confession to planting evidence) and made a deal with Rowan. Three days before the murder Elias recognised Adrian as Helen's son. He recorded a final message and, the day before his death, visited Mira and returned her music box, with the recording hidden in its base.

Canon note: Julian and Adrian's mother Helen Marsh comes from `{{geo.town}}` (default Whitby, England). The alibi photo is captioned as `{{geo.claimed_place}}` (default Southend-on-Sea seafront). The alibi photo and the memorial registry in Level 7 point to it.

**The night (2026-10-23):**
| Time | Event |
|---|---|
| 21:18 | Adrian badges out (security log: final visitor exit) |
| 21:20 to 23:50 | Maintenance window under account `LIAISON_4417`. Security logs nothing |
| about 21:30 | Adrian re enters via garage keypad using a service code |
| 21:52 | Elias's last confirmed activity (workstation input and study motion) |
| about 22:50 | Adrian kills Elias with the letter opener |
| after | Adrian smashes the desk clock and sets it to 22:17 |
| 22:21 | Adrian posts a recycled old photo (really `{{geo.place_display}}`) captioned as `{{geo.claimed_place}}` |
| 23:08 | Adrian leaves, locks the study remotely from Elias's tablet (`TABLET_API`) |
| 23:40 | Lena arrives (unlogged), unlocks with her spare key, finds the body |
| 23:52 | Lena deletes Recording Three from the archive (device `LENA_IPAD`) |
| 23:56 | Lena wipes surfaces, locks manually (`MANUAL_KEY`), leaves |
| next day | Lock export is cleaned by Adrian's script: `TABLET_API` becomes `INTERIOR_PANEL` and is shifted back 42 minutes (23:08 becomes 22:26). Rows from `LIAISON_4417` are dropped |

Medical examiner window: 22:37 to 23:07 (45 to 75 minutes after 21:52).

**Final answers (hash these):**
| Level | Answer |
|---|---|
| 1 | `2237` |
| 2 | `JULIAN` (also accept `NOT ME JULIAN`) |
| 3 | gate password `1938MANNINGHAM`; then `32-4417` |
| 4 | `LENA_IPAD-P0912` |
| 5 | `3527` (Lena E3, Daniel E5, Clara E2, Noah E7; Adrian and Mira none) |
| 6 | page order `P1,P2,P3,P4,P5,P6` |
| 7 | owner defined in `l7_geo_config.json` (place name aliases or coordinates within the radius) |
| 8 | per kit, set by the owner in the admin Kit answers screen (example: kit 2 = `67`) |
| 9 | blanks `60`, `+`, `%` then output `2308-4417` |
| 10 | `FLAG{ROWAN_HALE}` |

---

## 9. Levels

For every level: `level.json` holds title, type, estimated minutes, soft cap, stages, tool config, hint count. `story.md` is the in world setup. `reveal.md` is the clue card.

### Level 1: The Stopped Clock (log forensics)
Time 15 min. Tool: **LogViewer** (AGENT BUILDS): monospace table, filter chips per source, text search, a labelled timezone column, no code execution. Plus the team notebook.

Story: Detective Hale hands over raw logs from four systems. The desk clock says 22:17 and everyone assumes that is the time of death. The ME disagrees.

AGENT BUILDS `scripts/gen-logs.ts` to create a bundle of about 30 lines. Sources and formats:
- `SEC` (security panel): UK local time (BST), 24 hour `DD-MM HH:MM:SS`. **Clock runs 6 minutes fast.**
- `DOORBELL` (Elias's camera): UK local time (BST), 24 hour, accurate. Goes `OFFLINE` at 21:02:11 (Wi-Fi lost).
- `PC` (Elias's workstation): UTC ISO 8601. Event types `INPUT` (user activity) and `SYNC` (automatic cloud backup).
- `PHONE` (landline): 12 hour UK local time.
- `THERMO` (noise): automatic entries.

Key lines that must exist exactly (add noise lines around them):
```
DOORBELL 2026-10-23 20:41:32 FRONT_DOOR_OPEN (courier handoff)
SEC      23-10 20:47:32 FRONT_DOOR_OPEN zone=1
SEC      23-10 21:24:00 VISITOR_EXIT door=front guest_badge=07
SEC      23-10 21:58:04 STUDY_MOTION zone=4
PC       2026-10-23T20:52:07Z INPUT keyboard
PC       2026-10-23T21:35:44Z SYNC backup_complete
THERMO   2026-10-23 22:00:00 SETBACK 19C
PHONE    9:41 PM INCOMING unknown 0:52
```
ME note shown in level: "Time of death is between 45 and 75 minutes after the last confirmed activity in the study."
Note: in late October the UK is on BST (UTC+1), so converting the UTC workstation log to local time is +1 hour.

Solution: panel skew is +6 minutes (courier line). Corrected final exit is 21:18. Study motion 21:58:04 becomes 21:52:04 and matches PC input 20:52:07 UTC = 21:52:07 BST. `SYNC` (21:35:44 UTC = 22:35:44 BST) and `THERMO` are automatic and ignored. Window 22:37 to 23:07. Submit four digits `2237`.
Wrong paths the server should recognise for a nudge (still a miss): `2243` (raw panel time), `2320` (used the sync).
Reveal: "The clock is staged. The real window starts at 22:37." Also unlock the archive compartment card.
Hints: 1) Not every system agrees on what time it is. 2) One event appears in two logs. Compare them. 3) Automatic jobs are not activity.

### Level 2: Recording Seven (Morse)
Time 15 min. This is the **only audio in the whole app**, and it is generated entirely in the browser. No audio file is shipped or supplied by the owner.
Tool: **MorsePlayer** (AGENT BUILDS): Play and Replay buttons, speed 0.5x / 0.75x / 1x, and a simple animated pulse display (no dot or dash symbols shown). Sound is synthesized with the Web Audio API: each pulse is a short burst of filtered noise shaped like a tap on wood, dots short and dashes longer. Playback starts on a user click (autoplay rules). The pulse timing array (alternating on and off durations in ms, unit 220 ms) comes from `GET /api/levels/2/morse` only after Level 2 is open, so the message is never in the page bundle. The Morse chart appears only after Hint 1.

Story: Elias's hidden archive holds recordings numbered by patient code. He wiped most of them. Recording Seven is a session with Mira, who had stopped speaking. Only her answer survives: she taps on the arm of her chair. The rest of the file is corrupted until the taps are decoded. (Recordings Three and Nine appear later only as typed transcripts.)

Taps decode to **NOT ME JULIAN**. The decoded message is the level's flag. Timing: dot 1 unit, dash 3, gap inside a letter 1, gap between letters 3, gap between words 7, about 24 seconds in total.
Stages: 1) enter the decoded message (accept `JULIAN`, `NOT ME JULIAN` or `NOTMEJULIAN`). 2) On success show the recovered transcript card (typed): "ELIAS: You weren't the one who killed him." Context makes clear it is about Julian.
Reveal: "Elias knew something about Julian's death."
Hints: 1) Two tap lengths. 2) Short is a dot, long is a dash, longer pauses separate letters. 3) The last word is a name already in the case.
OWNER SUPPLIES: nothing.

### Level 3: The Old Case (fiction OSINT)
Time 25 min. Tool: **DocViewer** (AGENT BUILDS: documents as styled HTML sheets, not PDFs, with optional download).

Story: Elias's session notes for Mira list a reading assignment described only by plot: a Victorian stage thriller where a husband dims the house's gas lights and insists his wife imagined it. The notes say the work's details are the key to Julian's case file.
Stage 1 (gate): fields "Year it premiered" and "Husband's surname". Server accepts `1938` and `MANNINGHAM`, as separate inputs or the combined `1938MANNINGHAM`. Verified facts: Patrick Hamilton's *Gas Light* premiered 5 December 1938 at the Richmond Theatre; the husband is Jack Manningham.
Stage 2: after the gate, unlock documents (AGENT BUILDS, London setting, police documents styled for the UK):
- D2 Police report: emergency call logged 22:20; first officer on scene badge **4417**, arrival 22:05; estimated time of death **20:40**; Mira Vale found beside the body; signature smudged.
- D3 Julian's phone record: outgoing call to Elias at **21:12**, duration 47 seconds.
- D4 A short press clip.
Questions: "Minutes between the estimated time of death and Julian's call" (answer 32) and "Badge number of the first officer" (4417). Combined answer `32-4417`. Optional extra field: minutes the officer arrived before the emergency call was logged (15). Recorded for organizers, not scored.
Reveal: the report's time of death was altered and badge 4417 signed it.
Hints: 1) Search the plot, not a title. 2) The play gave a modern word to the language. 3) The password is the year plus the husband's surname.

### Level 4: The Patient Files (SQL)
Time 20 min. Tool: **SqlConsole** using sql.js (the only heavy client runtime). Textarea editor with line numbers, Run button (Ctrl+Enter), result table (cap 200 rows), schema browser, query history, error messages shown plainly. Read only intent: reject `ATTACH`, `PRAGMA` writes and `.load` style input.

AGENT BUILDS `scripts/build-sql-level.ts` (using better-sqlite3) that creates `level4.sqlite` with about 40 rows. The file is served through the asset route only after unlock, fetched as an ArrayBuffer and opened with sql.js.
Schema:
```
patients(patient_code, display_name)
records(record_id, patient_code, session_date, recording_ref, last_edited_at, edited_by)
access_log(log_id, user_id, device, action, target_record, ts)
```
Required rows:
- `P-0912` has display_name `REDACTED`. Its record was edited by `elias` on 2023-12-05 (three days after Julian's death).
- Mira's record (P-0101) edited by `elias` on 2023-12-04 (decoy: not redacted).
- Lena's record `R-0003` with `recording_ref = 'REC-3'`.
- `access_log`: one DELETE on `R-0003` at `2026-10-23 23:52:11`, device `LENA_IPAD`, user `lena.v`. Other DELETEs exist on other dates by `elias` (decoys). A few harmless EDITs by `archive_admin` (Adrian) in the past.
Questions: Q1 which device deleted a record on the night of the murder. Q2 which patient code with a redacted name was edited by Elias in the week after 2023-12-02. Answer `LENA_IPAD-P0912` (accept `LENA_IPAD` and `P-0912` as separate fields too).
Reveal: Lena deleted a recording that night. Patient P-0912 is flagged.
Hints: 1) Filter `access_log` by `action`. 2) The night of the murder is one date. 3) For Q2, the redacted name is the clue.

### Level 5: Contradictions (evidence matching)
Time 20 min. Tool: **MatchBoard**: five spoken statements plus Mira's written note on the left, nine evidence cards on the right. Each row has a dropdown (E1 to E9 or "No contradiction").
AGENT BUILDS the statements in distinct voices and the evidence documents:

| Person | Statement | Broken by |
|---|---|---|
| Lena | "I was at the charity dinner until midnight, then straight home." | **E3** parking exit receipt 22:58 plus a neighbour's doorbell camera showing her car outside the house at 23:38 |
| Daniel | "I haven't been near Elias since my angry email months ago." | **E5** a text from Daniel two days before: "this isn't over" |
| Clara | "We barely spoke for months." | **E2** café and card receipts, four meetings |
| Noah | "I never went near that house." | **E7** ride receipt dropping him one block away at 21:00 |
| Adrian | "I left at 9:18 and was across the city at 10:21. Here's my photo." | none yet |
| Mira | (note) "Nothing I say will count." | none |

Decoys: E1 clock photos, E4 Adrian's alibi photo, E6 Elias's calendar, E8 ME report summary, E9 Recording Three transcript (explains why Lena wanted it destroyed).
Server answer: Lena=E3, Daniel=E5, Clara=E2, Noah=E7, Adrian=none, Mira=none. Display code `3527`. Feedback for a wrong board: number of correct rows only.
Reveal: four suspects lied for different reasons.
Hints: 1) Each lie is broken by exactly one item. 2) Start with the statement that contains a time. 3) One statement is not broken yet. Do not force it.

### Level 6: Mira's Silence (diary reconstruction)
Time 20 min. Tool: **DiaryTable**: six handwritten style pages (Reenie Beanie on paper texture) shown shuffled, reorderable by drag and drop and by up/down buttons for keyboard users.

Story: Elias had Mira keep a diary as a therapy exercise. Pages are out of order and have few dates. Mira has not spoken in three years because she believes nobody will take her account over Elias's. Reading her pages in the order she wrote them is what shows she was telling the truth, and she agrees to talk.
AGENT BUILDS six pages (about 80 words each) with internal time anchors so exactly one order works:
- P1 "the night after": Julian was on the phone around quarter past nine, shouting Elias's name, alive. Much later she heard a door and a radio, two quick chirps and a click, before the police were called.
- P2 "the morning of the funeral": the report says before nine; she keeps saying it is wrong.
- P3 "three days after the funeral": Elias says her times do not fit the report and her memory is mixing things up.
- P4 "the Sunday after": Elias asks her to stop writing things down.
- P5 "the day after Elias said stop": she hides the diary and the music box Julian gave her.
- P6 "the first day I did not speak": she decides not to explain herself again.
Server answer: chronological order `P1,P2,P3,P4,P5,P6`. UI uses neutral shuffled labels, not P-numbers.
On success unlock Mira's statement (typed transcript card, no audio). Mira's lines (first words in three years): "You read it in the order I wrote it. Elias always told me I had it jumbled." Then: "He came the day before he died. He brought my music box back and said he'd had it repaired. It doesn't play. I haven't touched it."
Then show a **MusicBox** card (illustration, AGENT BUILDS as SVG) with an "Open the base" button that reveals Elias's final recording (typed transcript card, no audio): "If you're hearing this, something has gone wrong. Three days ago I realised who my assistant really is. He used his father's name. I should have known Helen's son by his eyes the day he walked in."
Reveal: Elias knew someone with a hidden identity was collecting evidence on him. It is not Lena.
Hints: 1) Look for phrases like "the morning of" and "the day after". 2) Dates are not all written down. Use the references between pages. 3) The funeral comes before Elias's request to stop writing.
OWNER SUPPLIES: nothing (typed transcripts only).

### Level 7: The Perfect Alibi (geolocation, owner supplied)
Time 20 min. Tool: **PhotoViewer** (zoom, pan, no download button, no metadata) plus an answer form. The photo and the accepted answers come from the owner. Nothing about the place is hardcoded; everything is read from `content/assets-private/l7_geo_config.json` and the story text uses the variables below.

Story (AGENT BUILDS with variables): Adrian's alibi is a photo posted at 22:21 and captioned `{{geo.claimed_place}}` ("Southend-on-Sea seafront"). It is really an old photo from `{{geo.place_display}}`, the Marsh family's hometown, reposted to fake his location. The team has reason to doubt him after Mira's account and Elias's recording.
Task: find where the photo was really taken.

OWNER SUPPLIES:
- `images/l7_geo_photo.jpg`: EXIF stripped, random file name. Crop out any watermark or UI.
- `l7_geo_config.json`:
```
{
  "place_display": "West Cliff, Whitby, England",
  "town": "Whitby",
  "country": "United Kingdom",
  "claimed_place": "Southend-on-Sea seafront",
  "accepted_names": ["whitby", "whitby england", "whitby north yorkshire", "west cliff whitby", "whalebone arch"],
  "center": { "lat": 0.0, "lng": 0.0 },
  "radius_m": 1000,
  "attribution": "Photo: <credit or 'own photo'>",
  "reveal_text": "(optional override of the default reveal)",
  "registry_text": "(optional override of the memorial registry line)"
}
```
Validation: a player may answer with a place name or with `lat,lng`. A name is correct if it matches any `accepted_names` entry after normalization (lowercase, strip punctuation and extra words like "the"). Coordinates are correct if within `radius_m` of `center` (haversine). The radius default is 1000 m so a town level answer is fair for a foreign location. Show attribution in a small caption on the level page if one is provided.

On success unlock the **Memorial registry** page (AGENT BUILDS, clearly fictional, variables resolved): "In memory of Julian Marsh. Placed by his mother Helen and his brother Adrian. {{geo.place_display}}." Optionally add the town name to Helen's line in the case notes.
Reveal: the photo is not from the claimed place and could not have been taken tonight. It is the Marsh family's hometown, which proves Adrian lied and that he is Julian's brother.
Hints (AGENT BUILDS defaults, owner can override): 1) Compare the photo with the place Adrian claimed. 2) Signs, architecture and the coastline narrow the country first. 3) Reverse image search will not find this exact frame. Look for the landmarks in the background.

Recommended places (UK, to match the names and the London setting; owner decides):
1. **Whitby, North Yorkshire, England (recommended).** West Cliff has the Whalebone Arch (first erected 1853, the current one from 2003), the Captain Cook monument with plaques in People's Park, and benches on the grass either side. From there the view crosses the harbour to the ruined Whitby Abbey and the 199 steps, which inspired Bram Stoker's Dracula. Gothic, misty and quiet, which suits the story, and recognisable enough for a team to solve in 20 minutes. To make it less trivial, avoid the famous frame of the arch around the abbey. Use a bench, the harbour and the 199 steps, or the monument from the side.
2. **Greenwich, London:** the Thames Path by the Cutty Sark with the Old Royal Naval College behind. Use this if you want the photo in London itself; then set `reveal_text` to say it was taken minutes from the Vane house instead of the Marsh family's hometown.
3. **Edinburgh, Scotland:** Calton Hill with the unfinished National Monument and the skyline behind.
Check the owner's photo source licence before using it. If the image is from Mapillary it is CC BY-SA 4.0 and needs attribution. Always test the final frame in a reverse image search and make sure it is not easy to find.

### Level 8: The Garage Panel (physical DE kit station)
Time 20 min. This level is **physical and offline**. The owner hands each team a digital electronics kit and a printed task sheet. There is no circuit simulation, no schematic generation and no toggle UI in the platform.

Story: the garage keypad runs on its own relay logic and keeps a local memory. Elias's maintenance manual sits on the team's table next to the kit. The team builds or reads the circuit on the kit, and the result they read off it is the answer.

Platform part (AGENT BUILDS) is the **KitStation** page:
- Story text, the line "Your kit: **Kit #N**" (from `teams.kit_no`), and one answer field: "Enter the value you read from your kit". Normal attempt, hint and soft cap rules apply.
- An optional printable task sheet template (HTML with print CSS): story header, kit number box, and a blank body. The owner pastes the real kit task into the body. No generated content for the task itself.

Validation (per kit, so neighbouring teams cannot share answers):
- Table `kits(kit_no, answer_hash, alternates_json, updated_at)`. On submit the server finds the team's `kit_no` and compares the normalized answer to that kit's hash (or any alternate).
- Example: kit 2 answer `67`.
- Teams are assigned to kits through a `kit_no` column in the team CSV or in the admin screen. An admin can reassign a team to another kit live (for example if a kit breaks).

Admin additions (AGENT BUILDS):
- **Kit answers screen:** list kits, enter or replace an answer and its alternates. The answer is hashed on save and not shown again.
- **Readiness check:** warn if a team has no kit or a kit has no answer. Starting the event requires an explicit override if anything is missing.
- Seed demo kits with obviously fake answers (`CHANGE_ME_1`, `CHANGE_ME_2`, ...) and list "set real kit answers" in `MISSING_ASSETS.md`.

OWNER SUPPLIES (after the build): the physical kits, the printed task sheets, and each kit's real answer entered through the admin screen.
Hints: owner written. Create placeholder `hints.md` with three lines marked `OWNER TO FILL`.
Reveal (AGENT BUILDS): the garage panel printout card: a service code entry at 21:31, code owner A. Cross, and "the panel stays in bypass while a maintenance window is open".

### Level 9: The Locked Room (code debugging, no log given)
Time 20 min. Tool: **CodeFill**: a read only code view with line numbers and language tabs (Python, Java, C++). No execution. Three blanks shown as dropdowns inside the code. A final field for the program's printed output.

Story: Forensics recovered a script from Adrian's work laptop that forged the lock export. The technician began turning it into a restore tool but it is broken. The only forged row in the export is `22:26 LOCK INTERIOR_PANEL`. Fix the tool, work out what it prints.
Python variant (AGENT BUILDS the Java and C++ equivalents with the same logic):
```
SHIFT_MIN = 42
DROPPED_SOURCE = "LIAISON_4417"
forged = "22:26"              # the only INTERIOR_PANEL row in the export

hour, minute = forged.split(":")
total = int(hour) * ____ + int(minute)        # blank 1
total = total ____ SHIFT_MIN                   # blank 2
real_hour = total // 60
real_minute = total ____ 60                    # blank 3
print(f"{real_hour:02d}{real_minute:02d}-{DROPPED_SOURCE[-4:]}")
```
Blanks (options per language, same correct index):
| Blank | Options (Python) | Correct |
|---|---|---|
| 1 | `24`, `60`, `100`, `3600` | `60` |
| 2 | `+`, `-`, `*`, `//` | `+` (undo the backwards shift; the tech copied the minus from Adrian's code) |
| 3 | `//`, `%`, `/`, `**` | `%` |
Java and C++ use `/` and `%` appropriately, so provide their own option lists, e.g. blank 3: `/`, `%`, `*`, `&`.
Stages: 1) `POST /api/levels/9/check-blanks` returns per blank correct or wrong, no hint about the right option. 2) Output field expects `2308-4417` (22*60+26=1346, +42=1388, 23:08, plus the last four characters of `LIAISON_4417`).
Reveal: the study was locked remotely at 23:08, not from inside, and an account `LIAISON_4417` was erased from the export. Adrian is arrested (story card).
Hints: 1) Read what each line does before you pick. 2) The forgery moved the time backwards. 3) Minutes left over after dividing into hours use the remainder operator.

### Level 10: The Accomplice (club OSINT, built by the owner)
Time 25 min. The platform only provides the story scene and the flag form. The OSINT content lives on the owner's club members' public profiles.
Story (AGENT BUILDS the scene text, plus an `adrian_confession` transcript): Rowan arrests Adrian and asks to question him alone. The team insists on being present. Adrian talks: he did not clean the log or schedule the maintenance window. "Ask who requested it. And ask who signed Julian's report." The team must find who sits behind liaison 4417.
Owner builds: each club member's LinkedIn or Instagram holds a base64 string that decodes to a short URL. Each URL opens a QR image. Only the target member's QR yields the flag. Decoys lead to harmless images. A clue containing "4417" points players to the right profile.
Validation: flag `FLAG{ROWAN_HALE}`.
Reveal: Rowan Hale is the accomplice. Then show the Recording Nine transcript (Rowan's confession as patient P-0912, typed, no audio) and Elias's last note, and unlock the final theory form.
Hints: 1) The clue contains a number. Look for it in profile bios. 2) Decode the string with any base64 decoder. 3) The decoded text is a link, not a message.
OWNER SUPPLIES: no audio. Everything on the social profiles and QR hosting is the owner's job, not part of the build.

---

## 10. Final theory (after level 10)

Form with 8 long text answers, editable until the event ends, autosaved. Questions:
1. Who killed Dr. Elias Vane?
2. What happened during the confrontation?
3. Why was the 22:17 clock important?
4. What really happened to Julian three years earlier?
5. Why did Mira stop speaking?
6. Why did Lena alter the crime scene?
7. Why did Adrian hide his connection to Elias?
8. What does Elias's final note imply about Detective Rowan Hale?

## 11. Canonical theory answers (shown only on the admin review screen)

Marking: no points yet (scoring is phase 2). Organizers tick correct, partial or missed per question.
1. Adrian Cross.
2. He re entered through the garage during the unlogged maintenance window, confronted Elias about Julian and the falsified records, it turned violent and he killed him with the letter opener around 22:50.
3. Adrian staged it after the killing to fake the time of death and line it up with his alibi photo at 22:21.
4. Julian discovered Elias's falsified records. Elias killed him. Rowan back dated the time of death to 20:40 to clear Elias and steered the case toward Mira.
5. Elias convinced her that her memory could not be trusted, so anything she said would be dismissed.
6. She found the body, feared her own secret (Recording Three, a falsified record she signed) would come out, deleted it, wiped the room, relocked the door and lied.
7. He is Julian's half brother using his father's surname, so he could get close to Elias and collect evidence.
8. Rowan already knew the killer because he was Adrian's accomplice. He opened the maintenance window, had the lock export cleaned and steered suspicion toward Lena, to bury Recording Nine and his own confession.
Elias's final note (shown after level 10): "The person investigating my death already knows who killed me." It is filed under Rowan Hale's name.

---

## 12. Assets: who provides what

### OWNER SUPPLIES (agent cannot produce these; create placeholders and list in `MISSING_ASSETS.md`)
| File or action | Level | Notes |
|---|---|---|
| `images/l7_geo_photo.jpg` and `l7_geo_config.json` | 7 | Photo plus accepted names, center, radius, place text. See Level 7 |
| Kit answers (admin screen, after the build) and printed task sheets | 8 | One answer per kit number. See Level 8 |
| Club member profiles, base64 strings, QR images and their hosting | 10 | Done outside the platform |
| `images/logo.svg` | all | Optional club or event logo |

There are **no audio files to supply**. The only sound in the app is the Level 2 Morse recording, synthesized in the browser. Every other recording in the story is a typed transcript card.

Outside the platform (owner only): the club members' social profiles, base64 strings, QR images and their hosting (Level 10); the physical DE kits, their task sheets and per kit answers (Level 8); hosting, domain and the team list CSV.

### AGENT BUILDS (no input needed)
Log bundle (L1), Morse pulse data and the Web Audio player (L2), all HTML documents, typed transcripts, statements, evidence cards and the memorial registry (L3, L5, L6, L7, L10), `level4.sqlite` (L4), diary pages and music box SVG (L6), code variants (L9), all hints, clue cards, theme and fonts, seed demo teams, admin tools.

---

## 13. Security and anti cheat checklist
- No answers, hashes or solution text in any client bundle. Disable source maps in production.
- Sealed level payloads and assets return 403, not 404, to teams without access.
- Per team asset URLs are signed and short lived. The SQLite file and the Level 2 pulse data are never listed in the HTML.
- Rate limits on login, submit and hint endpoints. Lock a team out of a level for 60 seconds after 10 wrong answers.
- Log every submission with timestamp for dispute handling.
- `helmet` with a strict CSP (no external origins). Hash the admin password. CSRF safe cookies (`SameSite=Lax`, POST only mutations).
- Notebook text is plain text, escaped on render.

## 14. Acceptance criteria
0. Every level solve (and every "Reveal the clue") returns its clue card and adds it to the Evidence Board.
1. A fresh team can log in, solve levels 1 to 10 in order with the correct answers, and see each clue card with the redaction reveal.
2. A team cannot fetch level N+1 content or assets by guessing URLs.
3. Level 4 runs entirely in the browser with sql.js and a local WASM file, offline.
4. Level 9 never runs code. Blank checks and output checks are server side.
5. Admin can start, pause, broadcast, override, grade theories, set kit answers, map teams to kits and export results. Level 8 validates each team against its own kit's answer.
6. Renaming a character or the event in `event.config.json` and `characters.json` updates all UI text and styling stays consistent.
7. Playwright test runs the full happy path. Vitest covers normalization, ranking and the Level 5 match logic.
8. Works at 360px width, keyboard operable, reduced motion respected.
9. The build contains no audio files. Level 2 sound plays from Web Audio only. There is no scoring code, only ranking by levels solved and elapsed time.

## 15. Build order
1. Repo, tokens, fonts, layout shell, auth, event clock, admin team import.
2. Level engine (stages, attempts, hints, skip, ranking, SSE leaderboard, answer hashing script).
3. Level tools in this order: LogViewer (1), MorsePlayer (2), DocViewer (3), SqlConsole (4), MatchBoard (5), DiaryTable and MusicBox (6), PhotoViewer (7), KitStation (8), CodeFill (9), flag form (10).
4. Content generators and placeholders, `MISSING_ASSETS.md`.
5. Theory form and grading screen.
6. Hardening, tests, Docker, seed demo data, README with an organizer runbook.
7. Phase 2 (not now): a points and scoring layer. The attempt, hint, skip and timing records above are enough to build it later.

---

## 16. Kickoff prompt (paste this to Claude Code, with this file in the repo root)

> Read `MURDER_MYSTERY_BUILD_SPEC.md` fully before writing code. Build the Murder Mystery event platform exactly as specified: React + Vite + TypeScript frontend, Express + better-sqlite3 backend, sql.js for Level 4 only, no code execution on the client, everything self hosted, all validation server side with hashed answers. Follow the theme tokens and the build order in Sections 4 and 15. Generate everything marked AGENT BUILDS. For every OWNER SUPPLIES file, create a placeholder, wire the path, and list it in `MISSING_ASSETS.md`. Do not invent real audio, photos or kit answers. Work milestone by milestone, run the tests after each, and stop to ask me only if the spec is contradictory or something marked OWNER SUPPLIES blocks you. When done, give me a runbook for the event day.
