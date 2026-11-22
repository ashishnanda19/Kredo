/**
 * Mock demo data. Everything here is placeholder data for the preview.
 * Mirrors the web app's domain: student Aarav Sharma, Manipal University Jaipur,
 * ₹3,000 limit, Campus Cafe and other campus vendors.
 */

export const STUDENT_SEED: any = {
  id: "stu_001",
  name: "Aarav Sharma",
  firstName: "Aarav",
  lastInitial: "S.",
  email: "aarav.sharma@sunrise.ac.in",
  phone: "+91 98XXX XX210",
  college: "Manipal University Jaipur",
  course: "B.Tech, 2nd year",
  year: "2nd year",
  idMasked: "••••2041",
  verified: true,
  memberSince: "Aug 2026",
  nextReview: "2026-12-01",
  limit: 3000,
  used: 1150,
  aura: 82,
  krs: 728,
  tier: "Main Character",
  level: 4,
};

export const VENDOR_SEED: any = {
  id: "ven_001",
  stallName: "Campus Cafe",
  ownerName: "Meera",
  category: "food",
  campusArea: "Main gate, Block B",
  hours: "8am to 9pm",
  bankMasked: "•••• 4821",
  bankVerified: true,
  verificationLevel: "full",
  dailyCap: 20000,
  status: "accepted",
  qrVersion: 1,
};

export type Transaction = {
  id: string;
  vendor: string;
  vendorId: string;
  category: string;
  amount: number;
  fee: number;
  total: number;
  date: string; // ISO
  status: "paid" | "due" | "refunded";
  dueDate?: string;
  studentName?: string;
};

export const TRANSACTIONS: Transaction[] = [
  { id: "tx_1", vendor: "Campus Cafe", vendorId: "ven_001", category: "cafe", amount: 120, fee: 5, total: 125, date: "2026-10-29T13:10:00+05:30", status: "due", dueDate: "2026-11-07" },
  { id: "tx_2", vendor: "Annapurna Canteen", vendorId: "ven_002", category: "canteen", amount: 85, fee: 5, total: 90, date: "2026-10-29T08:40:00+05:30", status: "due", dueDate: "2026-11-07" },
  { id: "tx_3", vendor: "Xerox Corner", vendorId: "ven_003", category: "photocopy", amount: 40, fee: 5, total: 45, date: "2026-10-28T16:20:00+05:30", status: "paid", dueDate: "2026-11-06" },
  { id: "tx_4", vendor: "Shree Stationery", vendorId: "ven_004", category: "stationery", amount: 240, fee: 5, total: 245, date: "2026-10-27T11:05:00+05:30", status: "due", dueDate: "2026-11-05" },
  { id: "tx_5", vendor: "Brew & Bean", vendorId: "ven_005", category: "cafe", amount: 165, fee: 5, total: 170, date: "2026-10-26T18:30:00+05:30", status: "paid", dueDate: "2026-11-04" },
  { id: "tx_6", vendor: "Fresh Fold Laundry", vendorId: "ven_006", category: "laundry", amount: 180, fee: 5, total: 185, date: "2026-10-22T10:15:00+05:30", status: "paid", dueDate: "2026-11-03" },
  { id: "tx_7", vendor: "Annapurna Canteen", vendorId: "ven_002", category: "canteen", amount: 70, fee: 5, total: 75, date: "2026-10-21T13:00:00+05:30", status: "paid", dueDate: "2026-11-02" },
  { id: "tx_8", vendor: "Campus Cafe", vendorId: "ven_001", category: "cafe", amount: 150, fee: 5, total: 155, date: "2026-10-20T15:45:00+05:30", status: "paid", dueDate: "2026-11-01" },
  { id: "tx_9", vendor: "Print Hub", vendorId: "ven_007", category: "photocopy", amount: 100, fee: 5, total: 105, date: "2026-10-19T12:30:00+05:30", status: "paid", dueDate: "2026-10-31" },
];

