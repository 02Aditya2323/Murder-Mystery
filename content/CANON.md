# THE LAST RECORDING — Canon

**Organisers only. This file contains every answer. Do not open it on a shared screen.**

This is the single source of truth for Murder Mystery Chapter Two (E-CESA, Abhiyantriki 2026).
Where this document and anything else disagree — the 2025 repo, `MURDER_MYSTERY_BUILD_SPEC.md`,
an older draft of the story, a comment in the code — **this document wins.**

---

## 0. Relationship to Chapter One

Chapter One (*Murder in the Lab*, Abhiyantriki 2025) is **not canon here.** No character,
location, institution or clue carries over. Rohan Mehta, Sameer Iyer and the E-CESA lab case
are not referenced and must not be referenced. A team that never played Chapter One is at no
disadvantage whatsoever, and a team that did gets no head start.

The only inheritance is structural: a technical case solved by a team against a clock.

---

## 1. Settings that are fixed

| | |
|---|---|
| City | Bombay / Mumbai |
| Timezone | **IST (UTC+5:30)** — every local system in the story, with one deliberate exception below |
| Murder | Friday **23 October 2026**, Vane residence, Ridge Road, Malabar Hill |
| Earlier death | Saturday **2 December 2023** |
| Force | Mumbai Police, Crime Branch (Homicide) |
| Emergency line | **112** |
| Telephone records | MTNL toll record |
| Press | *The Peninsula Gazette* (fictional) |
| Case reference | MUM/HOM/2026/2310 |
| Weapon | **An antique letter opener**, taken from the stand on the desk and never recovered |

**On the names.** The cast keeps its English surnames (Vane, Marsh, Cross, Hale, Reed, Mercer)
and the setting is Bombay. This is deliberate and it reads correctly: a Bombay Parsi and
Anglo-Indian professional world. The eight final-theory questions already name these people.
Names live in `content/characters.json` and `content/cast.json`, so renaming the cast remains a
data change, not a rewrite.

---

## 2. Cast

| Person | Age | Role | What they are hiding |
|---|---|---|---|
| **Dr. Elias Vane** | 54 | Consultant psychologist. The victim. | Falsified patient records and used recorded sessions to hold patients in place. Killed Julian Marsh in 2023. |
| **Mira Vale** | 28 | Julian's fiancée. Vane's patient. | Nothing. She has been telling the truth for three years and nobody believed her. |
| **Julian Marsh** | 27 | Died 2 December 2023. | Found the falsified records and was going to the authorities. |
| **Adrian Cross** | 27 | Vane's research assistant. **The killer.** | Julian's younger half-brother, working under his father's surname for four years. |
| **Det. Rowan Hale** | 41 | Lead investigator. **The accomplice.** | Vane's blackmailed patient (P-0912, Recording Nine). Buried Julian's case, then helped end Vane. |
| **Lena Vane** | 46 | Vane's wife. Clinical psychologist. | Found the body, destroyed her own session tape (Recording Three, about a certification she knowingly co-signed), wiped the room and lied. **Not the killer.** |
| **Clara Vane** | 50 | Vane's sister. Red herring. | Was secretly taking documents from her brother for safekeeping. Lied about being estranged. |
| **Daniel Reed** | 33 | Former patient. Red herring. | An old grievance and a threat he never acted on. Lied about recent contact. |
| **Noah Mercer** | 29 | Journalist. Red herring. | Was staking the house out without clearance. Lied about ever being there. |
| **Helen Marsh** | 61 | Julian's and Adrian's mother. | Does not know what her surviving son has been doing. |

---

## 3. Three years ago — 2 December 2023

1. In an earlier session, **Rowan Hale confessed to planting evidence in another case.** Vane
   recorded it (**Recording Nine**, patient code **P-0912**) and kept it as leverage.
   *This predates Julian's death and is why Rowan could be made to help.*
2. Julian found proof that Vane was falsifying records and blackmailing patients.
3. **9:12 PM** — Julian telephones Vane to confront him. 47 seconds. MTNL toll record.
4. Vane was at a public dinner until about **9:15 PM**. He drove over and killed Julian.
5. Mira was in the house. She heard Julian alive and shouting at about 9:15, and later a door
   and **two short chirps and a click** — a police radio.
