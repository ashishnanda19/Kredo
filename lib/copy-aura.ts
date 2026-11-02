/**
 * ALL Aura copy. Aura is the student-facing view of Kredo's in-app score; never call it a credit score.
 *
 * Voice rules (Part B, B1 and B6):
 *  - Slang only in the fun layer: tier names, chips, streaks, quests and success toasts.
 *  - Plain, calm and respectful for anything about money, due dates, overdue amounts, consent, errors and legal text.
 *  - Never shame a low score. Negative reasons get plain text and one concrete action, never a slang chip.
 *  - Limits are decided by the lending partner and are not guaranteed. Projections are estimates, not promises.
 */
import { BRAND } from "./config";

const B = BRAND.name;

export type TierId = "reset_arc" | "side_quest" | "locked_in" | "main_character" | "aura_farmer";

export const AURA = {
  /** Shown on every screen that shows Aura. Plain. */
  disclaimer: `${B}'s own in-app score. Not a credit bureau score and does not change your CIBIL or other bureau score.`,
  partnerDecides: "Limits are decided by the lending partner and are not guaranteed.",
  estimate: "Estimate, not a promise",

  nav: { home: "Aura", history: "History", levelUp: "Level up", wrapped: "Wrapped", about: "About Aura" },

  title: "Your Aura",
  gaugeLabel: (aura: number, tier: string) => `Aura ${aura} out of 100, tier ${tier}`,
  updated: (when: string) => `Last updated ${when}`,
  streak: (n: number) => (n === 1 ? "1-cycle streak" : `${n}-cycle streak`),
  boostsTitle: "What boosted your Aura",
  holdbacksTitle: "What's holding it back",
  noHoldbacks: "Nothing is holding your Aura back right now.",
  noBoosts: "Your first on-time repayment shows up here.",

  tiers: {
    reset_arc: { name: "Reset Arc", line: "Every on-time repayment from here moves your Aura up." },
    side_quest: { name: "Side Quest", line: "Building. Every on-time repayment counts." },
    locked_in: { name: "Locked In", line: "Consistent. Your limit can grow from here." },
    main_character: { name: "Main Character", line: "Strong record. Keep the streak going." },
    aura_farmer: { name: "Aura Farmer", line: "Top tier. Your on-time record is elite." },
  } satisfies Record<TierId, { name: string; line: string }>,
  freshSpawn: { name: "Fresh Spawn", line: "New here. Two on-time repayments and your Aura starts moving." },

  /** Positive codes: plain text plus a fun chip. */
  boosts: {
    ONTIME_STRONG: { text: "You've paid every recent loan on time.", chip: "Locked in on repayments" },
    CLEAN_PAYMENTS: { text: "Your recent payments went through first time.", chip: "Smooth payer" },
    EARLY_REPAY: { text: "You repaid early.", chip: "Early bird W" },
    TRACK_RECORD: { text: "You have a growing record of closed loans.", chip: "Lore building" },
    ID_VERIFIED: { text: "Your identity and college checks are complete.", chip: "Verified" },
    LOW_UTILISATION: { text: "You use less than half your limit.", chip: "Not maxing out" },
    BUREAU_POSITIVE: { text: "Your credit bureau record, shared with your consent, helps.", chip: "Clean record" },
    THIN_FILE: { text: "We need a bit more history to rate you fully.", chip: "Fresh spawn" },
  } as Record<string, { text: string; chip: string }>,

  /** Negative codes: plain text and one concrete action. No chips, no slang. */
  holdbacks: {
    LATE_RECENT: { text: "A recent repayment was late.", action: "Set a repayment reminder", href: "/dashboard/profile" },
    OVERDUE_NOW: { text: "You have an amount overdue. Paying it helps right away.", action: "Pay now", href: "/dashboard/loans" },
    PAYMENT_FAILURES: { text: "Some recent payment attempts did not go through.", action: "Check your payment method", href: "/dashboard/loans" },
    ROLLOVER: { text: "You often borrow again right after repaying.", action: "Plan your next loan", href: "/dashboard/loans" },
    STACKING: { text: "You have several loans open at once.", action: "Repay one loan first", href: "/dashboard/loans" },
    HIGH_UTILISATION: { text: "You often use almost all of your limit.", action: "Set a spending reminder", href: "/dashboard/profile" },
    CREDIT_HUNGER: { text: "You asked for several limit increases recently.", action: "See how limits grow", href: "/dashboard/aura/level-up" },
    SETTLED_OR_RESTRUCTURED: { text: "A past loan was settled or restructured.", action: "Talk to support", href: "/dashboard/support" },
    PHONE_NEW: { text: "Your phone number was added recently. This fades with time.", action: "Review your profile", href: "/dashboard/profile" },
    BUREAU_NEGATIVE: { text: "Your credit bureau record, shared with your consent, holds this back.", action: "Ask about this", href: "/dashboard/aura/about#dispute" },
  } as Record<string, { text: string; action: string; href: string }>,
  unknownHoldback: { text: "Something in your recent history is holding your Aura back.", action: "Ask support", href: "/dashboard/support" },

  /** Knockouts and holds. Plain and calm; the tier is not shown next to these. */
  notices: {
    KO_OVERDUE_30: {
      title: "New loans are paused",
      body: (amount: string) => `New loans are paused because ${amount} is overdue. Paying it lifts the pause.`,
      action: { label: "Pay now", href: "/dashboard/loans" },
    },
    KO_DPD90_12M: {
      title: "New loans are paused",
      body: () => "A loan was more than 90 days overdue in the last 12 months. New loans resume after 12 months of on-time repayments, or after a review by the lending partner.",
      action: { label: "Contact support", href: "/dashboard/support" },
    },
    KO_WRITTEN_OFF: {
      title: "New loans are paused",
      body: () => "A past loan was written off. The lending partner can review this with you.",
      action: { label: "Contact support", href: "/dashboard/support" },
    },
    KO_FRAUD: {
      title: "Your account is on hold",
      body: () => "Our team is checking some recent activity. We will contact you, and you can reach support any time. You can still repay as normal.",
      action: { label: "Contact support", href: "/dashboard/support" },
    },
    KO_KYC: {
      title: "Finish your identity check",
      body: () => "Complete KYC to continue. It takes a few minutes.",
      action: { label: "Complete KYC", href: "/verify/kyc" },
    },
    KO_DUPLICATE: {
      title: "We need to check your account",
      body: () => "These details are linked to another account. Our team will help sort it out.",
      action: { label: "Contact support", href: "/dashboard/support" },
    },
    KO_CONSENT: {
      title: "Aura is frozen",
      body: (date: string) => `You withdrew consent for Aura on ${date}. Your Aura is frozen, not deleted. New loans are paused until you grant consent again.`,
      action: { label: "Review consent", href: "/dashboard/profile/privacy" },
    },
    HELD: {
      title: "New loans are on hold",
      body: () => "Our team is reviewing some recent activity. This usually takes a day. You can still repay as normal.",
      action: { label: "Contact support", href: "/dashboard/support" },
    },
  } as Record<string, { title: string; body: (x: string) => string; action: { label: string; href: string } }>,

  states: {
    loading: "Loading your Aura",
    noScoreTitle: "Your Aura is on its way",
    noScoreBody: "Your Aura appears once your verification is complete. It usually takes a moment.",
    unavailableTitle: "Aura is taking a break",
    unavailableBody: (date: string) => `We can't reach the latest Aura right now. This is your last known Aura, from ${date}.`,
    unavailableNoCache: "We can't reach your Aura right now. Please try again in a few minutes.",
    retry: "Try again",
    sample: "Showing sample Aura data",
  },

  history: {
    title: "Aura history",
    subtitle: "Your daily Aura and what moved it.",
    ranges: [
      { days: 30, label: "30 days" },
      { days: 90, label: "90 days" },
      { days: 180, label: "6 months" },
    ],
    chartLabel: (from: number, to: number, days: number) => `Aura over the last ${days} days, from ${from} to ${to}`,
    tapHint: "Tap a moment to see what happened.",
    empty: "Your Aura history starts with your first day on Kredo.",
    frozen: "Your Aura is frozen while consent is withdrawn, so the line stops there.",
    markers: {
      repaid_early: { label: "Repaid early", text: (amount: string) => `You repaid ${amount} early.` },
      repaid_on_time: { label: "Repaid on time", text: (amount: string) => `You repaid ${amount} on time.` },
      repaid_late: { label: "Repaid late", text: (amount: string) => `A ${amount} repayment came in after the due date.` },
      level_up: { label: "Limit level up", text: (amount: string) => `Your recommended limit moved up to ${amount}.` },
      level_down: { label: "Limit level down", text: (amount: string) => `Your recommended limit moved to ${amount} after a late repayment.` },
    },
  },

  levelUp: {
    title: "Level up",
    subtitle: "Quests, your limit ladder, and a what-if.",
    questsTitle: "Quests",
    quests: {
      repay_early: { title: "Repay 2 days early", done: "Done. Early repayments lift Aura.", chip: "Early bird W" },
      reminder: { title: "Set a repayment reminder", done: "Reminder set. Badge earned." },
      verify: { title: "Finish verification", done: "Verified. Badge earned." },
      statement: { title: "Review your monthly statement", done: "Statement reviewed. Badge earned.", cta: "Open statements" },
    },
    badge: "Badge",
    auraChip: "Aura up",
    ladderTitle: "Limit ladder",
    current: "You are here",
    cyclesTo: (n: number, amount: string) => (n === 1 ? `1 more clean cycle to ${amount}` : `${n} more clean cycles to ${amount}`),
    top: "You're at the top level.",
    noLevel: "Your first level unlocks after verification.",
    cleanCycle: "A clean cycle is a loan of at least 30% of your limit, open at least 7 days, repaid in full on time.",
    blockers: {
      verification: "Finish verification to unlock the first level.",
      band: "Keep repaying on time to qualify for the next level.",
      frozen: "Clear the overdue loan, then two on-time loans restart your climb.",
      months_on_kredo: "The next level opens after more time on Kredo.",
      step_up_wait: "Levels go up at most once every 30 days.",
    } as Record<string, string>,
    whatIfTitle: "What if",
    whatIfBody: (amount: string, due: string) => `Your ${amount} loan is due on ${due}. Slide to see how repaying earlier could move your Aura.`,
    whatIfLabel: "Days before the due date",
    whatIfDays: (n: number) => (n === 0 ? "On the due date" : n === 1 ? "1 day early" : `${n} days early`),
    whatIfResult: (aura: number, date: string) => `Estimated Aura by ${date}: ${aura}`,
    whatIfNow: (aura: number) => `Now: ${aura}`,
    whatIfFlat: "No change expected by then. Aura rises at most a set amount each month, so steady repayments keep counting.",
    whatIfNone: "The what-if appears when you have a loan to repay.",
    whatIfError: "We couldn't work out an estimate just now. Please try again.",
    whatIfBusy: "Too many tries in a short time. Please wait a minute.",
  },

  wrapped: {
    title: "Aura Wrapped",
    subtitle: "Your month in Aura.",
    cardLabel: (i: number, n: number) => `Card ${i} of ${n}`,
    change: { title: "Aura this month", up: (n: number) => `Up ${n}`, down: (n: number) => `Down ${n}`, flat: "Holding steady" },
    streak: { title: "Your streak", none: "Your streak starts with your next on-time repayment." },
    onTime: { title: "On-time repayments", body: (n: number) => (n === 1 ? "1 on-time repayment" : `${n} on-time repayments`) },
    best: { title: "Best moment", levelUp: "Your limit level went up.", early: "You repaid early.", peak: (n: number) => `You hit Aura ${n}.`, none: "Your best moment is coming." },
    tip: { title: "One tip", fallback: "Repaying a couple of days early is the quickest way to lift Aura." },
    share: { title: "Share card", body: "Shows your tier and streak only. Never amounts or dates.", button: "Share", copied: "Copied to clipboard", text: (tier: string, streak: number) => `I'm ${tier} on ${B} Aura${streak ? ` with a ${streak}-cycle streak` : ""}.` },
    prev: "Previous card",
    next: "Next card",
  },

  about: {
    title: "About Aura",
    sections: [
      { id: "what", title: "What Aura is", body: `Aura is ${B}'s own in-app score, from 0 to 100. It shows how your repayments are going on ${B}. It is not a credit bureau score and does not change your CIBIL or any other bureau score.` },
      { id: "moves", title: "What moves it", body: "Repaying on time and early, clearing anything overdue, keeping to one loan at a time, and building a record of closed loans. Late repayments and missed payments lower it. It moves at most a set amount each month, so it stays steady." },
      { id: "never", title: "What never moves it", body: "Your college name, gender, religion, caste, where you are from, your name or photo, and how much you borrow. Borrowing more never raises Aura." },
      { id: "partner", title: "Who decides your limit", body: "The lending partner decides every loan and limit. Aura and the limit ladder are recommendations, and limits are not guaranteed." },
      { id: "data", title: "Your data", body: "Aura uses your repayment history on Kredo, with your consent. You can withdraw consent in Privacy settings; your Aura is then frozen, not deleted, because lending records must be kept by law." },
    ],
    disputeTitle: "Think something is wrong?",
    disputeBody: "Tell us which record looks wrong. We review every request and reply with a reference number.",
    grievanceTitle: "Grievance contact",
  },

  widget: {
    title: "Aura",
    open: "See your Aura",
    paused: "New loans are paused. Tap to see why.",
    held: "New loans are on hold. Tap to see why.",
  },

  demo: {
    group: "Aura presets",
    presets: {
      auto: "From portal state",
      fresh_spawn: "Fresh Spawn",
      locked_in_streak: "Locked In streak",
      late_payer_recovering: "Late payer recovering",
      knockout_overdue_35: "Knockout: overdue 35 days",
      collusion_alert: "Collusion alert",
      held_for_review: "Held for review",
      consent_frozen: "Consent withdrawn",
      unavailable: "Service unavailable",
    },
  },
} as const;
