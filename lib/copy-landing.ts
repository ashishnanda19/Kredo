/**
 * Landing-page copy for the Flighty/Ramp-inspired redesign. Merged into COPY (lib/copy.ts) as COPY.landing.
 * Rules: short and confident, slang only in headlines / empty states / success toasts (max one per
 * paragraph), never near money, fees, dates, consent, errors or legal text. No awards, no user counts,
 * no real testimonials, no app-store badges. All numbers are sample data and labelled as such.
 */
import { BRAND } from "./config";

const B = BRAND.name;

export const LANDING = {
  bar: { text: "Demo preview · no real money moves", link: "Join early access", close: "Dismiss announcement", chip: "Demo · no real money" },

  nav: {
    links: [
      { href: "#how", label: "How it works" },
      { href: "#features", label: "Features" },
      { href: "#vendors", label: "Vendors" },
      { href: "#trust", label: "Trust" },
      { href: "#faq", label: "FAQ" },
    ],
    access: "Get early access",
    login: "Log in",
    menu: "Menu",
  },

  splash: {
    kicker: "Campus credit for Indian college students",
    title: "Campus, sorted",
    sub: "Chai, canteen, xerox, stationery. Pay on your phone, settle on time.",
    cta: "Get early access",
    how: "See how it works",
    scroll: "Scroll",
  },

  hero: {
    title: "Pay at campus. Settle later.",
    sub: "Verified students get a small limit through our lending partner, spend at campus vendors, repay on time, and grow it.",
    badges: [
      { title: "Student-verified", sub: "College ID check" },
      { title: "Lending-partner backed", sub: "Regulated partner" },
    ],
    sample: "Sample data. Numbers are illustrative.",
    phoneAlt: `${B} app on a phone, showing the current step`,
  },

  stages: [
    { id: "verify", label: "Verify", title: "Verify once", body: "College ID front and back, a quick check, then your limit unlocks." },
    { id: "campus", label: "At campus", title: "Tap and pay at campus", body: "Pick a vendor that accepts us, check the total, pay. The receipt saves itself." },
    { id: "repay", label: "Repay and grow", title: "Repay and grow", body: "Repay on time, watch your internal score climb, and your limit can grow." },
    { id: "access", label: "Get access", title: "Be first on your campus", body: "Join the early-access list. Joining the waitlist does not guarantee access." },
  ],

  feed: {
    verify: [
      { icon: "doc", tone: "blue", title: "ID received", detail: "Front and back uploaded" },
      { icon: "clock", tone: "amber", title: "Reviewing your ID", detail: "Usually under 2 working days" },
      { icon: "check", tone: "green", title: "Student verified ✓", detail: "Sunrise Institute of Technology" },
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

  partners: { eyebrow: "Campus vendors", title: "Built for the chai stalls, canteens and xerox shops students already use.", tag: "Illustrative", note: "Illustrative only: vendor names are fictional and none of these businesses is a partner. Photos of real Indian vendors from Wikimedia Commons.", credits: "Photo credits", resized: "resized" },

  dark: {
    title: "Everything you need to know about your limit — and more.",
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

  ticker: { label: `STUDENTS ON ${B.toUpperCase()} TODAY (sample data)`, items: [{ k: "payments made", v: 1284 }, { k: "receipts saved", v: 1279 }, { k: "repaid on time", v: 412 }, { k: "IDs verified", v: 96 }, { k: "reminders sent", v: 2310 }] },

  logoGrid: { titleA: "Built for campuses across India.", titleB: "Colleges and vendors (placeholders).", stat: "₹245", statSub: "Average campus spend per week (sample)" },

  chaos: {
    before: "Pocket money that never lasted.",
    beforeSub: "Five ways a week of campus spending used to look.",
    after: "Now it all lives in one place.",
    afterSub: `${B} keeps every spend, due date and repayment together. It just works.`,
    fragments: ["Mess bill pending", "bro ₹200 de de, kal dunga", "Payment request · ₹150", "Raju bhaiya – ₹340", "kitna chahiye?", "You owe ₹820", "Xerox – later", "Balance ₹43", "[UNPAID] fees", "Card declined", "99+"],
    checklist: ["Verified", "Limit set", "Pay at campus", "Repay", "Score grows"],
    checklistDetail: ["Student ID matched", "₹3,000 from our lending partner", "12 campus payments", "Next due 2 Nov", "Up 12 this month"],
    calmCards: [
      { k: "receipt", label: "Receipt saved", value: "₹120 · Campus Cafe", note: "Paid today, 1:12 pm" },
      { k: "due", label: "Next due", value: "₹1,150 · 2 Nov", note: "Reminder set for 1 Nov" },
      { k: "limit", label: "Available to spend", value: "₹1,850 of ₹3,000", note: "Limit set by our lending partner" },
      { k: "score", label: "Internal score", value: "72 · Building", note: "Not a bureau score" },
    ],
    calmNote: "Sample data.",
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

  vendors: { titleA: "Your campus, already on it.", titleB: "Vendors near you that accept us (sample list).", cta: "Become a partner", open: "Open", closed: "Closed", sampleTime: "Open or closed at 7:30 pm, sample data." },

  passport: { titleA: "Look back on how you built your score.", titleB: "Every on-time repayment, on one page.", disclaimer: "Internal score, not a credit bureau score. It does not replace your CIBIL or other bureau score." },

  voices: {
    titleA: "Voices from campus.",
    titleB: "Sample quotes, to be replaced with real survey answers.",
    label: "Sample, replace with real survey quotes",
    tag: "Sample",
    quotes: [
      { q: "Last week of the month and the mess bill is due. This is the bit I need help with.", who: "2nd-year, engineering" },
      { q: "I want to see the total I owe before I tap anything. No surprises.", who: "1st-year, commerce" },
      { q: "Reminders the day before would honestly save me.", who: "3rd-year, design" },
      { q: "Xerox before every exam adds up. Small amounts, but every week.", who: "2nd-year, law" },
      { q: "If my limit grows when I repay on time, I'd actually care about repaying on time.", who: "Final year, science" },
      { q: "Tell me who the lender is. I want to know who I'm dealing with.", who: "1st-year, arts" },
    ],
  },

  ending: { flatAlt: "Several phones on a desk showing the app's screens", title: "Have a nice semester!", cta: "Get early access", sub: "Works in your browser on phone, laptop and tablet. No app to install." },

  footer: {
    curtainTitle: "Pay at campus. Settle later.",
    slogan: "Campus, sorted.",
    columns: [
      { title: "Product", links: ["How it works", "Credit limit", "Repayments", "Credit profile"] },
      { title: "Students", links: ["Verify", "FAQ", "Support", "Grievance"] },
      { title: "Vendors", links: ["Become a partner", "Settlement", "Vendor FAQ"] },
      { title: "Company", links: ["About (placeholder)", "Careers (placeholder)", "Press (placeholder)"] },
      { title: "Legal", links: ["Privacy", "Terms", "Key facts"] },
    ],
    locations: ["Pune", "Bengaluru", "Delhi", "Mumbai", "Hyderabad", "Chennai", "Kolkata"],
    waitlist: "Joining the waitlist does not guarantee access.",
    locationsLabel: "Campus cities on our list (placeholder)",
    placeholder: "placeholder",
  },
} as const;
