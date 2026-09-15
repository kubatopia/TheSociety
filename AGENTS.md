# The Society — working notes

Astro 7 + Tailwind 4 + Sveltia CMS, deployed on Vercel. Static output; the only
on-demand routes are the two OAuth endpoints under `src/pages/api/`.

## Rules of the road

- Content schemas live in `src/content.config.ts`. The CMS form that writes that
  content lives in `public/admin/config.yml`. **Change both together** — a field
  added to one and not the other breaks either the build or the editor.
- Never use `astro:assets` `<Image>` for CMS-uploaded media. Those files land in
  `public/media/` and Astro's optimizer cannot process `public/`. Plain `<img>`.
- `GITHUB_OAUTH_ID` / `GITHUB_OAUTH_SECRET` are server-only. Do not prefix them
  with `PUBLIC_` and do not read them from client-side code.
- The production domain appears in `public/admin/config.yml`, `public/robots.txt`
  and the `PUBLIC_SITE_URL` env var. Update all three together.

## Before pushing

```sh
npm run check && npm run build
```
