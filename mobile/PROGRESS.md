# Mobile app progress log

One line per change, newest first. Each entry names the commit that holds it.

| Date | Change | Commit |
|---|---|---|
| 2026-11-07 | Feature coverage pass against the web spec: log in and sign up with phone and OTP (Login, Join, two code screens); Activity with filters; limit ladder; repayment detail with breakdown and statement; repay all or part with slide to repay and a Repaid screen with Aura reason; calm Payments paused recovery; notifications; Aura quests with claim; help with FAQs and a ticket form; privacy toggles with data download and delete request; over-limit error in the pay sheet; vendor Payments with refunds before payout and Insights charts; vendor dock now has five tabs. Home links to all of these. 16 new screens, 40 in total. | this commit |
| 2026-11-07 | Splash: added a soft light-ray burst that turns slowly behind the K, a thin orbit ring with a dot, a dashed outer ring and twinkling sparkles, on top of the warm glow. | this commit |
| 2026-11-07 | Splash: a light warm glow now sits right behind the big K, and the bottom wordmark is plain "Kredo" text (no small K with a dot) that eases in from wide letter-spacing and blur, followed by a short underline, the tagline and the tap pill. | this commit |
| 2026-11-07 | Splash wordmark fixed again: "redo" now uses a real rounded bold font (Fredoka) beside the K with its dot, so the letters are smooth and even instead of hand-drawn shapes. Letters still pop in one by one. | this commit |
| 2026-11-07 | Splash wordmark redrawn: K, r, e, d, o are now all drawn with the same rounded stroke as the K (no sharp corners), and they pop in one by one while the big K draws, with a small bounce, and the small K dot drops in with the big one. | this commit |
| 2026-11-07 | Splash: restored the first K-then-dot draw animation (no rings). The wordmark is now one black logotype, K with its dot plus r, e, d and o, set at one height so everything lines up. | this commit |
| 2026-11-07 | Splash refinement: the K wipes in first and the dot drops in after it, background rings removed, the wordmark is a black K with its dot followed by a white "redo", and "Tap to continue" is now a black pill with a nudging arrow. | this commit |
| 2026-11-07 | Onboarding rework: new yellow Splash (animated K with its dot, "Kredo", "Pay at campus, settle later."), Student / Vendor switch at the top of both welcome screens replacing the bottom vendor and student links, and the intro slides now show only a headline. | this commit |
| 2026-11-07 | Slide to pay now goes straight to the yellow Paid screen when the thumb reaches the end (the "Payment sent" pop-up is removed). Student Welcome and Verify screens now link to vendor sign-up ("If you are a vendor, please sign up here"). | this commit |
| 2026-11-07 | Fix: slide to pay now completes when the thumb reaches the end (not on release) and shows a "Payment sent" pop-up with the amount and vendor before continuing to Paid. Added a tap fallback. Applies to Scan and Confirm. | this commit |
| 2026-11-07 | Vendor onboarding added (Vendor welcome, Stall details with GPS pin, Verify your stall with document and masked payout bank, Reviewing, You are live), plus a final spacing and detail pass across all 28 screens (text wraps, line lengths, alignment, step timeline). | this commit |
| 2026-11-07 | Profile screens: student Profile (name, phone, email, course, year editable; college and masked student ID locked as lender-verified) opened from the Home avatar, and vendor Stall profile (owner, stall, hours, map pin, masked payout bank) opened from the stall avatar. Edit, Cancel, Save with a toast. | this commit |
| 2026-11-07 | Design refresh of onboarding (animated intro carousel, ID scan tiles with a progress step, new Reviewing screen, limit reveal) and the vendor side (Kredo card style Today with an open/closed switch, animated stall QR, payment received with an equaliser and ripples, live payout countdown). Whole app now shares one style. | this commit |
| 2026-11-07 | Design refresh of the student flow after reviewing PhonePe, Google Pay, Paytm and Slice patterns: Kredo card hero on Home, floating dock with Aura and Passport, GPS Near you with slide to pay, animated Paid (check draw, ripple, confetti), ticket receipt with a live timeline, count-up numbers and rings. Reasons screen merged into Aura. Onboarding and vendor screens still use the older minimal style. | this commit |
| 2026-11-07 | Design 1 updated: new Scan screen with a GPS "Near you" list of partner vendors (tap one, type the amount, pay without scanning). Scan button now opens it; the QR confirm screen follows a scan. | this commit |
| 2026-11-07 | Design 3: Aura and Credit Passport (Aura, Why it changed, Credit Passport). Home Aura chip now opens Aura. Same canvas. | this commit |
| 2026-11-07 | Design 4: vendor side (Today, Stall QR, Payment received, Payouts). Same canvas. | this commit |
| 2026-11-07 | Design 2 in the same canvas: onboarding and verify (Welcome, Verify, Limit unlocked). https://claude.ai/artifact/9yGhw78VmcJ6sLquC7q5FQ | this commit |
| 2026-11-07 | Design 1 in Claude Design: core student flow (Home, Scan and pay, Paid, Receipt, Dues), minimal and interactive. https://claude.ai/artifact/9yGhw78VmcJ6sLquC7q5FQ | this commit |
| 2026-11-07 | Branch created from `main`; added `mobile/README.md` (ground rules) and this log | see git log |

## Still web-only or not designed

- Ops console (verification queue, fraud flags, exposure, limits override): stays on the web.
- Presenter tools (Demo Stage, Director, metrics): web only.
- Real camera QR scan and the real bank and lender handoff (the screens simulate them).
- Vendor disputes thread and support, vendor KYC agreement step, student partial-payment schedule beyond the repay sheet.
- Dark theme and language options.

## Open decisions

- Profile edits: which fields the lending partner must re-verify when changed (phone, email) and how "Privacy and data" handles DPDP access and erasure requests.

- Nearby vendors: real GPS needs a vendor location field and a nearby query on the backend, and location permission copy. Location is used only to find vendors and never as an Aura input.
- Tech stack for the app (native, React Native or a wrapper around the web app).
- Next: review designs 1 to 4 together, then decide the tech stack and start building the app from them.
- How the app talks to the demo world and, later, a real backend.
