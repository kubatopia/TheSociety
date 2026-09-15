# The Society

Website for the Society's board and committees. Built with Astro and Tailwind,
hosted on Vercel. Board members edit content in a browser at `/admin/`; every
save is a commit to this repository.

## Run it locally

```sh
npm install
npm run dev      # http://localhost:4321
npm run check    # type-check
npm run build    # production build
```

## How content works

All content lives in this repo as Markdown, so there is no CMS subscription and
no database to back up. The site is rebuilt automatically whenever content
changes.

| What | Where | Edited at |
| --- | --- | --- |
| News posts | `src/content/news/` | `/admin/` → News |
| Events | `src/content/events/` | `/admin/` → Events |
| Board roster | `src/content/board/` | `/admin/` → Board & Committees |
| Minutes & PDFs | `src/content/minutes/` | `/admin/` → Minutes & Documents |
| Free-text pages (About, Museum, Membership) | `src/content/pages/` | `/admin/` → Pages |
| Name, hours, contact, hero photo | `src/data/site.json` | `/admin/` → Site settings |
| Uploaded images and PDFs | `public/media/` | uploaded through `/admin/` |

Field definitions live in two places and must be kept in step:

- `src/content.config.ts` - the schema the site validates against at build time
- `src/cms/collections.yml` - the form the CMS shows to board members

If you add a field to one, add it to the other. A mismatch fails the build with
a clear error naming the file and field.

## Giving a board member access

Board members do **not** need a GitHub account.

1. Go to [DecapBridge](https://decapbridge.com) → this site → **Manage collaborators**.
2. Enter their email address and send the invitation.
3. They accept, sign in with Google, and land in the CMS at `/admin/`.

Remove them from the same screen to revoke access. Commits carry the editor's
name, so repo history shows who changed what.

## Deployment

Hosted on Vercel, connected to this repo. Pushes to `main` deploy to production.

One environment variable is required (Vercel → Project → Settings →
Environment Variables):

| Name | Value |
| --- | --- |
| `PUBLIC_SITE_URL` | `https://<production domain>` |

Editor sign-in is handled entirely by DecapBridge, which holds a GitHub token
scoped to this repository with **Contents** and **Pull requests** read-write.
If that token expires, every CMS save fails with nothing in the UI to explain
why - check it there first.

When the custom domain goes live, change `PUBLIC_SITE_URL` in Vercel and
redeploy. That single value drives canonical links, the sitemap, `robots.txt`
and the CMS `base_url` - there is nothing else to edit.

If `PUBLIC_SITE_URL` is missing, empty or not a URL, the build falls back to the
default in `astro.config.mjs` rather than failing.

## Architecture notes

- The site builds to static HTML, with no server-side routes of its own.
- Images referenced from CMS uploads are plain paths under `/media/`. They are
  served as uploaded rather than passed through Astro's image optimizer, which
  cannot process files in `public/`.
- `/admin/config.yml` and `/robots.txt` are generated at build time from
  `PUBLIC_SITE_URL`, so the deployed origin is never hard-coded in a file.
- Date-only front matter (`2026-09-20`) parses as UTC midnight. Format those
  values through `src/lib/dates.ts`, never with a bare `Intl.DateTimeFormat`, or
  they render a day early.
