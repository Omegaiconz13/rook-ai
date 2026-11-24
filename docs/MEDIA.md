# Media

Six screenshots of the product, kept in git. Everything else that was captured while
building lives in `artifacts/`, which is ignored — QA evidence is not source, and 36 MB
of it made every clone slow.

| File | Shows |
|---|---|
| `landing-hero.jpg` | The landing page at 1280 px: the promise, the desk preview, the primary action. |
| `desk.png` | `/app` at 1440 px: the stat row, the scan table, the rail at rest. |
| `gate-verdict.png` | A real gate verdict on a plan, with the rule id and the numbers that produced it. |
| `journal.png` | `/app/journal` at 1440 px: rows, the calendar, the analytics beside them. |
| `charts.png` | `/app/charts` at 1440 px: the Vela workspace with the desk's own panels. |
| `desk-mobile.png` | `/app` at 360 px: the same desk, the hamburger that opens the drawer. |

## Rules

- **Six, not two hundred.** A screenshot earns its place by showing a state a reader
  cannot otherwise see: the verdict, the mobile desk, the journal with rows in it.
- **No bug shots.** Before/after captures of a hover fix belong in a commit message or
  the pull request, not in the repository.
- **Regenerate, do not accumulate.** Capture at the sizes above, strip metadata, and
  replace the file — a second file for the same screen is how `artifacts/` happened.

## Regenerating

```bash
bun run dev                       # http://localhost:5333
chromium --headless --disable-gpu --hide-scrollbars --window-size=1440,1000 \
  --screenshot=docs/media/desk.png http://localhost:5333/app
```

Then compress before committing:

```bash
convert docs/media/desk.png -strip -quality 90 docs/media/desk.png
```
