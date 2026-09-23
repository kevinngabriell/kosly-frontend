# Mock Accounts

Reference credentials for the three personas, for use once auth is wired up
(seeding a dev database, mocking the API, manual QA of the `/login` and
`/register` flows, etc). **These don't work against anything today** — the
forms at `/register` and `/login` already POST to `/api/v1/auth/register` and
`/api/v1/auth/login`, but no backend exists yet, so submitting the real form
will just fail. This doc exists so whoever builds the API (or a mock of it)
has a consistent, ready-made set of accounts to seed against.

All accounts share one dev-only password: **`Kosly1234!`** (meets the
register form's 8-character minimum).

| Role | Name | Email | Phone | Notes |
|---|---|---|---|---|
| Owner (`owner`) | Budi Santoso | owner@kosly.dev | 081234567890 | Owns "Kos Melati", the property used below |
| Resident (`tenant`) | Ditta Amelia | resident@kosly.dev | 081298765432 | Same "Ditta" used in the landing page's hero mockup — Room 4B, rent paid |
| Caretaker (`caretaker`) | Sri Wahyuni | caretaker@kosly.dev | 081345678901 | Manages day-to-day logging for "Kos Melati" |

## Sample property

For seeding data that ties the three accounts together:

- **Property**: Kos Melati, Jl. Kenanga No. 12, Yogyakarta
- **Room**: 4B, occupied by Ditta Amelia, rent Rp 850.000/month
- **Sample payment**: Rp 850.000 logged by Sri Wahyuni (caretaker), today, status "Paid" — matches the `sampleAmountLabel` / `sampleBadge` copy in `messages/en.json` / `messages/id.json` (`landing.hero`).

## Never do this in production

Don't seed these into a staging or production database as-is — same email/
password across every environment is a real credential-stuffing risk the
moment a real backend exists. Treat this file as local/dev-only.
