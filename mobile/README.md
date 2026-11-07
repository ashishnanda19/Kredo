# Kredo mobile app

The native-feeling mobile app for Kredo, built on its own branch (`feature/mobile-app`) so the web app on `main` stays untouched until this is ready to merge.

## Ground rules

These carry over from the web app (see `CLAUDE.md`):

- Kredo is the app and technology partner. The lending partner assesses credit and moves all the money. The app never holds, pools or transfers funds, and coins are a display unit only.
- Every fee, rate, limit, window and threshold comes from `lib/policy.ts`, never hard-coded in the app.
- One engine, one number: Aura is a display layer over the existing engine. No second score, and no college, gender, caste, religion or location as an input.
- Costs are shown before consent, actions are idempotent, and copy follows the voice rules (slang only in headlines, empty states, tier names and success toasts).
- Never store or send ID photos, ID numbers or full account numbers. Keep masked values only.
- Keep real business details out of commits, issues and package metadata.

## Design

The screens and interactions are being designed in Claude Design. Exports and notes go in `mobile/design/` as they arrive.

## Working on this branch

- All mobile work goes on `feature/mobile-app` (or short branches cut from it), never straight to `main`.
- Every change is logged in [PROGRESS.md](PROGRESS.md) with the commit it landed in.
- Merge to `main` only when asked.