export const VENDOR_TRANSACTIONS: any[] = [
  { id: "vt_1", student: "Aarav S. (•••2041)", time: "1:42 pm", amount: 125, status: "received" },
  { id: "vt_2", student: "Meera M. (•••4821)", time: "11:05 am", amount: 60, status: "received" },
  { id: "vt_3", student: "Rohan K. (•••1109)", time: "Yesterday 4:10 pm", amount: 200, status: "received" },
  { id: "vt_4", student: "Sanya P. (•••3341)", time: "Yesterday 12:00 pm", amount: 90, status: "refunded" },
];

export const PAYOUTS: any[] = [
  { who: "Meera", init: "M", amt: 60, paid: "11:05 am", out: "11:05 pm", leftMs: 8 * 3600 * 1000 + 12 * 60 * 1000 + 33 * 1000 },
  { who: "Aarav", init: "A", amt: 125, paid: "1:42 pm", out: "1:42 am", leftMs: 10 * 3600 * 1000 + 49 * 60 * 1000 + 33 * 1000 },
];

export const NOTIFICATIONS: any[] = [
  { id: "n1", title: "₹650 due in 3 days", body: "Repay by 2 Nov to stay on track.", time: "Today", kind: "reminder", read: false },
  { id: "n2", title: "Paid at Campus Cafe, ₹120", body: "Added to your Oct week 4 spends.", time: "Yesterday", kind: "info", read: true },
  { id: "n3", title: "Your score went up", body: "Kredo Score is now 62 (Good).", time: "2 days ago", kind: "info", read: true },
];

export const QUESTS: any[] = [
  { id: "verify_identity", title: "Verify phone, email and college ID", aura: 2, done: true },
  { id: "verify_bank", title: "Verify your repayment bank account or UPI handle", aura: 3, done: true },
  { id: "set_reminders", title: "Set repayment reminders and acknowledge the due-date notice", aura: 1, done: true },
  { id: "streak_3", title: "Keep a streak of 3 on-time repayments", aura: 3, done: false },
  { id: "micro_spend", title: "Repay a small proof-of-repayment spend on time", aura: 4, done: false },
];

export const NEARBY_VENDORS: any[] = [
  { id: "ven_001", name: "Campus Cafe", kind: "Canteen", dist: "60 m", icon: "cafe", category: "food" },
  { id: "ven_002", name: "Xerox Corner", kind: "Print and copy", dist: "90 m", icon: "print", category: "print" },
  { id: "ven_003", name: "Stationery Hub", kind: "Stationery", dist: "140 m", icon: "stationery", category: "stationery" },
];

export const LOANS: any[] = [
  { id: "ln_1", title: "Oct week 4 spends", total: 1000, repaid: 350, dueDate: "2026-11-02", status: "active" },
  { id: "ln_2", title: "Oct week 3 spends", total: 800, repaid: 300, dueDate: "2026-11-12", status: "active" },
];

export const VENDORS_DIR: any[] = [
  { id: "v1", name: "Campus Cafe", category: "cafe", distance: "On campus", hours: "8am to 9pm" },
  { id: "v2", name: "Annapurna Canteen", category: "canteen", distance: "On campus", hours: "7am to 8pm" },
  { id: "v3", name: "Shree Stationery", category: "stationery", distance: "150 m", hours: "9am to 8pm" },
  { id: "v4", name: "Xerox Corner", category: "photocopy", distance: "On campus", hours: "9am to 6pm" },
  { id: "v5", name: "Fresh Fold Laundry", category: "laundry", distance: "400 m", hours: "8am to 7pm" },
  { id: "v6", name: "Brew & Bean", category: "cafe", distance: "300 m", hours: "10am to 11pm" },
  { id: "v7", name: "Print Hub", category: "photocopy", distance: "250 m", hours: "9am to 9pm" },
  { id: "v8", name: "Tiffin Tadka", category: "canteen", distance: "500 m", hours: "11am to 10pm" },
];

export function availableLimit(student: any) {
  return Math.max(0, student.limit - student.used);
}
