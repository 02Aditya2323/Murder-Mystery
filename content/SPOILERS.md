# Read this before pushing anything

**This repository is public.** A participant who finds
`github.com/02Aditya2323/Murder-Mystery` and runs one `git clone` can currently read:

- all ten `content/levels/NN/reveal.md` files — every reveal, including the culprit
- `content/scenes.json` — the full narrative arc and every board change
- `content/cast.json` — every character's secret
- `content/terms.json` and `content/timeline.json`

None of the server-side gating helps against that. `GET /api/case` refusing to send
Adrian's name until beat 5 is worth nothing if the same text is sitting in a public
repository the whole time.

## What to do about it

**Make the repository private before the event.** That is the only fix that actually
closes it, and it takes thirty seconds in GitHub settings. Everything else below is a
mitigation, not a solution.

If it has to stay public, the story content has to move out — a private submodule, or a
tarball dropped onto the server at deploy time and git-ignored here.

## Files kept out of git in the meantime

| Path | Why |
|---|---|
| `content/CANON.md` | The story bible and the complete answer key |
| `content/level10-osint.md` | The beat 10 chain, including which profile carries the flag |
| `apps/web/public/q/` | The generated QR images, one of which is the flag |
| `content/levels/*/answers.private.json` | Plaintext answers (already ignored) |

These live on the organiser's machine and on the server. Regenerate beat 10's assets on
the host with:

```bash
node scripts/gen-level10-osint.mjs https://your-event-host
```

That writes the QR images and `content/level10-osint.md`, which tells you exactly what
string to paste into each club member's bio.
