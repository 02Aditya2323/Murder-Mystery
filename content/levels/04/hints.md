### Tier 1
Filter `access_log` where `action = 'DELETE'` and examine the events logged on the murder date: `2026-10-23`.

### Tier 2
To see what was purged on 2026-10-23, join `access_log` with `records`:
`SELECT a.device, a.user_id, a.ts, r.* FROM access_log a JOIN records r ON a.target_record = r.record_id WHERE a.action = 'DELETE' AND a.ts LIKE '2026-10-23%';`
Check which device executed the deletion just before midnight.

### Tier 3
For Question 2, query `records` joined with `patients`:
`SELECT r.record_id, r.patient_code, p.display_name, r.last_edited_at, r.recording_ref FROM records r JOIN patients p ON r.patient_code = p.patient_code WHERE r.edited_by = 'elias' AND r.last_edited_at BETWEEN '2023-12-02' AND '2023-12-09';`
Identify the confidential patient code whose consultation notes Dr. Vane modified 3 days after Julian died.
