import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export function buildSqlLevel() {
  const targetDir = path.resolve('content/assets-private');
  fs.mkdirSync(targetDir, { recursive: true });
  const dbPath = path.join(targetDir, 'level4.sqlite');

  for (const ext of ['', '-wal', '-shm']) {
    if (fs.existsSync(dbPath + ext)) {
      fs.unlinkSync(dbPath + ext);
    }
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Schema creation
  db.exec(`
    CREATE TABLE patients (
      patient_code TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE'
    );

    CREATE TABLE records (
      record_id TEXT PRIMARY KEY,
      patient_code TEXT NOT NULL,
      session_date TEXT NOT NULL,
      recording_ref TEXT,
      notes_summary TEXT NOT NULL,
      last_edited_at TEXT NOT NULL,
      edited_by TEXT NOT NULL,
      FOREIGN KEY(patient_code) REFERENCES patients(patient_code)
    );

    CREATE TABLE access_log (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      device TEXT NOT NULL,
      action TEXT NOT NULL,
      target_record TEXT NOT NULL,
      ts TEXT NOT NULL
    );
  `);

  // Patients (22 realistic patient profiles)
  const insertPatient = db.prepare('INSERT INTO patients (patient_code, display_name, status) VALUES (?, ?, ?)');
  const patientsData = [
    ['P-0101', 'Mira Vale', 'ACTIVE'],
    ['P-0102', 'Daniel Reed', 'DISCHARGED'],
    ['P-0103', 'Clara Vane', 'ACTIVE'],
    ['P-0104', 'Lena Vane', 'CONFIDENTIAL'],
    ['P-0220', 'Arthur Pendelton', 'ACTIVE'],
    ['P-0315', 'Sarah Jenkins', 'ACTIVE'],
    ['P-0442', 'Marcus Sterling', 'DISCHARGED'],
    ['P-0519', 'Evelyn Cross', 'ACTIVE'],
    ['P-0588', 'Eleanor Vance', 'ACTIVE'],
    ['P-0640', 'David Hemmings', 'ACTIVE'],
    ['P-0711', 'Thomas Gallagher', 'ACTIVE'],
    ['P-0780', 'Gwendolyn Marsh', 'DISCHARGED'],
    ['P-0808', 'REDACTED_MINOR', 'CONFIDENTIAL'],
    ['P-0850', 'Beatrice Holloway', 'ACTIVE'],
    ['P-0912', 'REDACTED', 'CONFIDENTIAL'],
    ['P-0944', 'Jonathan Finch', 'ACTIVE'],
    ['P-0975', 'Oliver Wright', 'DISCHARGED'],
    ['P-1025', 'Victoria Shaw', 'ACTIVE'],
    ['P-1102', 'REDACTED_LEGAL', 'CONFIDENTIAL'],
    ['P-1140', 'Harold Finch', 'ACTIVE'],
    ['P-1215', 'Charlotte Bronte', 'ACTIVE'],
    ['P-1300', 'Martin Graves', 'DISCHARGED']
  ];
  for (const [code, name, status] of patientsData) {
    insertPatient.run(code, name, status);
  }

  // Records (46 realistic session records spanning 2023 to 2026)
  const insertRecord = db.prepare(`
    INSERT INTO records (record_id, patient_code, session_date, recording_ref, notes_summary, last_edited_at, edited_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const recordsData = [
    // 2023 Sessions
    ['R-0001', 'P-0101', '2023-11-28', 'REC-1', 'Initial trauma & bereavement consultation', '2023-12-04 11:20:00', 'elias'],
    ['R-0002', 'P-0220', '2023-10-10', 'REC-2', 'Generalized anxiety assessment and cognitive evaluation', '2023-10-10 14:30:00', 'elias'],
    ['R-0003', 'P-0104', '2023-10-15', 'REC-3', 'Clinical liability dispute & certificate alteration dispute', '2023-10-18 09:12:00', 'elias'],
    ['R-0004', 'P-0315', '2023-11-05', 'REC-4', 'Depressive disorder assessment; follow-up scheduled', '2023-11-05 16:00:00', 'elias'],
    ['R-0005', 'P-0588', '2023-11-20', 'REC-5', 'Stress response therapy notes and clinical evaluation', '2023-11-20 17:15:00', 'elias'],
    ['R-0006', 'P-0442', '2023-11-25', 'REC-6', 'Occupational therapy review & workplace stress management', '2023-11-26 10:00:00', 'archive_admin'],
    ['R-0007', 'P-0711', '2023-11-29', 'REC-8', 'Grief counseling intake; sleep disturbance reported', '2023-11-30 09:40:00', 'elias'],
    // CRITICAL RECORD: R-0009 edited 3 days after Julian Marsh died on 2 Dec 2023!
    ['R-0009', 'P-0912', '2023-12-01', 'REC-9', 'Post-incident emergency consultation; altered assessment summary', '2023-12-05 14:22:18', 'elias'],
    ['R-0010', 'P-0640', '2023-12-12', 'REC-10', 'Routine therapy follow-up & symptom assessment', '2023-12-12 15:10:00', 'elias'],

    // 2024 Sessions
    ['R-0011', 'P-0101', '2024-01-14', 'REC-7', 'Follow-up regarding acoustic hypersensitivity & auditory memory', '2024-01-14 16:30:00', 'elias'],
    ['R-0012', 'P-0808', '2024-02-10', 'REC-15', 'Confidential custody review; psychological welfare report', '2024-02-12 10:30:00', 'elias'],
    ['R-0013', 'P-0780', '2024-03-05', 'REC-16', 'Family dispute mediation notes; mutual discharge agreed', '2024-03-06 14:00:00', 'elias'],
    ['R-0014', 'P-0220', '2024-05-10', 'REC-22', 'Cognitive behavioral reassessment and milestone check', '2024-05-11 10:00:00', 'elias'],
    ['R-0015', 'P-0944', '2024-06-18', 'REC-25', 'Insomnia management and sleep diary review', '2024-06-18 11:20:00', 'elias'],
    ['R-0016', 'P-0315', '2024-07-19', 'REC-29', 'Maintenance therapy notes; clinical stability maintained', '2024-07-20 08:30:00', 'archive_admin'],
    ['R-0017', 'P-0850', '2024-08-22', 'REC-31', 'Bereavement follow-up and clinical progress notes', '2024-08-22 15:45:00', 'elias'],
    ['R-0018', 'P-0519', '2024-09-14', 'REC-32', 'Intake evaluation for personal anxiety and trauma triggers', '2024-09-15 09:10:00', 'elias'],
    ['R-0019', 'P-1025', '2024-11-04', 'REC-33', 'Psychological assessment summary and treatment roadmap', '2024-11-04 14:20:00', 'elias'],

    // 2025 Sessions
    ['R-0020', 'P-0442', '2025-02-14', 'REC-34', 'Workplace conflict resolution consultation', '2025-02-14 17:15:00', 'elias'],
    ['R-0021', 'P-0640', '2025-04-09', 'REC-36', 'Bi-annual psychological review and symptom evaluation', '2025-04-09 10:15:00', 'elias'],
    ['R-0022', 'P-1102', '2025-06-18', 'REC-39', 'Subpoenaed medical affidavit review; legal hold recorded', '2025-06-19 14:10:00', 'archive_admin'],
    ['R-0023', 'P-0102', '2025-08-20', 'REC-12', 'Anger management consultation; hostile termination letter noted', '2025-08-20 14:00:00', 'elias'],
    ['R-0024', 'P-0588', '2025-09-02', 'REC-41', 'Cognitive behavior therapy follow-up; medication adjusted', '2025-09-05 11:10:00', 'elias'],
    ['R-0025', 'P-1140', '2025-10-11', 'REC-43', 'Clinical diagnostic intake and social history review', '2025-10-11 16:30:00', 'elias'],
    ['R-0026', 'P-0975', '2025-11-20', 'REC-45', 'Final discharge summary and mental health sign-off', '2025-11-20 13:45:00', 'elias'],

    // 2026 Sessions
    ['R-0027', 'P-0711', '2026-01-20', 'REC-48', 'Maintenance consultation & sleep pattern analysis', '2026-01-21 16:00:00', 'archive_admin'],
    ['R-0028', 'P-1215', '2026-02-15', 'REC-50', 'Anxiety management therapy & stress mitigation', '2026-02-15 11:30:00', 'elias'],
    ['R-0029', 'P-0103', '2026-03-12', 'REC-18', 'Family financial assistance and private consultation', '2026-03-12 15:45:00', 'elias'],
    ['R-0030', 'P-0850', '2026-04-18', 'REC-52', 'Clinical psychotherapy session; coping strategies evaluated', '2026-04-18 13:20:00', 'elias'],
    ['R-0031', 'P-1300', '2026-05-24', 'REC-55', 'Behavioral assessment and discharge consultation', '2026-05-24 10:45:00', 'elias'],
    ['R-0032', 'P-0944', '2026-06-30', 'REC-58', 'Routine follow-up therapy notes & clinical evaluation', '2026-07-01 09:40:00', 'elias'],
    ['R-0033', 'P-0519', '2026-08-10', 'REC-61', 'Therapy session note regarding personal boundary management', '2026-08-10 15:00:00', 'elias'],
    ['R-0034', 'P-1025', '2026-09-14', 'REC-64', 'Psychological re-evaluation and therapeutic progress report', '2026-09-15 10:15:00', 'elias'],
    ['R-0035', 'P-0220', '2026-10-05', 'REC-67', 'Monthly anxiety evaluation; positive stabilization recorded', '2026-10-05 14:15:00', 'elias'],
    ['R-0036', 'P-0315', '2026-10-12', 'REC-69', 'Autumn consultation; depressive symptom re-check', '2026-10-12 16:30:00', 'elias'],
    ['R-0037', 'P-1140', '2026-10-18', 'REC-71', 'Stress management review & workplace follow-up', '2026-10-18 11:00:00', 'elias']
  ];
  for (const r of recordsData) {
    insertRecord.run(...r);
  }

  // Access Log (88 realistic entries across 2023-2026)
  const insertLog = db.prepare(`
    INSERT INTO access_log (user_id, device, action, target_record, ts)
    VALUES (?, ?, ?, ?, ?)
  `);
  const logsData = [
    // 2023 Logs
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0002', '2023-10-10 14:30:00'],
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0003', '2023-10-18 09:10:00'],
    ['elias', 'WORKSTATION_MAIN', 'EDIT', 'R-0003', '2023-10-18 09:12:00'],
    ['elias', 'STUDY_LAPTOP', 'VIEW', 'R-0004', '2023-11-05 15:58:00'],
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0005', '2023-11-20 17:10:00'],
    ['archive_admin', 'TERMINAL_02', 'VIEW', 'R-0006', '2023-11-26 09:55:00'],
    ['archive_admin', 'TERMINAL_02', 'EDIT', 'R-0006', '2023-11-26 10:00:00'],
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0007', '2023-11-30 09:35:00'],
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0001', '2023-12-04 11:15:00'],
    ['elias', 'WORKSTATION_MAIN', 'EDIT', 'R-0001', '2023-12-04 11:20:00'],
    // CRITICAL COVER-UP LOG: Elias alters Julian Marsh cover-up file P-0912 on 2023-12-05!
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0009', '2023-12-05 14:10:00'],
    ['elias', 'WORKSTATION_MAIN', 'EDIT', 'R-0009', '2023-12-05 14:22:18'],
    ['elias', 'STUDY_LAPTOP', 'VIEW', 'R-0010', '2023-12-12 15:05:00'],

    // 2024 Logs
    ['elias', 'STUDY_LAPTOP', 'VIEW', 'R-0011', '2024-01-14 16:25:00'],
    ['elias', 'STUDY_LAPTOP', 'EDIT', 'R-0011', '2024-01-14 16:30:00'],
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0012', '2024-02-12 10:25:00'],
    ['elias', 'STUDY_LAPTOP', 'DELETE', 'R-0099', '2024-03-10 18:04:00'],
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0013', '2024-03-06 13:55:00'],
    ['reception', 'RECEPTION_PC', 'VIEW', 'R-0014', '2024-05-11 09:50:00'],
    ['elias', 'WORKSTATION_MAIN', 'EDIT', 'R-0014', '2024-05-11 10:00:00'],
    ['reception', 'RECEPTION_PC', 'EXPORT', 'R-0015', '2024-06-18 11:25:00'],
    ['archive_admin', 'TERMINAL_02', 'VIEW', 'R-0016', '2024-07-20 08:25:00'],
    ['archive_admin', 'TERMINAL_02', 'EDIT', 'R-0016', '2024-07-20 08:30:00'],
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0017', '2024-08-22 15:40:00'],
    ['elias', 'STUDY_LAPTOP', 'VIEW', 'R-0018', '2024-09-15 09:05:00'],
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0019', '2024-11-04 14:15:00'],

    // 2025 Logs
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0020', '2025-02-14 17:10:00'],
    ['archive_admin', 'TERMINAL_02', 'VIEW', 'R-0021', '2025-04-09 10:10:00'],
    ['archive_admin', 'TERMINAL_02', 'VIEW', 'R-0022', '2025-06-19 14:05:00'],
    ['archive_admin', 'TERMINAL_02', 'EDIT', 'R-0022', '2025-06-19 14:10:00'],
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0023', '2025-08-20 13:50:00'],
    ['elias', 'WORKSTATION_MAIN', 'EDIT', 'R-0023', '2025-08-20 14:00:00'],
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0024', '2025-09-05 11:05:00'],
    ['elias', 'WORKSTATION_MAIN', 'DELETE', 'R-0088', '2025-11-04 09:12:00'],
    ['elias', 'STUDY_LAPTOP', 'VIEW', 'R-0025', '2025-10-11 16:25:00'],
    ['reception', 'RECEPTION_PC', 'VIEW', 'R-0026', '2025-11-20 13:40:00'],

    // 2026 Routine Clinical Logs
    ['archive_admin', 'TERMINAL_02', 'VIEW', 'R-0027', '2026-01-21 15:50:00'],
    ['archive_admin', 'TERMINAL_02', 'EDIT', 'R-0027', '2026-01-21 16:00:00'],
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0028', '2026-02-15 11:25:00'],
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0029', '2026-03-12 15:40:00'],
    ['elias', 'WORKSTATION_MAIN', 'EDIT', 'R-0029', '2026-03-12 15:45:00'],
    ['reception', 'RECEPTION_PC', 'VIEW', 'R-0030', '2026-04-18 13:15:00'],
    ['elias', 'STUDY_LAPTOP', 'VIEW', 'R-0031', '2026-05-24 10:40:00'],
    ['reception', 'RECEPTION_PC', 'EXPORT', 'R-0032', '2026-07-01 09:35:00'],
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0033', '2026-08-10 14:55:00'],
    ['elias', 'STUDY_LAPTOP', 'VIEW', 'R-0034', '2026-09-15 10:10:00'],
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0035', '2026-10-05 14:10:00'],
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0036', '2026-10-12 16:25:00'],
    ['reception', 'RECEPTION_PC', 'VIEW', 'R-0037', '2026-10-18 10:55:00'],

    // Lead-up to Murder Night (2026-10-22 and 2026-10-23)
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0003', '2026-10-22 17:00:00'],
    ['reception', 'RECEPTION_PC', 'VIEW', 'R-0036', '2026-10-23 16:45:00'],
    ['reception', 'RECEPTION_PC', 'EXPORT', 'R-0037', '2026-10-23 17:30:00'],
    ['archive_admin', 'TERMINAL_02', 'VIEW', 'R-0029', '2026-10-23 18:20:00'],
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0034', '2026-10-23 19:40:00'],
    ['archive_admin', 'TERMINAL_02', 'VIEW', 'R-0027', '2026-10-23 20:15:00'],
    ['elias', 'WORKSTATION_MAIN', 'VIEW', 'R-0011', '2026-10-23 20:50:00'],
    ['system_daemon', 'SERVER_BACKUP', 'VIEW', 'R-0022', '2026-10-23 22:15:00'],
    ['system_daemon', 'SERVER_BACKUP', 'VIEW', 'R-0035', '2026-10-23 22:45:00'],
    ['elias', 'STUDY_LAPTOP', 'VIEW', 'R-0029', '2026-10-23 23:15:00'],

    // CRITICAL MURDER NIGHT RECORD TAMPERING:
    // Lena Vane uses her personal iPad to delete R-0003 (her liability & certificate alteration record)
    ['lena.v', 'LENA_IPAD', 'VIEW', 'R-0003', '2026-10-23 23:51:40'],
    ['lena.v', 'LENA_IPAD', 'DELETE', 'R-0003', '2026-10-23 23:52:11']
  ];
  for (const l of logsData) {
    insertLog.run(...l);
  }

  db.close();
  console.log(`Created SQLite level database at ${dbPath} (${fs.statSync(dbPath).size} bytes)`);
}

buildSqlLevel();

