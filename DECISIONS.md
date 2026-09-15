# Decisions

Short record of choices that are expensive to reverse or easy to forget.
Newest first.

---

## DECISION-001 — Board members will sign in with Google, not GitHub

**Status:** implemented, awaiting a live test with a board member
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

Brought forward on 15 September 2026 so the flow could be tested before the
board is invited.

The editor is chosen at build time by the `DECAPBRIDGE_SITE_ID` environment
variable, so the switch is reversible without touching code:

| `DECAPBRIDGE_SITE_ID` | Editor | Sign-in |
| --- | --- | --- |
| set | Decap CMS 3.16.2 | DecapBridge — email invite, then Google |
| unset | Sveltia CMS | GitHub OAuth via `src/pages/api/` |

Unset it in Vercel and redeploy to roll back.

### What this constrains in the meantime

`src/cms/collections.yml` must stay within **Decap's core widget set**, so the
migration is a config change rather than a rewrite. This is enforced: the build
fails if a non-core widget appears (see `src/pages/admin/config.yml.ts`).

Audited 15 September 2026 — widgets in use are `boolean`, `datetime`, `file`,
`image`, `markdown`, `number`, `select`, `string`, `text`. All Decap core.

### Remaining work

Done: the switchable editor, the git-gateway backend, the Decap shell, and the
build guard.

Still to do, once a board member has signed in with Google and saved an edit:

1. Delete `src/pages/api/auth.ts` and `src/pages/api/callback.ts`.
2. Delete the `GITHUB_OAUTH_ID` / `GITHUB_OAUTH_SECRET` Vercel variables.
3. Delete the "MHC Historical Society CMS" GitHub OAuth app.
4. Remove the Sveltia branch from `src/pages/admin/index.astro`.

Keep the fallback until that test passes — do not remove it sooner.

Free for 10 collaborators; $9/month or $199 once beyond that.
