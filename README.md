# alexrosrgz.github.io

Personal static site for **Alejandro Rosales Rodriguez**. Root-relative paths (`/css/…`, `/movies/…`) assume this repo is published as the user GitHub Pages site (`alexrosrgz.github.io`).

## GitHub Pages

1. Push this repo to `alexrosrgz/alexrosrgz.github.io` (or enable Pages on the branch that holds these files).
2. In **Settings → Pages**, set source to **Deploy from a branch**, branch `main` (or `master`), folder `/` (root).
3. After deploy, the site is at `https://alexrosrgz.github.io/`. Movies live at `/movies/`.

No build step. Edit HTML/CSS/JSON and push.

## Design tokens

| Token | Value | Use |
|-------|--------|-----|
| `--bg` | `#FAF9F5` | Page background |
| `--ink` | `#141413` | Primary text / AR mark |
| `--muted` | `#87867F` | Nav links, quiet lines |
| `--clay` | `#D97757` | Rare accent (e.g. focus) |
| Fonts | Source Serif 4 (AR), DM Sans (nav/UI) | Google Fonts |
| Poster radius | `8px` | Grid cells only |
| Poster aspect | `2 / 3` | Theatrical posters |
| Grid | 4 cols desktop, 2 mobile | No on-grid metadata |

Apple-quiet: scale for emphasis, no white lines or micro-chrome on poster cells. Movies page has no H1.

## Adding movies

Edit `data/movies.json` (array of objects).

### Schema

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `title` | string | yes | Display title |
| `year` | number | yes | Release year |
| `note` | string | no | Short line in the detail modal |
| `poster` | string (URL) | no | HTTPS poster image; if missing or broken, a CSS gradient placeholder with `data-title` is shown |

### Title Year format

When jotting new entries, use **`Title Year`** (e.g. `Heat 1995`), then map into JSON:

```json
{
  "title": "Heat",
  "year": 1995,
  "note": "Night drives and glass towers.",
  "poster": "https://example.com/heat-poster.jpg"
}
```

Prefer stable HTTPS poster URLs (Wikipedia `upload.wikimedia.org` fair-use thumbs are used for placeholders). Omit `poster` to force the gradient fallback.

Clicking a poster opens a minimal modal (title, year, optional note). The URL hash is set to a slug like `#blade-runner-2049-2017` so a link can reopen the same film.

## File tree

```
/
├── index.html
├── README.md
├── css/site.css
├── js/movies.js
├── data/movies.json
├── movies/index.html
├── story/index.html
├── photos/index.html
├── projects/index.html
└── random/index.html
```
