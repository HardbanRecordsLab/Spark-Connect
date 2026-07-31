# Authenticated e2e tests

These specs run against a real, logged-in session and catch the class
of bug that unauthenticated smoke tests structurally cannot: a
component that renders fine syntactically but throws at runtime
because of a bad import or wrong prop name (e.g. `Crown`/`Flame` used
but never imported, both shipped to production and crashed their
screens for real users before being caught by manual testing rather
than by CI).

## Test account

A dedicated fixture account exists in production for this:
`e2e-tester@hardbanrecordslab.online`, with a complete profile
(`profile_complete = true`, `admin_approved = true`) so it lands
straight in the app shell instead of onboarding.

Credentials are **not** committed anywhere in this repo. Provide them
via environment variables when running these tests:

```
E2E_TEST_EMAIL=e2e-tester@hardbanrecordslab.online
E2E_TEST_PASSWORD=<see password manager / ask a maintainer>
```

For CI, add both as repository secrets (Settings → Secrets and
variables → Actions) alongside the existing `VITE_SUPABASE_URL` etc.
secrets already used by the `e2e` job.

`tests/auth.setup.ts` logs in once through the real UI and saves the
resulting session to `tests/.auth/user.json` (gitignored — it holds a
real access token) for every authenticated spec to reuse, so the
login form itself is only exercised once per run rather than once per
spec.

## What NOT to do here

Don't use this account for anything that mutates shared state other
tests or real users could observe (swiping on real people's profiles,
sending real gifts, etc.). Read-only "does this screen render without
throwing" checks are the point.