6. **10:05 PM** — badge **4417** logs arrival. **10:20 PM** — the 112 call is logged.
   *He was on scene fifteen minutes before anyone called.*
7. Rowan backdates the official time of death to **8:40 PM**, which puts Vane safely at dinner,
   and steers the case toward Mira. She is never charged and never believed.
8. Vane becomes her therapist and spends three years persuading her that her memory is
   unreliable. She stops speaking.

---

## 4. Between then and now

- Adrian takes a job with Vane under the surname **Cross** and spends four years collecting proof.
- Every anonymous tip he files lands on Rowan's desk. He stops trusting the police.
- **Six months before the murder** he finds Recording Nine and offers Rowan terms: Vane goes,
  the confession disappears, and Rowan runs the investigation.
- **Three days before the murder** Vane works out who Adrian is — *"I should have known Helen's
  son by his eyes."* He records a final message and hides it in Mira's music box, which he
  returns to her the afternoon before he dies.
- Vane's last note is written the day after Rowan quits as a patient. It is **filed under Rowan
  Hale's own name**: *"The person investigating my death already knows who killed me."*

---

## 5. The night — 23 October 2026 (all times IST)

| Time | What happened | What the team sees |
|---|---|---|
| 9:18 PM | Adrian badges out of the front door. | Security log: last visitor leaves. |
| 9:20 – 11:50 PM | Rowan opens an unlogged maintenance window on the security vendor's system under `LIAISON_4417`. **It suppresses access-control events and alarm dispatch. It does not stop the panel writing interior motion to its own local log.** | No entry or exit is recorded after 9:18. |
| ~9:30 PM | Adrian re-enters through the garage keypad on a service override. | Nothing — the garage panel's local memory is only found later. |
| **9:52 PM** | Vane's last genuine activity: a keyboard entry and study motion, three seconds apart. | The anchor for the whole timeline. |
| ~10:50 PM | Adrian confronts him about Julian and the records. It turns violent. He kills him with the letter opener. | Police surgeon: death 45–75 minutes after 9:52, i.e. **10:37–11:07 PM**. |
| after | Adrian smashes the desk clock and sets the hands to **10:17**. | The staged time everyone accepts. |
| 10:21 PM | Adrian posts an old photograph of the Diu seafront, captioned as Madh Island — ninety minutes away, which would cover the whole window. | His alibi. |
| 11:08 PM | He leaves and locks the study **remotely from Vane's tablet**. | The locked-room problem. |
| 11:40 PM | Lena lets herself in with her spare key and finds him dead. | Doorbell camera, neighbour's house. |
| 11:52 PM | Lena deletes Recording Three from the archive. *The maintenance window has just closed, which is why this one is visible.* | `LENA_IPAD` in the audit log. |
| 11:56 PM | She wipes surfaces, bolts the study manually and leaves. | A second lock event. |
| next morning | Rowan takes the case. The lock export he hands over has already been cleaned by Adrian's script. | A door apparently bolted from inside. |

---

## 6. The ten beats, and where suspicion sits

Each beat must **change what the team believes**. That is the test. A beat that only adds a fact
is not finished.

| # | Beat | Proves | Board moves to |
|---|---|---|---|
| 1 | The Stopped Clock | The clock was set by hand; real window is 10:37–11:07 | — |
| 2 | Recording Seven | Vane knew Mira did not kill Julian | Mira → witness; Julian enters |
| 3 | The Old Case | The 2023 report was altered; badge 4417 | the badge has no face yet |
| 4 | The Patient Files | A recording was deleted from Lena's device that night | **Lena → suspected** |
| 5 | Contradictions | Four lied; three of the lies are irrelevant | Clara, Daniel, Noah → cleared |
| 6 | Mira's Silence | The diary was always in order. Vane's hidden tape names "Helen's son" | **Lena → cleared. Adrian → suspected.** |
| 7 | The Perfect Alibi | The photo is old and from Diu; the memorial names him as Julian's brother | Adrian confirmed as family |
| 8 | The Garage Panel | He re-entered at 9:31 on a service override | means and opportunity |
| 9 | The Locked Room | The export was forged; a liaison account was erased | **Adrian → charged** |
| 10 | The Accomplice | Liaison 4417 is Rowan Hale | **Rowan → charged** |

