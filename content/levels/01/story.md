# Incident Briefing: The Study at Ridge Road

On the night of Friday, 23 October 2026, {{victim.full}} was found lifeless at his desk in the study of his residence in {{place.house_area}}.

A heavy brass desk clock was discovered smashed on the floor, its hands frozen at **22:17**. First responders and lead investigator {{accomplice.full}} initially accepted 22:17 as the definitive moment of the attack.

However, the Medical Examiner's preliminary report questions this assumption:

> *"The physical trauma and body temperature indicate that the true time of death occurred strictly between **45 and 75 minutes** following the last confirmed, genuine physical human activity in the study. The smashed clock appearance suggests deliberate staging."*

You have been handed raw system logs captured from four separate devices operating across the property:
- **SEC**: Central Security Alarm Panel (IST, 24-hour format).
- **DOORBELL**: Front door smart camera system (IST, 24-hour format).
- **PC**: {{victim.first}}'s private desktop workstation (UTC ISO 8601 timestamps).
- **PHONE**: Ground floor landline caller record (12-hour IST).
- **THERMO**: Central heating thermostat log.

Note: The house and every local system run on India Standard Time (IST = UTC+5:30). One of the logs does not. Be alert to clock skew and automated background tasks.

**Your Objective:**
Identify the start time of the genuine Medical Examiner window of death. Enter the 4-digit 24-hour time (e.g., `2145`).
