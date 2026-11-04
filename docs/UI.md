# UI map

Screenshots of every key screen are in `docs/screens/` (`<name>.phone.png` at 360px wide, `<name>.desktop.png` at 1280px; regenerate with `npm run screens`). Light theme is the default; dark is available from the theme toggle.

## Look and feel
- **Tokens** in `app/globals.css`: surfaces `--page`, `--card`, `--elevated`; text `--ink`, `--ink-2` (secondary, AA on page and card); accent signal yellow `--accent` with dark `--accent-ink` (AAA); status text `--ok-text`, `--bad-text`, `--warn-text`, `--info-text`; pills `--pill-bg/--pill-fg`. Do not add colours. `lib/a11y.test.ts` checks contrast.
- **Components** (reuse, do not rebuild): `components/glass/` (`GlassCard`, `GlassButton`, `GlassInput`, `GlassSegmented`, `GlassSheet`), `components/ui/` (`Badge`, `Skeleton`, `Tooltip`), `components/forms/field.tsx` (label + control + error), `components/shared/` (`Logo`, `ThemeToggle`, `SuccessCheck`, `CategoryIcon`).
- **Shells**: student `components/dashboard/shell.tsx` (side rail on desktop, floating pill tab bar on phones), vendor `components/vendor/vendor-shell.tsx`, ops `components/ops/ops-shell.tsx`.
- **Patterns**: rounded glass cards, pill buttons, bottom sheets for confirmations (Radix dialog, focus trapped, Escape closes), yellow primary highlight, tabular numbers for money. Phones first at 360px, wider layouts are a bonus (except the Stage and ops, which are wide).
- **The demo label** `components/demo/demo-money-label.tsx` shows wherever money, stalls or students appear. `data-testid` attributes mark every important element for tests.

## Routes and what renders them
| Route | Screen | Component |
| --- | --- | --- |
| `/start` | Role chooser (student or stall) and persona jump-in | `components/demo/start-chooser.tsx` |
| `/dashboard` | Student home: coin card, scan and pay, due soon, Aura card, recent payments | `components/student/student-home.tsx` |
| `/dashboard/pay` (`?micro=1`) | Scan and pay: stall picker, camera, amount, confirm sheet with costs and PIN, receipt | `components/student/pay-world.tsx` |
| `/dashboard/loans`, `/dashboard/loans/[id]` | Payments by due date, detail and statement, repay sheet | `loans-world.tsx`, `loan-detail-world.tsx`, `repay-sheet.tsx` |
| `/dashboard/aura` | Aura score, quests with caps, last 10 events with reasons | `aura-world.tsx`, `quest-list.tsx` |
| `/dashboard/limit` | Limit ladder, what the next step needs, history | `limit-world.tsx` |
| `/dashboard/recovery` | Blocked and recovery steps | `recovery-world.tsx` |
| `/vendor`, `/payments`, `/settlements`, `/qr`, `/disputes`, `/profile` | Stall home with live feed, payments and refunds, settlements, QR, profile | `components/vendor/*` |
| `/vendor/onboarding/*` | Five-step wizard: details, ID check, bank check, agreement, status | `components/vendor/onboarding/*` |
| `/ops/vendors`, `/settlements`, `/flags`, `/exposure`, `/limits`, `/audit` | Internal ops console for the demo world | `components/ops/*` |
| `/demo` | Demo Stage: two live phone frames, scenarios, ledger strip, money-flow diagram | `components/demo/stage.tsx` |
| `/demo/flow` | The money-flow diagram, full screen | `components/demo/money-flow.tsx` |
| `/demo/metrics` | Investor metrics, every card labelled Simulated | `components/demo/metrics-page.tsx` |
| `/demo/frame` | First page inside a Stage phone frame (signs the frame in) | `components/demo/frame-boot.tsx` |

Screens with a demo-world version and an original portal version (`/dashboard`, `/pay`, `/loans`, `/aura`) show the world version only when someone is signed in to the demo world (`components/student/world-or.tsx`).

## How to see it running
`npm ci && npx next build && NEXT_PUBLIC_DEMO_CONTROLS=true npx next start`, open `/start` and pick a person, or open `/demo` for the Stage. The floating "Demo controls" button (bottom right) has Reset, clock jumps, persona jump-in, scenario buttons and outcome switches.
