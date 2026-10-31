# Kredo (placeholder name): student pay-later web experience

Front-end only. **Demo preview, no real money.** No backend, auth, payments or network calls.
Neon-violet "nightclub meets iOS glass" visuals, scroll-driven landing page with a persistent 3D card.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

| Route | What |
|---|---|
| `/` | Landing: pinned scroll scenes, persistent 3D card, 3D score gauge, horizontal vendor strip |
| `/verify` | 4-step verification in a glass sheet (any 6-digit OTP works), coin rain on unlock |
| `/dashboard` | Home: 3D tilt card, 3D score gauge, neon charts. `?demo=error` / `?demo=empty` preview states |
| `/dashboard/pay` · `/activity` · `/profile` | Secondary screens |

## Where things live
- `lib/theme.ts` + `app/globals.css`: colours, blur levels, glow, easing, springs (single source of truth)
- `lib/copy.ts`: ALL copy (Gen Z voice; slang stays out of money, fees, dates, consent, errors and legal text)
- `lib/config.ts`: brand name and pricing constants. `lib/mock-data.ts`: mock data
- `components/glass/`: GlassCard, GlassNav, GlassButton, GlassSheet, GlassInput, GlassSegmented
- `components/three/`: R3F (client only): card mesh, neon lighting, 3D gauge, coin shower
- `components/landing/scenes/`: GSAP ScrollTrigger scenes + the "card rig" (one pose object the scroll timeline writes and renderers read)
- `lib/quality.tsx`: adaptive tiers (high / mid / low) from cores, memory, screen, reduced motion and detect-gpu

## Rules of the house
- GSAP animates scroll scenes and the card rig. Framer Motion animates UI micro-interactions. Never both on one element.
- 3D never blocks first paint: WebGL mounts after load + idle (high tier) or first interaction (others).
- Low tier or no WebGL: CSS 3D card, CSS confetti, lighter blur. Reduced motion: no pinning, scrubbing, parallax or idle motion.

All names, colleges, vendors, amounts, fees and contact details are placeholders.

## Portal, KYC, loans and internal ops (frontend mock)
Everything below is mock state in a thin zustand store (`lib/store`), persisted as status flags only. ID photos and identity numbers are never stored or sent.

| Area | Routes |
|---|---|
| Auth (FR-01) | `/login`, `/signup`, `/recover`, `/dashboard/profile`, `/dashboard/profile/privacy` |
| Verification and KYC (FR-02/03) | `/verify`, `/verify/status`, `/verify/kyc` |
| Loans (FR-04/05) | `/dashboard/loan/apply`, `/dashboard/loans`, `/dashboard/loans/[id]`, `/dashboard/loans/[id]/statement`, `/dashboard/receipts/[paymentId]` |
| Credit profile (FR-06, flag) | `/dashboard/credit-profile` |
| Support (FR-07) | `/dashboard/support`, `/dashboard/support/[ticketId]` |
| Internal ops (FR-08 to 12) | `/ops`, `/ops/verifications[/id]`, `/ops/fraud`, `/ops/loans`, `/ops/support[/id]` |

Env flags (`.env.local`, see `.env.example`): `NEXT_PUBLIC_DEMO_CONTROLS=true` shows the floating Demo Controls panel (every state, presets, ops role, reset). `NEXT_PUBLIC_PHASE2_CREDIT_PROFILE=true` enables the credit profile. Demo Controls are development only and must be removed for production.
Tip: Demo Controls > "Verified + active loan" jumps straight to a populated dashboard.
# Kredo
