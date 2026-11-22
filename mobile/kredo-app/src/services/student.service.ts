/**
 * Student data service (mock). Mirrors the web app domain: credit limit, Aura,
 * pay-by-QR, repayments, dues, activity. Real backend replaces these functions.
 */
import { apiCall } from "./client";
import { useAuthStore } from "@/store/auth";
import { STUDENT_SEED, TRANSACTIONS, NOTIFICATIONS, QUESTS, NEARBY_VENDORS, LOANS, availableLimit } from "./mock-data";

export function me() {
  return apiCall(async () => {
    const s = useAuthStore.getState().student;
    if (!s) throw { code: "NOT_AUTHENTICATED", message: "Please log in." };
    return { student: s, available: availableLimit(s) };
  });
}

export function homeData() {
  return apiCall(async () => {
    const s = useAuthStore.getState().student;
    if (!s) throw { code: "NOT_AUTHENTICATED", message: "Please log in." };
    const nextDue = LOANS.find((l) => l.status === "active");
    return {
      student: s,
      available: availableLimit(s),
      spentThisWeek: 1275,
      paymentsWeek: 6,
      nextDue: nextDue ? { amount: 1150, dueDate: "12 Nov", daysLeft: 5 } : null,
      aura: s.aura,
      tier: s.tier,
      recent: TRANSACTIONS.slice(0, 2),
    };
  });
}

export function payByQr(input: { vendorId: string; vendorName: string; amount: number; termDays?: number }) {
  return apiCall(async () => {
    const s = useAuthStore.getState().student;
    if (!s) throw { code: "NOT_AUTHENTICATED", message: "Please log in." };
    const fee = 5;
    const total = input.amount + fee;
    if (total > availableLimit(s)) throw { code: "OVER_LIMIT", message: `That's more than your available ₹${availableLimit(s)} (fee included).` };
    const tx = {
      id: "tx_" + Date.now(),
      vendor: input.vendorName,
      vendorId: input.vendorId,
      category: "cafe",
      amount: input.amount,
      fee,
      total,
      date: new Date().toISOString(),
      status: "due" as const,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
    useAuthStore.getState().setStudent({ used: s.used + input.amount, aura: Math.min(100, s.aura + 1) });
    return { ok: true, transaction: tx, total, fee, dueDate: tx.dueDate };
  });
}

export function repay(input: { loanId: string; amount: number }) {
  return apiCall(async () => {
    const s = useAuthStore.getState().student;
    if (!s) throw { code: "NOT_AUTHENTICATED", message: "Please log in." };
    if (input.amount > availableLimit(s) + (s.limit - s.used)) throw { code: "OVER_LIMIT", message: "Amount exceeds what you can repay." };
    useAuthStore.getState().setStudent({ used: Math.max(0, s.used - input.amount), aura: Math.min(100, s.aura + 4) });
    return { ok: true, repaid: input.amount, newUsed: Math.max(0, s.used - input.amount), newAura: Math.min(100, s.aura + 4) };
  });
}

export function activity(filters?: { status?: string; search?: string }) {
  return apiCall(async () => {
    let list = TRANSACTIONS;
    if (filters?.status && filters.status !== "all") list = list.filter((t: any) => t.status === filters.status);
    if (filters?.search) list = list.filter((t: any) => t.vendor.toLowerCase().includes(filters.search!.toLowerCase()) || t.category.toLowerCase().includes(filters.search!.toLowerCase()));
    return { transactions: list };
  });
}

export function dues() {
  return apiCall(async () => {
    const s = useAuthStore.getState().student;
    const due = TRANSACTIONS.filter((t: any) => t.status === "due");
    const total = due.reduce((sum, t: any) => sum + t.total, 0);
    return { student: s, totalDue: total, transactions: due, daysLeft: 5, dueDate: "12 Nov" };
  });
}

export function auraHistory() {
  return apiCall(async () => {
    const s = useAuthStore.getState().student;
    return {
      score: s?.aura ?? 82,
      tier: s?.tier ?? "Main Character",
      level: s?.level ?? 4,
      quests: QUESTS,
      history: [
        { change: "+4", reason: "Repaid ₹600 on time", when: "3 on time in a row" },
        { change: "+3", reason: "Repaid ₹1,150 on time", when: "First repayment" },
        { change: "+5", reason: "Verified student", when: "College ID checked" },
      ],
    };
  });
}

export function profile() {
  return apiCall(async () => {
    const s = useAuthStore.getState().student;
    if (!s) throw { code: "NOT_AUTHENTICATED", message: "Please log in." };
    return { student: s };
  });
}

export function updateProfile(patch: Partial<any>) {
  return apiCall(async () => {
    useAuthStore.getState().setStudent(patch);
    return { ok: true };
  });
}

export function notifications() {
  return apiCall(async () => ({ notifications: NOTIFICATIONS }));
}

export function nearbyVendors() {
  return apiCall(async () => ({ vendors: NEARBY_VENDORS }));
}
