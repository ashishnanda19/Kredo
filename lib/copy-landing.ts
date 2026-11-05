/**
 * Landing-page copy for the Flighty/Ramp-inspired redesign. Merged into COPY (lib/copy.ts) as COPY.landing.
 * Rules: short and confident, slang only in headlines / empty states / success toasts (max one per
 * paragraph), never near money, fees, dates, consent, errors or legal text. No awards, no user counts,
 * no real testimonials, no app-store badges.
 */
import { BRAND } from "./config";

const B = BRAND.name;

export const LANDING = {

  nav: {
    links: [
      { href: "#how", label: "How it works" },
      { href: "#features", label: "Features" },
      { href: "#trust", label: "Trust" },
      { href: "#faq", label: "FAQ" },
    ],
    access: "Get early access",
    login: "Log in",
    menu: "Menu",
  },

  splash: {
    title: B,
    sub: "Pay on your phone, settle on time.",
    subMark: "on time.",
    steps: [
      { title: "Scan at the stall", body: "At partner campus vendors" },
      { title: "Pay from your limit", body: "Fee and due date upfront" },
      { title: "Settle on time", body: "Reminders before it's due" },
    ],
    cta: "Get early access",
    how: "See how it works",
  },

  hero: {
    title: "Pay at campus. Settle later.",
    sub: "Verified students get a small limit through our lending partner, spend at campus vendors, repay on time, and grow it.",
    badges: [
      { title: "Student-verified", sub: "College ID check" },
      { title: "Lending-partner backed", sub: "Regulated partner" },
    ],
    phoneAlt: `${B} app on a phone, showing the current step`,
  },

  stages: [
    { id: "verify", label: "Verify", short: "Verify", title: "Verify once", body: "College ID front and back, a quick check, then your limit unlocks." },
    { id: "campus", label: "At campus", short: "Pay", title: "Tap and pay at campus", body: "Pick a vendor that accepts us, check the total, pay. The receipt saves itself." },
    { id: "repay", label: "Repay and grow", short: "Repay", title: "Repay and grow", body: "Repay on time, watch your internal score climb, and your limit can grow." },
    { id: "access", label: "Get access", short: "Access", title: "Be first on your campus", body: "Join the early-access list. Joining the waitlist does not guarantee access." },
  ],

  feed: {
    verify: [
      { icon: "doc", tone: "blue", title: "ID received", detail: "Front and back uploaded" },
      { icon: "clock", tone: "amber", title: "Reviewing your ID", detail: "Usually under 2 working days" },
      { icon: "check", tone: "green", title: "Student verified ✓", detail: "Manipal University Jaipur" },
      { icon: "up", tone: "green", title: "Limit unlocked · ₹3,000", detail: "Set by our lending partner" },
      { icon: "offer", tone: "violet", title: "Offer ready · review charges", detail: "Every charge shown before you accept" },
      { icon: "avatar", tone: "neutral", title: "Riya joined from your hostel", detail: "Sample notification" },
    ],
    campus: [
      { icon: "check", tone: "green", title: "Paid ₹120 at Campus Cafe", detail: "Cold coffee and a sandwich" },
      { icon: "print", tone: "blue", title: "Xerox · ₹40", detail: "Lab record, 20 pages" },
      { icon: "food", tone: "amber", title: "Canteen · ₹85", detail: "Thali, 1:12 pm" },
      { icon: "doc", tone: "neutral", title: "Receipt saved", detail: "Find it in Activity" },
      { icon: "clock", tone: "amber", title: "Due 30 Nov", detail: "Total ₹245 so far" },
      { icon: "store", tone: "violet", title: "Brew & Bean accepts us", detail: "300 m from the library" },
    ],
    repay: [
      { icon: "clock", tone: "amber", title: "Repayment due in 3 days · ₹1,150", detail: "Due 2 Nov" },
      { icon: "check", tone: "green", title: "Repaid on time", detail: "Thanks for keeping it tidy" },
      { icon: "up", tone: "green", title: "Limit increased to ₹5,000", detail: "Reviewed by the lending partner" },
      { icon: "spark", tone: "violet", title: "Score +12", detail: "Internal score, not a bureau score" },
      { icon: "doc", tone: "neutral", title: "Statement ready", detail: "October" },
      { icon: "bell", tone: "blue", title: "Reminder set", detail: "1 day before each due date" },
    ],
  },

  access: { title: "Get early access", sub: "Tell us your college email. We'll let you know when we reach your campus.", placeholder: "Your college email", button: "Join early access", consent: "We only use your email to tell you about early access. No spam. Joining the waitlist does not guarantee access.", done: "You're on the list. W.", doneSub: "(Preview only, nothing was sent.)" },


  dark: {
    title: "Everything you need to know about your limit, and more.",
    sub: "See what you owe, when it's due and why, in plain numbers. No small print, no surprises.",
    glow: { title: "See where your money goes. Finally!", body: "Every spend, every due date, every charge, on one screen.", callout: "Next due ₹1,150 · in 3 days" },
    tall: [
      { mood: "navy", lead: "Due dates you can't miss.", rest: "Reminders before every instalment, at a time that suits you." },
      { mood: "sunset", lead: "Offers with charges up front.", rest: "Approved amount, interest, fees and total repayable, itemised before you accept." },
      { mood: "ember", lead: "First to know.", rest: "Lock-screen reminders the moment something changes, never after." },
      { mood: "forest", lead: "Clear numbers.", rest: "Principal, charges and the total on separate lines. Always." },
    ],
  },

  verifyPanel: {
    titleA: "Verify in minutes.",
    titleB: "Spend the same day your limit is set.",
    sub: "Drop your college ID, we match it with your details, and our lending partner sets your limit.",
    cta: "Start verification",
    callouts: { matched: "MATCHED · College ID", review: "NEEDS REVIEW", limit: "LIMIT SET", box: "VERIFY ID" },
  },

  chaos: {
    before: "Pocket money? Gone by Thursday.",
    beforeSub: "Mess bills, IOUs, failed UPIs and the group chat asking who owes who. Sound familiar?",
    meterBefore: "Chaos level",
    meterAfter: "Chaos level: sorted",
    after: "Now it all lives in one place.",
    afterSub: `${B} keeps every spend, due date and repayment together. No more guessing, no more udhaar spiral.`,
    fragments: [
      { t: "bro ₹200 de de, kal dunga", k: "bubble" },
      { t: "Mess bill pending", k: "note" },
      { t: "UPI pending hai yaar 😭", k: "bubble" },
      { t: "Balance ₹43", k: "badge" },
      { t: "kal pakka 🤞", k: "bubbleMe" },
      { t: "Canteen tab · ₹340", k: "slip" },
      { t: "split the bill pls 🙏", k: "bubble" },
      { t: "Fees due Friday", k: "note" },
      { t: "Card declined", k: "badge" },
      { t: "bhai paisa kab dega??", k: "bubbleMe" },
      { t: "Payment request · ₹150", k: "slip" },
      { t: "Mom: kharcha kitna hua?", k: "bubble" },
      { t: "Exam xerox ₹120", k: "note" },
      { t: "99+ unread", k: "badge" },
      { t: "who owes who? nobody knows", k: "bubble" },
      { t: "Chai udhaar ₹30", k: "slip" },
      { t: "checking balance… 😬", k: "bubbleMe" },
      { t: "Rent due on the 5th", k: "note" },
      { t: "Raju bhaiya ₹340", k: "badge" },
      { t: "kitna chahiye?", k: "bubble" },
      { t: "Xerox later", k: "slip" },
      { t: "Hostel fees. Again.", k: "note" },
      { t: "You owe ₹820", k: "badge" },
      { t: "send 150 pls", k: "bubbleMe" },
    ],
    checklist: ["Verified", "Limit set", "Pay at campus", "Repay on time", "Aura grows"],
    checklistDetail: ["Student ID matched", "₹3,000 from our lending partner", "12 campus payments", "Next due 2 Nov", "Up 12 this month"],
    calmCards: [
      { k: "receipt", label: "Receipt saved", value: "₹120 · Campus Cafe", note: "Paid today, 1:12 pm" },
      { k: "due", label: "Next due", value: "₹1,150 · 2 Nov", note: "Reminder set for 1 Nov" },
      { k: "limit", label: "Available to spend", value: "₹1,850 of ₹3,000", note: "Limit set by our lending partner" },
      { k: "score", label: "Internal score", value: "72 · Building", note: "Not a bureau score" },
    ],
  },

  scenes: {
    railLabel: "Scene progress",
    items: [
      { eyebrow: "Your limit", a: "Know your limit.", b: "Before you spend a rupee.", body: "Once you are verified, our lending partner sets a small limit. You see it first, in plain numbers." },
      { eyebrow: "Scan and pay", a: "Scan. Check.", b: "Pay.", body: "Pick a vendor, see the fee, the total and the due date, then confirm. Nothing is hidden until later." },
      { eyebrow: "Reminders", a: "A nudge before", b: "it is due.", body: "Reminders land the day before, so a due date never sneaks up on you." },
      { eyebrow: "Your dues", a: "Every due date,", b: "one screen.", body: "What you owe, to whom and by when, grouped so you can plan the week." },
      { eyebrow: "Receipts", a: "Receipts that", b: "save themselves.", body: "Every payment files its own receipt, ready when you need to check or share it." },
    ],
  },

  strip: {
    eyebrow: "More ways it helps",
    titleA: `With ${B}`,
    titleB: "you can finally.",
    sub: "Pay at campus, see the cost first, and stay on top of every due date.",
    cards: [
      { a: "Pay with a scan", cap: "Scan a stall's QR and pay from your limit in seconds." },
      { a: "See the cost first", cap: "The fee, total and due date are shown before you confirm." },
      { a: "Never miss a due date", cap: "Reminders arrive the day before, so repaying on time is easy." },
      { a: "Watch your limit grow", cap: "Repay on time and your limit steps up, with a reason each time." },
      { a: "Keep your passport", cap: "Your Credit Passport tells your repayment story on one page." },
      { a: "Stay in control", cap: "Costs, dates and the lender's name are always in front of you." },
    ],
    hint: "Drag or scroll",
  },

  bento: {
    titleA: "One app for campus credit.",
    titleB: "Pay, track, repay and grow, without the chaos.",
    primary: "Get early access",
    secondary: "See how it works",
    cards: [
      { a: "Pay at campus", b: "that handles itself" },
      { a: "Repay", b: "without the stress" },
      { a: "Know your score", b: "and what moves it" },
      { a: "A limit", b: "that can grow" },
      { a: "Always in control", b: "of privacy and consent" },
    ],
    toast: { title: "Receipt added for ₹120 at Campus Cafe.", body: "Your payment is complete." },
  },

  passport: {
    eyebrow: "Your repayment story",
    ticker: ["on time", "limit up", "no cap", "3 in a row", "verified", "main character"],
    titleA: "Look back on how you built your score.", titleB: "Every on-time repayment, on one page.", disclaimer: "Internal score, not a credit bureau score. It does not replace your CIBIL or other bureau score." },

  ending: { flatAlt: "Several phones on a desk showing the app's screens", title: "Have a nice semester!", cta: "Get early access", sub: "Works in your browser on phone, laptop and tablet. No app to install." },

  footer: {
    curtainTitle: "Pay at campus. Settle later.",
    slogan: "Campus, sorted.",
    columns: [
      { title: "Product", links: ["How it works", "Credit limit", "Repayments", "Credit profile"] },
      { title: "Students", links: ["Verify", "FAQ", "Support"] },
      { title: "Vendors", links: ["Become a partner", "Settlement", "Vendor FAQ"] },
      { title: "Company", links: ["About", "Careers", "Press"] },
      { title: "Legal", links: ["Privacy", "Terms", "Key facts"] },
    ],
    waitlist: "Joining the waitlist does not guarantee access.",
  },
} as const;
