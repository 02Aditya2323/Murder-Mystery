# MURDER MYSTERY
### Official Technical Platform for the Flagship Murder Mystery Event by E-CESA Council

[![Live Deployment](https://img.shields.io/badge/Live%20Platform-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://murder-mystery-ou5x.onrender.com/)
[![Event](https://img.shields.io/badge/Conducted%20By-ECESA%20Council-blue?style=for-the-badge)](https://murder-mystery-ou5x.onrender.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React%2018-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js%2022-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![SQLite WASM](https://img.shields.io/badge/SQLite%20WASM-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sql.js.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

> **Live Production URL**: [https://murder-mystery-ou5x.onrender.com/](https://murder-mystery-ou5x.onrender.com/)  
> **Event**: Official Murder Mystery Tournament 
> **Refer the Build spec at [BUILD_SPEC.md](MURDER_MYSTERY_BUILD_SPEC.md)**
---

## Executive Summary & Event Context

**MURDER MYSTERY** is a production-grade, full-stack digital forensics and mystery-solving platform engineered specifically for a high-intensity, 6-hour competitive forensic hackathon conducted formally by the **ECESA Council**. 

Designed to support **60+ concurrent investigator squads** (3–4 participants per team) operating under strict timed pressure, the platform bridges **programming, digital cybersecurity forensics** with **physical digital electronics hardware breadboards**. Rather than a trivial quiz or point-and-click escape room, teams operate a simulated law enforcement workstation (**Case File: `CASE-2026-2310`**), analyzing corrupted server logs, decoding Morse telegraphy via Web Audio synthesis, querying forensic SQLite databases via client-side WebAssembly, corroborating witness statements, and reverse-engineering embedded hardware registers to construct a formal legal prosecution brief.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HYBRID TOURNAMENT SYSTEM                        │
│                                                                        │
│   ┌─────────────────────┐                    ┌─────────────────────┐   │
│   │   PHYSICAL WORLD    │                    │    DIGITAL WORLD    │   │
│   │ ─────────────────── │                    │ ─────────────────── │   │
│   │ • 8 Hardware Kits   │                    │ • Real-time SSE Hub │   │
│   │ • Logic Gate Arrays │◄───[Synced Clock]─►│ • In-Browser WASM   │   │
│   │ • 7-Segment Displays│                    │ • Zero-Knowledge API│   │
│   │ • Physical Clue Slips│                   │ • Case Rail Dossier │   │
│   └─────────────────────┘                    └─────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Key Technical & Architectural Highlights

### 1. In-Browser SQL Forensics via WebAssembly (`sql.js`)
* **Zero Backend Database Overhead**: For Level 4 (*The Patient Files*), investigators must query an erased hospital audit log. Instead of executing arbitrary SQL on a shared backend container, the application delivers an isolated, pre-compiled SQLite database directly into browser memory via **WebAssembly (`sql.js`)**.
* **Sandboxed Security**: Completely eliminates remote code execution (RCE) and SQL injection attack vectors on the server while offering zero-latency query execution under crowded auditorium Wi-Fi conditions.

### 2. Multi-Kit Anti-Cheat & Anti-Collusion Engine (`k1`–`k8`)
* **Real-World Live Venue Resilience**: In high-density auditoriums where adjacent teams sit in close proximity, answer sharing is a major concern. The platform features an automated generator pipeline (`scripts/gen-variants.mjs`) that generates **8 distinct hardware/software tracks (`k1` through `k8`)**.
* **Parametric Variance**: 
  * *Beat 1 (Log Analysis)*: Distinct clock skews and time windows per kit.
  * *Beat 4 (Database Forensics)*: Different client devices and scrubbed patient IDs.
  * *Beat 8 (Digital Electronics)*: Individualized physical logic wiring configurations and binary pinouts.
  * *Beat 9 (Code Reversal)*: Divergent timestamp offsets and modulo bounds.
* **Cryptographic Salting**: All answers are validated against salted `HMAC-SHA256` digests, ensuring zero plaintext solutions exist in client bundles or network payloads.

### 3. Real-Time Event Synchronization via Server-Sent Events (SSE)
* **Persistent Event Bus**: A lightweight SSE stream (`/api/events/stream`) maintains real-time synchronization across all team consoles.
* **Global Countdown & State Transitions**: Organizers control event phases (`NOT_STARTED`, `RUNNING`, `PAUSED`, `ENDED`) from a central HQ console with microsecond synchronization.
* **Classified Leaderboards & Broadcast Toasts**: Organizers can push live administrative announcements, hint broadcasts, or toggle the leaderboard to "Classified" mode during the final 30 minutes to escalate tournament suspense.

### 4. Progress-Gated Zero-Knowledge Architecture
* **Strict Server-Side Gating**: A team cannot view future cases, character dossiers, timeline beats, or glossary terms by inspecting React state or network traffic. 
* Unearned evidence cards, autopsy reports, and audio feeds respond with `403 Forbidden` until the prerequisite level state transitions to `SOLVED` in the SQLite persistence store (`better-sqlite3`).

### 5. Custom Web Audio API Acoustic Synthesizer
* **Morse Telemetry Engine**: Built-in procedural audio engine generating precision carrier-wave pulses (sine-wave oscillator at 750 Hz) with dynamic gain envelope shaping, calibrated dot-dash spacing, and real-time audio playback without external media server bandwidth demands.

### 6. Zero Runtime CDN Dependencies
* Designed specifically for constrained venue networks. All web fonts (`@fontsource/space-grotesk`, `@fontsource/jetbrains-mono`), SVG evidence renders, audio files, and WASM binaries are self-hosted and bundled into a lean multi-stage Docker container.

---

## The 10 Forensic Investigation Stages

Teams investigate the suspicious demise of **Dr. Elias Vane** and the historical **Julian Marsh** case across 10 progressive investigative disciplines:

| Stage | Title | Forensic Discipline & Tool | Core Investigative Challenge |
|:---:|:---|:---|:---|
| **01** | **The Stopped Clock** | Log Forensics (`LogViewer`) | Reconcile asynchronous biometric server logs across multiple devices to determine true time of death and prove the scene clock was tampered with. |
| **02** | **Recording Seven** | Acoustic Analysis (`MorsePlayer`) | Decode cryptic rhythmic chair tapping in audio interrogation archives via Morse telegraphy rules. |
| **03** | **The Old Case** | Literature OSINT & Discrepancies | Interrogate historical cold case archives using literary cross-references and forensic document ID validation. |
| **04** | **The Patient Files** | In-Browser SQL (`SqlConsole`) | Execute offline SQL queries on audit databases to expose the device and timestamp of scrubbed medical records. |
| **05** | **Contradictions** | Deposition Cross-Examination (`MatchBoard`) | Cross-examine 5 witness depositions against 9 physical evidence items to expose contradictions and fabricated alibis. |
| **06** | **Mira's Silence** | Chronological Reconstruction (`DiaryTable`) | Reconstruct shredded, out-of-sequence personal journal entries based on linguistic analysis and timeline cues. |
| **07** | **The Perfect Alibi** | Geolocation OSINT (`PhotoViewer`) | Identify the true geographic coordinates of an alibi photograph with stripped EXIF metadata using coastal topography. |
| **08** | **The Garage Panel** | Digital Hardware Electronics (`KitStation`) | Decode physical breadboard logic gates, shift registers, and bus configurations assigned to the team's physical kit. |
| **09** | **The Locked Room** | Code Analysis & Reversal (`CodeFill`) | Reverse-engineer an obfuscated security lock timing script to compute the true entry PIN. |
| **10** | **The Accomplice & Case Theory** | Flag Discovery & Judicial Brief (`FlagForm`) | Extract cryptographic OSINT flags and submit a multi-point legal **Theory of the Prosecution** detailing motive, mechanism, and conspiracy. |

---

## Case Dossier & Investigator Interface

The web interface is structured around a streamlined, authentic forensic terminal:

```
┌────────────────────────────────────────────────────────────────────────┐
│ [CASE-2026-2310]  THE LAST RECORDING             [02:41:19] [HQ / SQUAD]
├──────────────────────┬─────────────────────────────────────────────────┤
│ CASE RAIL (Progress) │ CURRENT INVESTIGATION WORKSPACE                 │
│                      │                                                 │
│ • Case 01: [SOLVED]  │ ── Level Briefing & Evidence Inspect ────────── │
│ • Case 02: [SOLVED]  │ [Log Analysis / SQL Console / Audio Player]     │
│ • Case 03: [ACTIVE]  │                                                 │
│ • Case 04: [SEALED]  │                                                 │
│ • Case 05: [SEALED]  │                                                 │
│                      │ ── Answer Submission Terminal ───────────────── │
│ DOSSIER DRAWERS:     │ [ Input Solution ]  [ Submit Analysis ]        │
│ 📁 Cast Profiles     ├─────────────────────────────────────────────────┤
│ 📁 Evidence Cards    │ Forensic Hint System (Staged Penalty Reveals)   │
│ 📁 Global Timeline   │ • Hint 1 (1m)  • Hint 2 (3m)  • Hint 3 (5m)     │
└──────────────────────┴─────────────────────────────────────────────────┘
```

* **Interactive Case Rail (`CaseRail.tsx`)**: Replaces linear level jumping with progressive investigative beats (`arrive`, `belief`, `board changes`, `openQuestion`).
* **Dynamic Cast & Character Sheets (`PersonSheet.tsx`)**: Profiles unfold dynamically; suspects are tagged as *Introduced*, *Witness*, *Suspect*, or *Implicated* as corroborating evidence is uncovered.
* **Evidence Cards Vault (`EvidenceUnlocked.tsx`)**: Forensic clue cards unlock automatically with markdown analysis sheets, downloadable transcripts, and high-res imagery.

---

## Organizer Command HQ (`/hq`)

A dedicated administrative operations center equipped with real-time tournament supervision:

* **Real-time Event Clock Control**: Start, pause, resume, and extend the countdown clock with instant broadcast over SSE.
* **Squad Roster & Batch Import**: One-click CSV roster import (`name,code,password,kit_no,members`) generating printable credentials slips.
* **Per-Kit Answer Verification**: Live inspection of canonical solutions for all 8 physical/digital variants.
* **Manual Forensic Overrides**: Audited manual level unlocking and resets in case of physical breadboard component faults.
* **Prosecution Theory Grading Console**: Side-by-side examiner evaluation interface with rubric marking (`Correct`, `Partial`, `Missed`) and automated scoring.
* **CSV Results Export**: Comprehensive post-event standing reports including timestamps, hints consumed, penalty scores, and final ranks.

---

## Tech Stack Overview

| Layer | Technologies |
|:---|:---|
| **Frontend Client** | React 18, TypeScript, Tailwind CSS, `@dnd-kit` (drag-and-drop), `lucide-react`, `canvas-confetti`, `remark-gfm` |
| **Client-Side Engine** | WebAssembly (`sql.js` SQLite runtime), Web Audio API (Morse oscillator), HTML5 Canvas |
| **Backend Service** | Node.js (v20+ / v22 LTS), Express, TypeScript, `better-sqlite3`, Server-Sent Events (SSE) |
| **Cryptography & Auth** | HMAC-SHA256 salted hashing, HTTP-only signed session cookies, sliding-window rate limiters |
| **DevOps & Infrastructure** | Docker (multi-stage alpine build), Render Cloud (`render.yaml`), Health Check automation |
| **Testing & CI** | Vitest (full 10-level automated happy-path & security suites), Playwright E2E, verification scripts |

---

## Project Structure

```
murder-mystery-platform/
├── apps/
│   ├── server/                     # Express API & SSE backend
│   │   ├── src/
│   │   │   ├── routes/             # Authentication, case, levels, HQ, SSE
│   │   │   ├── auth.ts             # Session & squad auth middleware
│   │   │   ├── db.ts               # SQLite schema & query handlers
│   │   │   ├── event-clock.ts      # Synchronized tournament timer state
│   │   │   └── sse.ts              # Real-time event broadcasting
│   │   └── data/                   # Server SQLite database & hashed answers
│   └── web/                        # React 18 SPA
│       └── src/
│           ├── components/         # Interactive tools (SQL console, Morse, Logs)
│           │   └── case/           # CaseRail, EvidenceUnlocked, PersonSheet
│           ├── pages/              # Landing, EnterPage, CaseRoom, HQ Dashboard
│           └── theme/              # Custom design system & typography tokens
├── content/                        # Narrative bible, cast, scenes & variants
│   ├── cast.json                   # Character profiles and disclosure thresholds
│   ├── scenes.json                 # Beat-by-beat narrative arcs
│   ├── kits.json                   # Physical hardware kit configurations
│   ├── variants.json               # Seeded parameters for kits 1..8
│   └── levels/                     # 10 investigation stages (briefs, hints, reveals)
├── scripts/                        # Automated toolchains & verification
│   ├── gen-variants.mjs            # Anti-cheat multi-kit variant generator
│   ├── build-sql-level.mjs         # Level 4 SQLite WASM database builder
│   ├── hash-answers.mjs            # HMAC-SHA256 secret salter
│   ├── verify-case.mjs             # End-to-end case verification runner
│   └── gen-answer-key-pdf.mjs      # Organizer answer key PDF exporter
├── tests/                          # Automated Vitest test suites
│   ├── happy-path.test.ts          # Complete 10-level tournament play-through
│   └── validation-and-ranking.test.ts # Rate limiting, auth & hashing tests
├── Dockerfile                      # Production multi-stage container
├── render.yaml                     # Render Infrastructure as Code blueprint
└── package.json                    # Monorepo workspace configuration
```

---

## Local Development & Setup

### Prerequisites
* **Node.js**: `v20.x` or `v22.x` LTS
* **npm**: `v10.x` or higher

### Installation & Initialization

```bash
# 1. Clone repository
git clone https://github.com/02Aditya2323/Murder-Mystery.git
cd Murder-Mystery

# 2. Install dependencies across all monorepo workspaces
npm install

# 3. Generate SQLite databases, logs, and cryptographic answer hashes
npm run generate-assets

# 4. Generate multi-kit variants (kits 1..8)
npm run gen-variants

# 5. Run test suite to verify end-to-end game engine integrity
npm test

# 6. Launch full-stack development environment (API on :3000, Web on :5173)
npm run dev
```

### Production Build & Single-Process Run

```bash
# Compile TypeScript, bundle web assets, and package for production
npm run build

# Start unified Node.js server serving both API, SSE, and static SPA
npm start
```
The server will bind to `http://localhost:3000`.

### Docker Deployment

```bash
# Build and run containerized service
docker-compose up --build -d
```
Access the application at `http://localhost:3000`.

---

## Cloud Deployment (Render Blueprint)

The repository includes a production-ready Render Blueprint specification (`render.yaml`).

1. Link your GitHub repository to **Render**.
2. Deploy as a **Web Service** using the Node runtime:
   * **Build Command**: `npm ci && npm run build`
   * **Start Command**: `npm start`
   * **Health Check Path**: `/api/health`
3. Configure the following environment variables:
   * `NODE_ENV`: `production`
   * `ADMIN_PASSWORD`: Custom master passphrase for `/hq` organizer access.
   * `ANSWER_SECRET`: Cryptographic salt for answer HMAC generation.
   * `SESSION_SECRET`: Key for signing authentication session cookies.

---

## Default Organizer & Demo Squad Credentials

For evaluation and demonstration purposes, the database initializes with the following demo credentials:

* **Organizer HQ**: Navigate to `/hq`  
  * Master Password: `malabarhill2026` (configurable via `ADMIN_PASSWORD`)
* **Squad Credentials**:
  * Squad: `Colaba Division` • Code: `COLABA` • Pass: `ridgeroad` • Kit #1
  * Squad: `Malabar Hill Watch` • Code: `MALABAR` • Pass: `ridgeroad` • Kit #2
  * Squad: `Crawford Market Irregulars` • Code: `CRAWFORD` • Pass: `ridgeroad` • Kit #3

---

## Credits & Event Acknowledgments

* **Conducted by**: **ECESA Council** 
* **Occasion**: **Abhiyantriki 2026** Flagship Murder Mystery Event.
* **Engineering & Platform Architecture**: Custom-built with modern web standards, WebAssembly, and hardware integration.
