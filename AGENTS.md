# The Society - working notes

Astro 7 + Tailwind 4 + Sveltia CMS, deployed on Vercel. Static output; the only
on-demand routes are the two OAuth endpoints under `src/pages/api/`.

## Editors never touch GitHub

Board members sign in with **Google**, via a DecapBridge email invitation. No
GitHub accounts - the board is non-technical. See `DECISIONS.md` (DECISION-001).

Keep `src/cms/collections.yml` inside **Decap's core widget set**; the build
fails with a pointer to the decision if a non-core widget appears.

## Rules of the road

- Content schemas live in `src/content.config.ts`. The CMS form that writes that
  content lives in `src/cms/collections.yml`. **Change both together** - a field
  added to one and not the other breaks either the build or the editor.
- Never use `astro:assets` `<Image>` for CMS-uploaded media. Those files land in
  `public/media/` and Astro's optimizer cannot process `public/`. Plain `<img>`.
- The production origin lives in ONE place: the `PUBLIC_SITE_URL` env var.
  `/admin/config.yml` and `/robots.txt` are generated from it at build time.
  Never hard-code a domain in a file.
- Env vars can arrive defined-but-empty from a host. Guard with a truthiness or
  validity check, not `??` - that is what broke the first two deployments.
- Date-only front matter parses as UTC midnight. Always format through
  `src/lib/dates.ts`; a bare `Intl.DateTimeFormat` renders it a day early.

## Before pushing

```sh
npm run check && npm run build
```
