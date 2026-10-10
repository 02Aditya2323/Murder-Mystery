import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireTeamAuth, AuthenticatedRequest } from '../auth.js';
import { LevelStateRow } from '../types.js';

const router = Router();

// GET /api/characters — returns character profiles filtered by team progress
router.get('/', requireTeamAuth, (req: AuthenticatedRequest, res: Response) => {
  const teamId = req.team!.id;

  // Determine which levels are done (SOLVED or SKIPPED)
  const states = db
    .prepare(
      'SELECT level, status FROM level_state WHERE team_id = ? AND (status = ? OR status = ?) ORDER BY level ASC'
    )
    .all(teamId, 'SOLVED', 'SKIPPED') as Array<{ level: number; status: string }>;

  const done = new Set(states.map((s) => s.level));
  const maxDone = done.size > 0 ? Math.max(...done) : 0;

  // Whether a level has been completed
  const has = (n: number) => done.has(n);

  const characters: any[] = [];

  // ── DR. ELIAS VANE (victim) ─────────────────────────────────────────────────
  // Appears in the opening story — always visible once any level is open
  {
    const profile: any = {
      id: 'elias',
      name: 'Dr. Elias Vane',
      role: 'Consultant Psychologist — Victim',
      classification: 'VICTIM',
      status: 'DECEASED',
      knownFacts: [
        'Found deceased at 14 Keats Grove, Hampstead, London on 23 October 2026.',
        'Practised as a consultant psychologist — treated private patients under clinical sessions.',
      ],
      timeline: [],
      linkedEvidence: [],
      redacted: false,
    };

    if (has(1)) {
      profile.knownFacts.push(
        'Was physically active and present in his study at 21:52 BST (confirmed by keyboard input and motion sensor). The desk clock stopped at 22:17 was deliberately staged.'
      );
      profile.timeline.push('21:52 BST — confirmed active in study');
      profile.timeline.push('22:37–23:07 BST — true death window (medical examiner)');
      profile.linkedEvidence.push('Level 1 — Staged Clock & Archive Key');
    }

    if (has(2)) {
      profile.knownFacts.push(
        'Had knowledge that Julian Marsh\'s 2023 death was not caused by Mira Vale, and concealed it. Evidence: Recording Seven.'
      );
      profile.linkedEvidence.push('Level 2 — Recording Seven (audio archive)');
    }

    if (has(4)) {
      profile.knownFacts.push(
        'On 2023-12-05 — three days after Julian Marsh died — personally locked and scrubbed Patient P-0912\'s record from the clinical archive.'
      );
      profile.linkedEvidence.push('Level 4 — Clinical database audit');
    }

    if (has(6)) {
      profile.knownFacts.push(
        'Came to Mira\'s flat the day before his death and returned her music box, claiming it had been repaired. Left an emergency micro-cassette hidden in the false base.',
        'Discovered his research assistant was using a false identity three days before his death.'
      );
      profile.linkedEvidence.push('Level 6 — Micro-cassette in music box');
    }

    characters.push(profile);
  }

  // ── MIRA VALE (former patient / key witness) ────────────────────────────────
  {
    const profile: any = {
      id: 'mira',
      name: 'Mira Vale',
      role: 'Former Patient / Witness',
      classification: 'WITNESS',
      status: 'ALIVE',
      patientCode: 'P-0101',
      knownFacts: [
        'Former patient of Dr. Elias Vane (patient code P-0101).',
        'Gave a statement to investigators that "nothing she says will count".',
      ],
      timeline: [],
      linkedEvidence: [],
      redacted: false,
    };

    if (has(2)) {
      profile.knownFacts.push(
        'On the evening Julian Marsh died, she was present and heard Julian on the phone — alive — after 21:15. She also heard a police radio before any 999 call was logged.'
      );
      profile.linkedEvidence.push('Level 2 — Recording Seven transcript');
    }

    if (has(5)) {
      profile.knownFacts.push(
        'Her statement has no direct contradiction in the evidence matrix. No alibi was required because she was not at the scene on 23 October 2026.'
      );
      profile.linkedEvidence.push('Level 5 — Cross-examination matrix');
    }

    if (has(6)) {
      profile.knownFacts.push(
        'Confirmed the diary was written in chronological order, not jumbled. Dr. Vane repeatedly attempted to gaslight her about her own memories.',
        'Kept the diary and her music box hidden under a floorboard after Vane told her to stop writing.'
      );
      profile.linkedEvidence.push('Level 6 — Diary reconstruction & music box');
    }

    characters.push(profile);
  }

  // ── JULIAN MARSH (earlier victim) ───────────────────────────────────────────
  {
    const profile: any = {
      id: 'julian',
      name: 'Julian Marsh',
      role: 'Earlier Victim (2023)',
      classification: 'VICTIM',
      status: 'DECEASED (2023)',
      knownFacts: [
        'Died in December 2023. Mother: Helen Marsh.',
        'Official report recorded time of death as 20:40.',
      ],
      timeline: [],
      linkedEvidence: [],
      redacted: false,
    };

    if (has(2)) {
      profile.knownFacts.push(
        'Was alive and on the phone to Dr. Elias Vane at 21:12 (confirmed by BT toll record) — 32 minutes after the official time of death (20:40).'
      );
      profile.timeline.push('21:12 — outgoing call to Dr. Vane (47 seconds)');
      profile.linkedEvidence.push('Level 2 — Recording Seven');
    }

    if (has(3)) {
      profile.knownFacts.push(
        'The official incident report time of death (20:40) was backdated to clear someone with a dinner alibi. Badge 4417 signed the altered record.'
      );
      profile.linkedEvidence.push('Level 3 — Tampered incident report');
    }

    if (has(6)) {
      profile.knownFacts.push(
        'Mira heard Julian alive — shouting Elias\'s name — at approximately 21:15. A police radio sound preceded any 999 dispatch.'
      );
    }

    if (has(7)) {
      profile.knownFacts.push(
        'Julian\'s brother dedicated a public memorial at West Cliff Overlook, Whitby. Memorial inscription: "Seeking the truth that was taken from him."'
      );
      profile.linkedEvidence.push('Level 7 — Municipal Memorial Registry (Whitby)');
    }

    characters.push(profile);
  }

  // ── HELEN MARSH (Julian's mother) ───────────────────────────────────────────
  {
    const profile: any = {
      id: 'helen',
      name: 'Helen Marsh',
      role: "Julian Marsh's Mother",
      classification: 'PERSON OF INTEREST',
      status: 'ALIVE',
      knownFacts: [
        "Mother of Julian Marsh. Dedicated the memorial at West Cliff, Whitby after Julian's death.",
      ],
      timeline: [],
      linkedEvidence: [],
      redacted: false,
    };

    if (has(7)) {
      profile.knownFacts.push(
        'The North Yorkshire Parish Memorial Registry confirms that Helen Marsh and her son Adrian Cross (Marsh) jointly dedicated Julian\'s memorial.'
      );
      profile.linkedEvidence.push('Level 7 — Municipal Memorial Registry');
    }

    // Adrian's true identity is only revealed at Level 6+ via Elias's recording
    if (has(6)) {
      profile.knownFacts.push(
        "Her son Adrian Cross is Julian's half-brother. He infiltrated Dr. Vane's practice using his father's surname."
      );
    }

    characters.push(profile);
  }

  // ── ADRIAN CROSS (killer) ────────────────────────────────────────────────────
  // Adrian's culpability is revealed progressively — true identity at L6, alibi
  // debunked at L7, re-entry at L8, arrest at L9.
  {
    const profile: any = {
      id: 'adrian',
      name: 'Adrian Cross',
      role: 'Research Assistant',
      classification: 'SUSPECT',
      status: 'UNDER INVESTIGATION',
      knownFacts: [
        'Worked as Dr. Vane\'s research assistant.',
        'Stated he left the premises at 9:18 PM and was across the city at 10:21 PM with a "coastal photograph" as evidence.',
      ],
      timeline: [],
      linkedEvidence: [],
      redacted: false,
    };

    if (has(5)) {
      profile.knownFacts.push(
        "Adrian's alibi photo has not yet been directly disproved in the cross-examination matrix — he is the only suspect without a direct document contradiction at this stage."
      );
      profile.linkedEvidence.push('Level 5 — Cross-examination matrix');
    }

    if (has(6)) {
      profile.knownFacts.push(
        'Dr. Vane\'s final recording confirms: Adrian is Julian Marsh\'s half-brother, using his father\'s surname. He infiltrated the practice to gather evidence about Julian\'s death.'
      );
      profile.classification = 'PRIMARY SUSPECT';
      profile.linkedEvidence.push('Level 6 — Micro-cassette (music box confession)');
    }

    if (has(7)) {
      profile.knownFacts.push(
        'His alibi photograph was proven to be a historical image of West Cliff, Whitby — not Southend-on-Sea on the night of the murder. The municipal memorial registry lists him as "Adrian Cross (Marsh)".'
      );
      profile.timeline.push('Alibi photograph: proven recycled image from Whitby');
      profile.linkedEvidence.push('Level 7 — Geographic photograph debunking');
    }

    if (has(8)) {
      profile.knownFacts.push(
        'Re-entered the property via garage keypad at 21:31 using a service override code (user: A. Cross). The panel alarm was suppressed under a maintenance window he had initiated.'
      );
      profile.timeline.push('21:31 BST — garage re-entry via service override');
      profile.linkedEvidence.push('Level 8 — Garage micro-controller dump');
    }

    if (has(9)) {
      profile.knownFacts.push(
        'Locked the study door remotely at 23:08 via Elias\'s tablet as he fled — it was not a locked-room mystery. Cornered leaving the research archives and taken into formal custody.'
      );
      profile.status = 'ARRESTED';
      profile.classification = 'CONFIRMED KILLER';
      profile.timeline.push('23:08 BST — remotely locked study door via TABLET_API');
      profile.linkedEvidence.push('Level 9 — Lock de-obfuscation telemetry');
    }

    characters.push(profile);
  }

  // ── DETECTIVE ROWAN HALE (accomplice) ────────────────────────────────────────
  // True role only revealed at Level 10
  {
    const profile: any = {
      id: 'rowan',
      name: 'Detective Rowan Hale',
      role: 'Lead Investigator',
      classification: 'INVESTIGATOR',
      status: 'ACTIVE',
      knownFacts: [
        'Assigned as lead investigator on the Dr. Elias Vane case.',
      ],
      timeline: [],
      linkedEvidence: [],
      redacted: false,
    };

    if (has(3)) {
      profile.knownFacts.push(
        'Badge 4417 — the first officer on scene in the 2023 Julian Marsh incident — arrived at the premises at 22:05, a full 15 minutes before the 999 emergency call was logged at 22:20.'
      );
      profile.linkedEvidence.push('Level 3 — Tampered incident report (Badge 4417)');
      // Hint that 4417 is suspicious but don't name Rowan yet if not confirmed
    }

    if (has(9)) {
      profile.knownFacts.push(
        'Account LIAISON_4417 was scrubbed from the telemetry export to protect a police insider — badge 4417.'
      );
      profile.linkedEvidence.push('Level 9 — Scrubbed LIAISON_4417 account');
    }

    if (has(10)) {
      profile.classification = 'ACCOMPLICE — CONFIRMED';
      profile.status = 'CHARGED';
      profile.knownFacts.push(
        'Detective Rowan Hale is the officer behind Badge 4417 and LIAISON_4417. Altered Julian Marsh\'s time of death in 2023 under coercion from Elias Vane.',
        'Established the maintenance window that blinded the house security on the night of the murder, steering suspicion on Adrian\'s behalf.',
        'Recording Nine (Patient P-0912 = Rowan Hale): Rowan admitted altering Julian\'s file to 20:40 at Elias\'s instruction, and warned that linking 4417 to the scene would implicate them both.'
      );
      profile.linkedEvidence.push('Level 10 — Recording Nine (Patient P-0912)');
      profile.linkedEvidence.push('Level 10 — Dr. Vane\'s final sealed note');
    }

    characters.push(profile);
  }

  // ── LENA VANE (wife) ─────────────────────────────────────────────────────────
  {
    const profile: any = {
      id: 'lena',
      name: 'Lena Vane',
      role: 'Wife of Dr. Elias Vane',
      classification: 'SUSPECT',
      status: 'PERSON OF INTEREST',
      knownFacts: [
        'Wife of Dr. Elias Vane. Stated she was at a charity dinner until midnight, then went straight home.',
      ],
      timeline: [],
      linkedEvidence: [],
      redacted: false,
    };

    if (has(4)) {
      profile.knownFacts.push(
        'Device LENA_IPAD logged into the clinical database at 23:52 and deleted record R-0003 (Recording Three).'
      );
      profile.timeline.push('23:52 — deleted Recording Three via LENA_IPAD');
      profile.linkedEvidence.push('Level 4 — Database audit log');
    }

    if (has(5)) {
      profile.knownFacts.push(
        'E3 evidence proves she exited the charity dinner parking garage at 22:58 and her vehicle appeared on a neighbour\'s doorbell camera outside Keats Grove at 23:38.',
        'Statement contradicted by physical evidence — she lied about going straight home.'
      );
      profile.timeline.push('22:58 — exited dinner garage (parking ticket)');
      profile.timeline.push('23:38 — sedan outside Keats Grove (doorbell camera)');
      profile.linkedEvidence.push('Level 5 — Café & bank records, parking ticket, doorbell video');
    }

    characters.push(profile);
  }

  // ── CLARA VANE (sister) ──────────────────────────────────────────────────────
  {
    const profile: any = {
      id: 'clara',
      name: 'Clara Vane',
      role: "Dr. Vane's Sister",
      classification: 'SUSPECT',
      status: 'PERSON OF INTEREST',
      knownFacts: [
        'Sister of Dr. Elias Vane. Stated "we barely spoke for months".',
      ],
      timeline: [],
      linkedEvidence: [],
      redacted: false,
    };

    if (has(5)) {
      profile.knownFacts.push(
        'E2 proves four undisclosed meetings with Elias via café receipts and bank records over the previous two months — contradicting her statement about barely speaking.'
      );
      profile.linkedEvidence.push('Level 5 — Café & bank records (E2)');
    }

    characters.push(profile);
  }

  // ── DANIEL REED (former patient) ─────────────────────────────────────────────
  {
    const profile: any = {
      id: 'daniel',
      name: 'Daniel Reed',
      role: 'Former Patient',
      classification: 'SUSPECT',
      status: 'PERSON OF INTEREST',
      knownFacts: [
        'Former patient of Dr. Elias Vane. Stated he had not been near Elias since an "angry email months ago".',
      ],
      timeline: [],
      linkedEvidence: [],
      redacted: false,
    };

    if (has(5)) {
      profile.knownFacts.push(
        'E5: an SMS from Daniel to Dr. Vane sent 48 hours before the murder reads: "This isn\'t over." — directly contradicting his statement about having no contact.'
      );
      profile.linkedEvidence.push('Level 5 — Text message extract (E5)');
    }

    characters.push(profile);
  }

  // ── NOAH MERCER (journalist) ─────────────────────────────────────────────────
  {
    const profile: any = {
      id: 'noah',
      name: 'Noah Mercer',
      role: 'Journalist',
      classification: 'SUSPECT',
      status: 'PERSON OF INTEREST',
      knownFacts: [
        'Journalist. Stated he "never went near that house".',
      ],
      timeline: [],
      linkedEvidence: [],
      redacted: false,
    };

    if (has(5)) {
      profile.knownFacts.push(
        'E7 (private hire vehicle dispatch) proves a licensed taxi dropped him off one block from the Vane residence at 21:00 — directly contradicting his statement.'
      );
      profile.timeline.push('21:00 — dropped off one block from Keats Grove (taxi record)');
      profile.linkedEvidence.push('Level 5 — PHV dispatch record (E7)');
    }

    characters.push(profile);
  }

  return res.json({ characters, levelsCompleted: maxDone });
});

export default router;
