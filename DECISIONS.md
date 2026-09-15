# Decisions

Short record of choices that are expensive to reverse or easy to forget.
Newest first.

---

## DECISION-001 — Board members will sign in with Google, not GitHub

**Status:** accepted, not yet implemented
**Decided:** 15 September 2026

### The requirement

Most of the board is non-technical. Requiring each of them to create a GitHub
account is unacceptable friction. The target is an **email invitation leading to
a Google sign-in**.

### What we are doing about it

Move the editor from Sveltia CMS to **Decap CMS + DecapBridge**. DecapBridge
handles invitations and identity (Google, Microsoft, or a password) and commits
to the repository on the editor's behalf, so no editor needs a git account.

Content stays as Markdown in this repository either way. This is a change of
editor and sign-in, not a change of content model.

### Why not the alternatives

- **Stay on Sveltia.** Sveltia authenticates against the git provider. A GitHub
  account is structural to it; the OAuth endpoints in `src/pages/api/` only
  remove the token-pasting step, not the account requirement.
- **Netlify Identity + Git Gateway.** The classic answer to this problem.
  Git Gateway is deprecated — do not build on it.
- **Sanity or another hosted CMS.** Better editor, 20 free seats, but content
  leaves the repository and every page needs rewriting against a query API.
  Reconsider only if we also want a materially stronger editor.

### When

**After** the design and content strategy are settled — not before. Sveltia with
GitHub sign-in is adequate while a single technical person is the only editor.

### What this constrains in the meantime

`src/cms/collections.yml` must stay within **Decap's core widget set**, so the
migration is a config change rather than a rewrite. This is enforced: the build
fails if a non-core widget appears (see `src/pages/admin/config.yml.ts`).

Audited 15 September 2026 — widgets in use are `boolean`, `datetime`, `file`,
`image`, `markdown`, `number`, `select`, `string`, `text`. All Decap core.

### The migration, when we do it

1. Create the site in DecapBridge, connect the GitHub repository.
2. Swap the script tag in `public/admin/index.html` to Decap CMS.
3. Replace the generated `backend:` block in `src/pages/admin/config.yml.ts`
   with the DecapBridge backend.
4. Delete `src/pages/api/auth.ts` and `src/pages/api/callback.ts`.
5. Delete the `GITHUB_OAUTH_ID` / `GITHUB_OAUTH_SECRET` Vercel variables and the
   GitHub OAuth app.
6. Invite one board member by email and have them edit a page end to end.

Roughly an hour. Free for 10 collaborators; $9/month or $199 once beyond that.
