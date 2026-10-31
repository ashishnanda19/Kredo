import { BRAND } from "./config";

/**
 * Static mock data. EVERYTHING here is a placeholder: names, colleges, vendors,
 * amounts and dates are fictional. Dates are relative to MOCK_TODAY (30 Oct 2026).
 */

export type Category = "canteen" | "cafe" | "stationery" | "photocopy" | "laundry";

export const CATEGORY_LABEL: Record<Category, string> = {
  canteen: "Canteen",
  cafe: "Cafe",
  stationery: "Stationery",
  photocopy: "Photocopy",
  laundry: "Laundry",
};

export const student = {
  name: "Aarav Sharma",
  firstName: "Aarav",
  initials: "AS",
  college: "Sunrise Institute of Technology", // fictional
  course: "B.Tech, 2nd year",
  email: "aarav.sharma@sunrise.ac.in",
  phone: "+91 98XXX XX210",
  limit: 3000,
  used: 1150,
  verified: true,
  memberSince: "Aug 2026",
  nextReview: "2026-12-01",
} as const;

export const available = student.limit - student.used;

export const kredoCard = {
  number: "9100 2468 1357 0042", // obviously fake sample
  masked: "•••• •••• •••• 0042",
  expiry: "10/29",
  cvv: "123",
};

export type Vendor = {
  id: string;
  name: string;
  category: Category;
  distance: string;
  hours: string;
};

export const vendors: Vendor[] = [
  { id: "v1", name: "Campus Cafe", category: "cafe", distance: "On campus", hours: "8am to 9pm" },
  { id: "v2", name: "Annapurna Canteen", category: "canteen", distance: "On campus", hours: "7am to 8pm" },
  { id: "v3", name: "Shree Stationery", category: "stationery", distance: "150 m", hours: "9am to 8pm" },
  { id: "v4", name: "Xerox Corner", category: "photocopy", distance: "On campus", hours: "9am to 6pm" },
  { id: "v5", name: "Fresh Fold Laundry", category: "laundry", distance: "400 m", hours: "8am to 7pm" },
  { id: "v6", name: "Brew & Bean", category: "cafe", distance: "300 m", hours: "10am to 11pm" },
  { id: "v7", name: "Print Hub", category: "photocopy", distance: "250 m", hours: "9am to 9pm" },
  { id: "v8", name: "Tiffin Tadka", category: "canteen", distance: "500 m", hours: "11am to 10pm" },
];

export type TxStatus = "paid" | "due";

export type Transaction = {
  id: string;
  vendor: string;
  category: Category;
  amount: number;
  date: string; // ISO
  status: TxStatus;
};

/** Outstanding ("due") transactions sum to student.used (₹1,150). */
export const transactions: Transaction[] = [
  { id: "t1", vendor: "Campus Cafe", category: "cafe", amount: 120, date: "2026-10-29T13:10:00+05:30", status: "due" },
  { id: "t2", vendor: "Annapurna Canteen", category: "canteen", amount: 85, date: "2026-10-29T08:40:00+05:30", status: "due" },
  { id: "t3", vendor: "Xerox Corner", category: "photocopy", amount: 40, date: "2026-10-28T16:20:00+05:30", status: "due" },
  { id: "t4", vendor: "Shree Stationery", category: "stationery", amount: 240, date: "2026-10-27T11:05:00+05:30", status: "due" },
  { id: "t5", vendor: "Brew & Bean", category: "cafe", amount: 165, date: "2026-10-26T18:30:00+05:30", status: "due" },
  { id: "t6", vendor: "Fresh Fold Laundry", category: "laundry", amount: 180, date: "2026-10-22T10:15:00+05:30", status: "due" },
  { id: "t7", vendor: "Annapurna Canteen", category: "canteen", amount: 70, date: "2026-10-21T13:00:00+05:30", status: "due" },
  { id: "t8", vendor: "Campus Cafe", category: "cafe", amount: 150, date: "2026-10-20T15:45:00+05:30", status: "due" },
  { id: "t9", vendor: "Print Hub", category: "photocopy", amount: 100, date: "2026-10-19T12:30:00+05:30", status: "due" },
  { id: "t10", vendor: "Annapurna Canteen", category: "canteen", amount: 90, date: "2026-10-10T13:20:00+05:30", status: "paid" },
  { id: "t11", vendor: "Shree Stationery", category: "stationery", amount: 130, date: "2026-10-08T10:50:00+05:30", status: "paid" },
  { id: "t12", vendor: "Campus Cafe", category: "cafe", amount: 110, date: "2026-10-05T16:10:00+05:30", status: "paid" },
];

export type Loan = {
  id: string;
  title: string;
  total: number;
  repaid: number;
  dueDate: string; // ISO date
};

/** Remaining across loans = ₹650 + ₹500 = ₹1,150 = student.used. */
export const loans: Loan[] = [
  { id: "l1", title: "Oct week 4 spends", total: 1000, repaid: 350, dueDate: "2026-11-02" },
  { id: "l2", title: "Oct week 3 spends", total: 800, repaid: 300, dueDate: "2026-11-12" },
];

export const nextDue = (() => {
  const l = [...loans].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  return { loanId: l.id, title: l.title, amount: l.total - l.repaid, dueDate: l.dueDate };
})();

export const score = {
  current: 62,
  history: [
    { month: "May", score: 38 },
    { month: "Jun", score: 44 },
    { month: "Jul", score: 49 },
    { month: "Aug", score: 55 },
    { month: "Sep", score: 59 },
    { month: "Oct", score: 62 },
  ],
  tips: [
    { title: "Repay before the due date", gain: "+4 pts" },
    { title: "Keep usage under 50% of your limit", gain: "+3 pts" },
    { title: "Use it regularly, in small amounts", gain: "+2 pts" },
  ],
};

export const notifications = [
  { id: "n1", title: "₹650 due in 3 days", body: "Repay by 2 Nov to stay on track.", time: "Today" },
  { id: "n2", title: "Paid at Campus Cafe, ₹120", body: "Added to your Oct week 4 spends.", time: "Yesterday" },
  { id: "n3", title: "Your score went up", body: `${BRAND.name} Score is now 62 (Good).`, time: "2 days ago" },
];

export const colleges = [
  "Sunrise Institute of Technology",
  "Lakeview College of Arts",
  "Northgate University",
  "Riverbend Polytechnic",
  "St. Mary's Commerce College",
  "Hillcrest Engineering College",
  "Greenfield Law School",
  "Bayview Institute of Design",
]; // all fictional placeholders

export function spendByCategory(txs: Transaction[] = transactions) {
  const totals = new Map<Category, number>();
  for (const t of txs) totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  return [...totals.entries()]
    .map(([category, value]) => ({ category, name: CATEGORY_LABEL[category], value }))
    .sort((a, b) => b.value - a.value);
}

/* Portal and ops mock data (verification, KYC, loans, support, internal tools) */
export * from "./mock-portal";
export * from "./mock-ops";
