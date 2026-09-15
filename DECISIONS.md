# Decisions

Short record of choices that are expensive to reverse or easy to forget.
Newest first.

---

## DECISION-001 - Board members will sign in with Google, not GitHub

**Status:** implemented and live; fallback removed 15 September 2026
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
  Git Gateway is deprecated - do not build on it.
- **Sanity or another hosted CMS.** Better editor, 20 free seats, but content
  leaves the repository and every page needs rewriting against a query API.
  Reconsider only if we also want a materially stronger editor.

### When

Brought forward on 15 September 2026 so the flow could be tested before the
board is invited.

The editor is chosen at build time by the `DECAPBRIDGE_SITE_ID` environment
variable, so the switch is reversible without touching code:

Sveltia and the GitHub OAuth endpoints were kept as a fallback during the
switchover and have since been removed. To restore them, revert the commit that
deleted `src/pages/api/`.

DecapBridge offers two auth types. We use **PKCE**, which is the one that
supports Login with Google and needs Decap 3.8.3 or above. The generated
backend block is diffed field by field against the snippet DecapBridge issues.

The GitHub access token held by DecapBridge needs **Contents** and **Pull
requests** read-write, scoped to this repository only. If that token expires,
every CMS save fails - with nothing in the UI explaining why.

Unset it in Vercel and redeploy to roll back.

### What this constrains in the meantime

`src/cms/collections.yml` must stay within **Decap's core widget set**, so the
migration is a config change rather than a rewrite. This is enforced: the build
fails if a non-core widget appears (see `src/pages/admin/config.yml.ts`).

Audited 15 September 2026 - widgets in use are `boolean`, `datetime`, `file`,
`image`, `markdown`, `number`, `select`, `string`, `text`. All Decap core.

### Remaining work

Done: the Decap shell, the PKCE git-gateway backend, the build guard, and
removal of the Sveltia + GitHub OAuth fallback.

Outstanding, and safe to do once a board member has saved an edit successfully:

1. Delete the `GITHUB_OAUTH_ID` and `GITHUB_OAUTH_SECRET` Vercel variables.
   They are already inert - nothing reads them.
2. Delete the "MHC Historical Society CMS" GitHub OAuth app.

**Not yet verified:** an actual save through the gateway. Signing in proves
identity; saving is the first thing that exercises the GitHub token's write
permission, which was created Read-only and later corrected. Confirm one save
before inviting the wider board.

Free for 10 collaborators; $9/month or $199 once beyond that.
