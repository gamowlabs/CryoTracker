# CryoTracker

A shared web page for tracking an LN2 freezer. It shows each box as a 9×9 map
(positions 1–81, left to right, top to bottom). Lab members use it to remove, add and edit
vials, search the whole freezer, review a history of changes, and export a CSV.

## How it runs

`index.html` is a single self-contained page published as a **Claude artifact**. It relies on
the Claude artifact runtime (`window.claude.use(...)`) for three things:

| Capability  | Used for |
|-------------|----------|
| `db`        | The shared inventory record (`boxes/*`) and the change history (`log/*`) |
| `user`      | Recording who made each change, and showing their name in Activity |
| `downloads` | Saving the CSV export |

Because of this, **the lab's real inventory only appears when the page is opened through
claude.ai.** Anywhere else, the page runs in one of two fallback modes:

- **Served from a web server** (GitHub Pages, or `npx serve` in this folder): a **demo** loads with
  the made-up data in `data/sample-boxes.json`. Everything works, but changes stay in that browser
  tab and are lost on reload.
- **Opened as a local file** (double-clicking `index.html`): browsers block it from reading the
  sample data, so it shows a message explaining how to open it. Use `standalone.html` instead.

### Standalone demo

`standalone.html` is a single file with the sample data built in. It opens with a double-click,
needs no server, and works on its own on GitHub Pages. Rebuild it after changing `index.html` or
the sample data:

```bash
python3 tools/build_standalone.py
```

### Demo on GitHub Pages

In the repo on GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**, choose
`main` and `/ (root)`, then save. After a minute or two the demo is live at
`https://<your-username>.github.io/cryotracker/` (the standalone demo is at `/cryotracker/standalone.html`).

### Data model

- `boxes/R{rack}-B{box}`: `{ rack, box, slots: { "<position>": vial | null } }`
- A vial is `{ n: name, p: passage, d: freeze date, f: obtained from, c: cells/vial, v: vials (default 1), l: vial label, m: comments }`
- `log/<id>`: `{ act: remove|add|edit|restore|box, box, pos, item, note, who (user id), by?, ts, when }`
- `meta/settings`: `{ freezer: "<name>" }`, the freezer name shown in the header and used in the CSV
  file name. It's optional, and defaults to "LN2 Freezer", so no freezer or site name lives in the code.

Removing a vial sets its slot to `null`. Undo in Activity writes the logged vial back if the
position is still empty.

## Publishing changes

Edit `index.html`, then republish it to the **same** artifact (from a Claude conversation, pass
your artifact's URL as `url`). Republishing keeps the data, because the database belongs to
the artifact, not to a page version. Publishing it as a new artifact creates an empty inventory.

The artifact must declare these capabilities:

```json
{ "db": {}, "user": { "scopes": ["profile"] }, "downloads": true }
```

## Data

No real inventory is stored in this repo. The live inventory lives only in the artifact's
database. **If the artifact is deleted, its database is deleted with it**, so export a CSV from the
page regularly and keep it somewhere private.

`data/sample-boxes.json` is made-up example data (common cell lines, placeholder initials) used to
seed the tests. `.gitignore` blocks other JSON files in `data/` and any CSV export, so a real
inventory can't be committed by accident.

## Tests

The tests run the real `index.html` against an in-memory fake of the Claude runtime
(`tests/mock-claude.js`), seeded from `data/sample-boxes.json`, and click through every main action:
remove, undo, add several, edit, remove several, search, new box, CSV export, phone layout, and
read-only mode.

```bash
npm install
npx playwright install chromium
npm test
```