**Suspicion must visibly travel: Lena → Adrian → the detective who has been helping them all
afternoon.** Beat 6 is the hinge, because it is the moment the team discovers it has spent forty
minutes being confidently wrong. If beat 6 lands, the afternoon works.

---

## 7. Answer key

| Beat | Answer |
|---|---|
| 1 | `2237` |
| 2 | `NOT ME JULIAN` (also accepts `JULIAN`) |
| 3 | gate `1938MANNINGHAM`, then `32-4417` |
| 4 | `LENA_IPAD-P0912` |
| 5 | `3527` (Lena E3, Daniel E5, Clara E2, Noah E7) |
| 6 | the six diary sheets in true chronological order |
| 7 | `Diu` (or coordinates within 4 km of 20.7144, 70.9874) |
| 8 | set per kit in `/hq` → Kits |
| 9 | `2308-4417` |
| 10 | `FLAG{ROWAN_HALE}` |

Nothing above appears anywhere a player can reach it: not in story text, not in an input
placeholder, not in a field label, and not in any hint tier. **Keep it that way.** Before every
content change, re-run the check in §9.

---

## 8. Five logic rulings

These were real holes. They are resolved as follows, and the resolution is canon.

1. **The two forgeries contradicted each other.** The staged clock says the attack was at 10:17,
   but the forged lock export said the study was bolted from inside at 10:26 — i.e. Vane alive
   *after* his own staged death. **Ruling: the shift is 58 minutes, not 42**, so the forged row
   reads **10:10 PM**, before the staged attack, and the cover story is internally consistent.
   The submitted answer is unchanged (`2308-4417`). *Not yet applied in code — see §10.*
2. **The maintenance window contradicted beat 1.** Beat 1 depends on a study-motion event at
   9:52, inside the window that beats 8 and 10 say recorded nothing. **Ruling: the window
   suppresses access-control events and alarm dispatch only.** Interior motion still writes to
   the panel's local log. Adrian's garage re-entry goes unrecorded; Vane's presence does not.
3. **The alibi stopped working after beat 1.** Once the window is known to be 10:37–11:07, a
   10:21 photograph proves nothing. **Ruling: the claimed location is ninety minutes from Ridge
   Road**, so the photograph — if real — would cover the entire window. This must be stated in
   the case file, and now is.
4. **Nobody had wiped the archive.** Nine of twelve reels are blank and the story never said by
   whom. **Ruling: Adrian wiped them, hunting Recording Nine.** He missed Seven (damaged) and
   Nine (Vane had already moved it). This also explains why Nine survives for the finale.
5. **Mira's diary predated the exercise that created it.** **Ruling: the diary is hers, not a
   therapy exercise.** She began it the night Julian died. Vane later told her to stop.

---

## 9. Leak check before any content change

```bash
# no answer may appear in player-facing text
grep -rn "2237\|NOT ME JULIAN\|MANNINGHAM\|32-4417\|LENA_IPAD-P0912\|3527\|2308-4417\|ROWAN_HALE" \
  content/levels/*/story.md content/levels/*/hints.md apps/web/src/
```
Hits are only acceptable inside a block that renders **after** the beat is solved.

---

## 10. Still open

- [ ] **Beat 9**: apply the 58-minute shift (§8.1) and rebuild it as *code reading* — show the
      script and the three-row export — rather than fill-in-the-blank. Remove
      `POST /api/levels/9/check-blanks`, which is an unrated, unlogged oracle.
- [ ] **Beat 8**: kit answers are arbitrary numbers. Replace with the designed circuit
      `F = (A XOR B) AND (C XOR D) AND (A AND C)`, unique solution `1010`, same for every kit.
- [ ] **Beat 7**: the photograph on disk is still the old placeholder. A real, EXIF-stripped
      photograph of the Diu seafront must replace it, and `whitby` must come out of
      `accepted_names`.
- [ ] **Beat 10**: not built. Needs club member profiles, base64 strings, QR images and decoys.
- [ ] **Beat 2**: the repo ships both an MP3 and the Web Audio synthesiser. Pick one; the spec
      says no audio files.
- [ ] Hint time penalties (+2/+4/+7 min) are displayed but not yet added to elapsed time.
- [ ] Theory grading: decide whether Q1 gates eligibility or carries weighted points.
