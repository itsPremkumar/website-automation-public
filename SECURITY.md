# 🔒 Security Policy

## Reporting a Vulnerability
If you discover a security issue, **do not open a public issue**. Email the
maintainer privately or use GitHub's private vulnerability reporting.

## Secrets Handling (IMPORTANT)
This project reads credentials from a **`.env` file that is git-ignored**.
- ✅ `.env.example` is committed — it contains **only placeholders**.
- ❌ Never commit a real `GITHUB_TOKEN`. The old committed `.env` has been
  removed and the history rewritten (single shallow commit) to purge it.
- 🔑 If you ever committed a real token: **revoke it immediately** at
  https://github.com/settings/tokens, then rotate.

## Token Scopes
The deploy scripts need a GitHub PAT with:
- `repo` (full control of repositories)
- `workflow` (optional, only if you use GitHub Actions)
- `delete_repo` (optional, only if you delete repos via script)

Prefer a **fine-grained token** scoped to just the repos you deploy to.

## Supply-Chain
`npm install` pulls `dotenv`, `prompts`, `chalk` (dev-only). Audit with
`npm audit` before deploying anywhere sensitive.
