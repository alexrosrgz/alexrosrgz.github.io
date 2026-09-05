# Site design system (living)

Owner: Designer (spec) · Creator (implement) · Coordinator (cross-cuts only)

Principle: simplicity is the ultimate sophistication. Apple-quiet, ivory canvas.

## Tokens

| Token | Value |
|-------|-------|
| Background | `#FAF9F5` |
| Ink | `#141413` |
| Muted | `#87867F` |
| Clay accent (rare) | `#D97757` |
| Serif | Source Serif 4 |
| Sans / UI | Outfit |
| Poster radius | `8px` |
| Poster aspect (movies) | ~2:3 theatrical |

CSS source of truth: `css/site.css` `:root`.

## Locked patterns (reuse by name)

- **Nav mark**: full name `Alejandro Rosales Rodriguez` in Source Serif on every page.
- **Tab title**: only `Alejandro Rosales Rodriguez` (no page-specific titles).
- **Mobile nav**: wrap under `960px` (full name + links wrap; no horizontal scroll, no hamburger).
- **Favorites statement**: continuous Source Serif SVG stretch (“I like watching movies…”).
- **Reading statement**: Source Serif couplet (plain CSS, max-width ~14ch) — Favorites weight/voice, **not** Favorites SVG `textLength` banner.
- **Reading Top 3**: between hero and full grid; three covers left (Brief History of Time → Zero to One → Sapiens, cover-only) + `Top 3.` Source Serif right; same poster hover/press + book modal; mobile stacks type then covers.
- **Reading hero**: statement left · smaller photo right (~40% width); upright photo; type block height ≈ photo on desktop; mobile stacks statement → photo → grid.
- **Poster / cover grid**: no on-grid metadata chrome; details in modal.
- **Poster hover** (fine pointer): `scale(1.015)` ~240ms ease-out — one cue only.
- **Poster press**: `scale(0.97)` ~80ms in, ~200ms out; no brightness/dimming.
- **Favicon**: single serif A, slate on ivory (`/favicon.ico` + png sizes + apple-touch).
- **Watched modal meta**: `Category · Watched MM/DD/YYYY · Platform · Comment` (US dates; omit cineby.at; sentence-case comments).
- **Favorite Movies modal**: title + `(Year)` only.

## Media pipelines

- **Movies / Watched**: TMDB theatrical posters (`image.tmdb.org`), hosted or linked consistently.
- **Books / Reading covers**: prefer sharp local files under `/covers/books/`. Fetch order after A/B: **iTunes Search `media=ebook` artwork bumped to `1200x1200bb`**, then Open Library large, then manual. One book → one cover file; don’t overwrite another title’s file.

## Handoff protocol

### Designer → Creator (a “GO”)
Must include:
1. Layout (desktop + mobile)
2. Exact numbers (scale, ms, radius, type size cues)
3. Asset paths on the shared box (if any)
4. **Reuse:** name prior locked patterns to match (e.g. “same SVG statement as Favorites”)
5. One strong option — not a menu

### Creator → Designer / room
After ship only:
- Live URL
- What changed (1–3 bullets)
- Screenshot if visual

### Do not
- ACK-only pings (“got it”, “already done”) with no new info
- Route micro design iterations through Coordinator
- Lock a media source without a quick A/B when sharpness matters

### Coordinator
- Cross-cutting decisions, blockers, Alejandro asks, repo write / infra
- Stay out of hover-pixel ping-pong unless asked
