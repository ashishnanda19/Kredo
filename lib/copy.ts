/**
 * ALL user-facing copy lives here so it is easy to edit.
 *
 * Voice rules (see also the project brief):
 *  - Playful Gen Z tone in simple English with light Hinglish, max ONE slang term per paragraph.
 *  - Allowed vibe words, used sparingly: no cap, locked in, lowkey, vibe check, main character, W, slay, fr, bet.
 *  - NO slang in anything about money amounts, fees, due dates, consent, errors or legal text.
 *  - Never pressure students to borrow or spend (no FOMO, no "treat yourself").
 *  - Never claim RBI approval, guaranteed approval or zero interest.
 */
import { BRAND } from "./config";
import { PORTAL } from "./copy-portal";
import { LANDING } from "./copy-landing";

const B = BRAND.name;

const BASE = {
  /** Plain and serious. No slang. */
  legal: {
    demoTag: "Demo preview, no real money, nothing is uploaded",
    disclosure: "Credit offered by our regulated lending partner.",
    notLender: `${B} is an app and is not a bank or lender. Credit, if approved, is provided by the lending partner on their terms.`,
    nudge: "Borrow only what you can repay.",
    footer: `© 2026 ${B} (placeholder brand). Demo preview, no real money.`,
  },

  nav: {
    links: [
      { href: "#how-it-works", label: "How it works" },
      { href: "#benefits", label: "Benefits" },
      { href: "#score", label: "Score" },
      { href: "#vendors", label: "For vendors" },
      { href: "#faq", label: "FAQ" },
    ],
    cta: "Get early access",
    demo: "Peek at the demo app",
  },

  hero: {
    eyebrow: "Made for college students in India",
    titleA: "Broke till the 1st?",
    titleB: "We got you, no cap.",
    sub: "A small limit for chai, prints and snacks. Tap and pay at campus vendors, then repay later.",
    primary: "Get early access",
    secondary: "See how it works",
    cardAlt: `Your ${B} virtual card. It only works inside the app.`,
    chips: ["Paid at Campus Cafe, ₹120", "Score up by 4", "Limit unlocked"],
  },

  proof: {
    line: "Built for students at campuses across India",
  },

  how: {
    eyebrow: "How it works",
    title: "Three taps from broke to chai.",
    steps: [
      {
        tag: "Step 1",
        title: "Verify with your college email",
        body: "A quick OTP and a photo of your college ID. Takes about two minutes. Vibe check, but make it official.",
        side: "Verified student badge",
      },
      {
        tag: "Step 2",
        title: "Get your limit",
        body: "Most students start small, around ₹1,000. It can change as you repay on time. It is not guaranteed.",
        side: "Works only inside this app",
      },
      {
        tag: "Step 3",
        title: "Tap and pay at campus vendors",
        body: "Scan the vendor's QR, check the total, confirm. You repay later in the app.",
        side: "Tap to pay",
      },
    ],
  },

  benefits: {
    eyebrow: "Why students like it",
    title: "Simple. Small. Clear.",
    items: [
      { title: "No credit card needed", body: "Just your college email and ID. No card, no paperwork pile." },
      { title: "Starts small", body: "A modest limit, so it's easy to stay in control." },
      { title: `Builds your ${B} Score`, body: "Repay on time and watch your in-app score climb. Lowkey satisfying." },
      { title: "Works at campus vendors", body: "Canteen, cafe, stationery, photocopy and laundry." },
      { title: "Simple repayments", body: "One tap to repay, with reminders before the due date." },
      { title: "Fees shown upfront", body: "You see the total and the due date before you confirm. Always." },
    ],
  },

  score: {
    eyebrow: `Your ${B} Score`,
    title: "Repay on time. Level up.",
    body: "Every on-time repayment nudges your score up. A higher score can open up a bigger limit over time. Drag the slider to see how it grows.",
    disclaimer:
      "This is our own in-app score, shown here for illustration. It is not a credit bureau score. Limits are decided by our lending partner and are not guaranteed.",
    sliderLabel: "Months of on-time repayments",
    limitLabel: "Illustrative limit",
    justJoined: "Just joined",
    bands: {
      building: { label: "Building", blurb: "Just getting started" },
      good: { label: "Locked in", blurb: "You're on track" },
      great: { label: "Main character", blurb: "Excellent repayment habits" },
    },
    tips: [
      { title: "Repay before the due date", gain: "+4 pts" },
      { title: "Keep usage under 50% of your limit", gain: "+3 pts" },
      { title: "Use it regularly, in small amounts", gain: "+2 pts" },
    ],
  },

  vendors: {
    eyebrow: "For campus vendors",
    title: "Run a shop near campus?",
    body: `Accept ${B} and let students pay now, even in the last week of the month.`,
    cta: "Become a partner",
    stripTitle: "Campus vendors on the app",
    perks: [
      { title: "More footfall", body: "Students who are short on cash today can still buy today." },
      { title: "Quick settlement", body: "Get paid fast. Settlement timelines are shown upfront." },
      { title: "No cash handling", body: "Scan, confirm, done. No change, no counting." },
    ],
    form: {
      title: "Become a partner",
      intro: "Tell us about your shop and we'll reach out. (Preview only, nothing is sent.)",
      shop: "Shop name",
      campus: "Campus or college nearby",
      submit: "Send interest",
      doneTitle: "Thanks, we'll be in touch",
      doneBody: "This is a preview, so nothing was sent.",
    },
  },

  trust: {
    eyebrow: "Trust and safety",
    title: "Clear about who does what.",
    cards: [
      {
        title: "Your data, your call",
        body: "We ask only for what's needed to verify you and say why at each step. Read the privacy notice before you sign up.",
      },
      {
        title: "We're the app, not the lender",
        body: `${B} is the interface. Credit is offered by our regulated lending partner. Their name and terms are shown before you confirm anything.`,
      },
      { title: "Something wrong? Tell us", body: "" /* filled from GRIEVANCE in the component */ },
    ],
  },

  faq: {
    eyebrow: "FAQ",
    title: "Questions? Sorted.",
    items: [
      {
        q: "Who actually gives me the credit?",
        a: `A regulated lending partner. ${B} is the app you use. The partner provides the credit and you will see their name before you confirm anything.`,
      },
      {
        q: "Is it free to use?",
        a: "Any fee is shown upfront, along with your total repayable amount and due date, before you tap confirm. If we don't show it, you're not charged it.",
      },
      {
        q: "How much limit will I get?",
        a: "Most students start with a small limit, around ₹1,000. It can change over time as you repay on time. Limits are decided by our lending partner and are not guaranteed.",
      },
      {
        q: "What if I can't repay on time?",
        a: "We send reminders before the due date. If you think you will miss it, reach out to us early. Late charges, if any, are listed in the terms and shown to you upfront.",
      },
      {
        q: "Will everyone get approved?",
        a: "No. Approval is decided by our lending partner after verification. Verifying your college email and ID is the first step.",
      },
      {
        q: "Where can I use it?",
        a: "At campus and nearby vendors that accept the app: canteens, cafes, stationery, photocopy and laundry shops. It only works inside this app.",
      },
      {
        q: `What is the ${B} Score?`,
        a: `It's our own in-app score that grows when you repay on time. It is not a credit bureau score. Your lending partner may share repayment data as per their policy.`,
      },
      {
        q: "Is my data safe?",
        a: "We only ask for what's needed to verify you, and we explain why at every step. Read the privacy notice before you sign up. (Placeholder copy for this preview.)",
      },
    ],
  },

  signup: {
    eyebrow: "Early access",
    title: "Be first on campus.",
    body: `Drop your details and we'll let you know when ${B} reaches your college.`,
    name: "Your name",
    college: "College",
    email: "College email",
    emailPlaceholder: "you@college.ac.in",
    submit: "Get early access",
    busy: "Adding you…",
    doneTitle: "You're on the list. W.",
    doneBody: "(Preview only, nothing was sent.)",
  },

  footer: {
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Grievance", href: "#grievance" },
      { label: "Partner with us", href: "#vendors" },
      { label: "Demo app", href: "/dashboard" },
    ],
  },

  /** Verify flow. Reasons and errors stay plain. */
  verify: {
    stepNames: ["Email", "College ID", "KYC", "Done"],
    email: {
      title: "What's your college email?",
      why: "It tells us you're a real student at a real campus. We'll send a 6-digit code to confirm it's you.",
      label: "College email",
      send: "Send code",
      sending: "Sending code…",
    },
    otp: {
      title: "Enter the 6-digit code",
      why: (email: string) => `We sent it to ${email}. This makes sure the email is really yours.`,
      verify: "Verify",
      checking: "Checking…",
      change: "Change email",
      resend: "Resend code",
      needAll: "Enter all 6 digits. Any code works in this demo.",
    },
    id: {
      title: "Show us your college ID",
      why: "A quick look at your ID card confirms you're currently enrolled. We only use it to verify you.",
      drop: "Drag and drop your ID here",
      hint: "JPG or PNG, up to 5 MB",
      choose: "Choose file",
      camera: "Use camera",
      change: "Choose a different photo",
      local: "Demo only: the photo stays in your browser and is never uploaded.",
      scanning: "Scanning…",
      continue: "Continue",
      checking: "Checking your ID…",
      missing: "Add a photo of your college ID to continue.",
    },
    kyc: {
      title: "Quick KYC",
      why: "Our lending partner has to confirm who you are before they can offer you credit. It's a one-time step.",
      demoNote: "Demo mode. Please don't enter real personal details. Made-up values are fine.",
      consent: "I agree to share these details with the lending partner for verification.",
      submit: "Submit",
      submitting: "Verifying…",
    },
    success: {
      title: (name: string) => `You're in, ${name}!`,
      sub: "Your college is verified. Vibe check passed.",
      limitLabel: "Your credit limit",
      limitTip: "The most you can have outstanding at any time. It can change over time.",
      note: "Use it at campus vendors and repay later in the app.",
      demoNote: "This is a demo number. Real limits are decided by the lending partner and aren't guaranteed.",
      cta: "Go to my dashboard",
    },
  },

  dashboard: {
    hey: "Hey there",
    available: "Available to spend",
    availableTip: "Your limit minus what you've already used. It goes back up when you repay.",
    totalLimit: "total limit",
    totalLimitTip: "The most you can have outstanding at any time. It can change as you repay.",
    used: "Used",
    replay: "Replay limit unlock",
    pay: "Pay at a vendor",
    flip: { front: "Show card front", back: "Show card back", show: "Show details", hide: "Hide details" },
    quick: { scan: "Scan and pay", repay: "Repay now", increase: "Request limit increase", history: "History" },
    due: {
      title: "Next due",
      tip: "The date by which this amount should be repaid.",
      clearTitle: "Nothing due",
      clearBody: "You're all clear. Nothing to repay right now.",
      soonHint: "Repay early to stay on track",
    },
    score: {
      title: `Your ${B} Score`,
      tip: "Our own in-app score (0 to 100). It goes up when you repay on time. It is not a credit bureau score.",
      levelUp: "3 ways to level up",
    },
    recent: { title: "Recent activity", seeAll: "See all", emptyTitle: "No spends yet", emptyBody: "Your wallet is on a lowkey break.", emptyCta: "Make your first payment" },
    spend: { title: "Spending by category", emptyTitle: "Nothing to show yet", emptyBody: "Your breakdown appears after your first payment." },
    loans: { title: "Campus credit spends", tip: "Your campus spends are grouped by week. Each group has its own due date.", emptyTitle: "No active loans", emptyBody: "You don't owe anything right now." },
    vendors: { title: "Campus vendors near you", badge: "Accepts" },
    nudge: { body: "Pay only for what you need. Struggling to repay? Reach out early, we can help." },
    notifications: "Notifications",
    repay: {
      title: "Repay now",
      amountDue: "Amount due",
      amountTip: "What you owe for these spends.",
      dueDate: "Due date",
      dueTip: "Pay by this date to stay on track.",
      total: "Total to repay",
      confirm: (amt: string) => `Repay ${amt}`,
      busy: "Processing…",
      doneTitle: "Repaid on time. That's a W.",
      doneBody: "On-time repayments help your score. (Demo: nothing real happened.)",
      done: "Done",
    },
    increase: {
      title: "Request a higher limit",
      body: (score: number) => `Your score is ${score}. Pick what you'd like. The lending partner decides, and it's not guaranteed.`,
      note: "A bigger limit means more to repay.",
      send: "Send request",
      doneTitle: "Request received",
      doneBody: "Our lending partner will review it. Increases aren't guaranteed. (Demo only.)",
      done: "Got it",
    },
  },

  pay: {
    title: "Scan and pay",
    sub: "Scan the vendor's QR, or pick them below.",
    vendor: "Vendor",
    amount: "Amount",
    review: "Review payment",
    pickVendor: "Pick a vendor or scan their QR.",
    enterAmount: "Enter an amount.",
    tooMuch: (avail: string) => `That's more than your available ${avail} (fee included).`,
    sheetTitle: "Confirm payment",
    sheetBody: "Check the details. You'll repay later in the app.",
    rows: { amount: "Amount", fee: "Platform fee", feeTip: "A small fee for this payment. It's shown here before you confirm.", total: "Total to repay", totalTip: "Amount plus fee. This is what you'll repay.", dueBy: "Repay by", dueTip: "Pay by this date to stay on track." },
    confirm: (amt: string) => `Confirm and pay ${amt}`,
    paying: "Paying…",
    successTitle: (amt: string) => `Paid ${amt}`,
    successBody: "We'll remind you before it's due. (Demo: no real money moved.)",
    home: "Back to home",
    again: "Make another payment",
    scan: { idle: "Tap to scan vendor QR", scanning: "Scanning…" },
  },

  activity: {
    title: "Activity",
    stillToRepay: (amt: string) => `${amt} still to repay`,
    search: "Search vendor or category",
    filters: [
      { value: "all", label: "All" },
      { value: "paid", label: "Paid" },
      { value: "due", label: "Due" },
    ],
    noMatchTitle: "Nothing matches",
    noMatchBody: "Try a different search or filter.",
    emptyTitle: "No spends yet",
    emptyBody: "Your wallet is on a lowkey break.",
    clear: "Clear filters",
  },

  profile: {
    title: "Profile",
    verified: "Verified student",
    limit: "Your limit",
    review: "Next review",
    increaseNote: "Limits are decided by our lending partner and aren't guaranteed.",
    settings: "Settings",
    reminders: { label: "Due date reminders", hint: "A heads-up before a repayment is due" },
    lock: { label: "App lock", hint: "Ask for fingerprint or PIN to open" },
    dark: { label: "Dark mode", hint: "Easier on the eyes at night" },
    help: "Help",
    helpCentre: "Help centre",
    grievance: "Raise a grievance",
    logout: "Log out (demo)",
  },

  states: {
    errorTitle: "That didn't load",
    errorBody: "Check your connection and try again. Your limit and balance are unchanged.",
    retry: "Try again",
  },
} as const;

/** Slim helper for components that map score to a band label. */
export type ScoreBandKey = keyof typeof COPY.score.bands;

/** Landing + core copy (above) merged with the student-portal copy in copy-portal.ts. Import COPY from here. */
export const COPY = { ...BASE, ...PORTAL, landing: LANDING, profile: { ...BASE.profile, ...PORTAL.profile } } as const;
