# CryoTracker: notes for Claude

A shared web app for tracking vials in an LN2 freezer: 9×9 box maps (positions 1–81, left to
right, top to bottom), removing, adding and editing vials, search, an activity history with undo,
and CSV export. The README has the full description and data model.

## This is a public repo: never commit real inventory data

- Real inventory lives only in the live app's database, never here. Don't add exports, CSVs,
  spreadsheets, or JSON copied from the live app, even "just for testing".
- Use only the made-up data in `data/sample-boxes.json` (common cell lines, initials "XX").
- Keep the code free of anything that identifies the lab or company: freezer or site names,
  people's names or initials, real cell-line constructs, experiment numbers, or the live app's
  link. The freezer name is a setting (`meta/settings.freezer`) and defaults to "LN2 Freezer".
- Before every commit, check the diff for any of the above.

## Files

- `index.html`: the whole app (HTML, CSS, JS in one file). This is the file to edit.
- `standalone.html`: generated. It's `index.html` with the sample data embedded. Don't edit it by hand.
- `tools/build_standalone.py`: regenerates `standalone.html`.
- `tests/`: Playwright tests that run `index.html` against an in-memory fake of the runtime
  (`tests/mock-claude.js`), seeded from the sample data.

## How the app gets its data

The app talks to its storage only through `RT.use("db" | "user" | "downloads")`:

- On claude.ai, `RT` is the Claude artifact runtime (`window.claude`), and data is the live inventory.
- Anywhere else, `demoRuntime()` provides an in-memory version seeded with sample data.

Keep all storage access behind `RT` so the demo, the tests, and a future backend (e.g. Firebase)
can be swapped in without touching the UI code.

## After every change

1. `python3 tools/build_standalone.py`
2. `npm test` (first time: `npm install && npx playwright install chromium`). All tests must pass.
3. Check the page at phone width (about 390px) and in dark mode: no sideways scrolling, and the
   whole 9×9 grid fits.
4. Commit `index.html` and `standalone.html` together, on a branch, and open a pull request.

## Updating the live app

The live app is a Claude artifact. Merging here does **not** update it. After a change is merged,
the maintainer republishes `index.html` to the same artifact from a Claude conversation (passing
the artifact's link). Publishing to a new artifact would start with an empty inventory. The
artifact declares these capabilities: `{"db": {}, "user": {"scopes": ["profile"]}, "downloads": true}`.

Changes to the data model must stay compatible with data already in the live app
(`boxes/*`, `log/*`, `meta/settings`), or come with a migration plan.
