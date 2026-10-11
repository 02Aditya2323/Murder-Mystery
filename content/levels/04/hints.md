### Tier 1
Two questions, two different starting tables. Begin with `access_log` and the `action` column.

### Tier 2
Narrow `access_log` to the single date of the murder, and look at what was removed rather than what was read. It is the `device` column you want, not the user.

### Tier 3
For the second half, join `records` to `patients`, filter `edited_by` to the victim, and restrict to the week following Julian's death. The file you are looking for is the one whose display name is not a name.
