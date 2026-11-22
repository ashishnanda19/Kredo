/**
 * Vendor data service (mock). Stall registration, QR, payments, payouts, insights.
 * Real backend replaces these functions behind the same signatures.
 */
import { apiCall } from "./client";
import { useAuthStore } from "@/store/auth";
import { VENDOR_SEED, VENDOR_TRANSACTIONS, PAYOUTS } from "./mock-data";

export function vendorMe() {
  return apiCall(async () => {
    const v = useAuthStore.getState().vendor;
    if (!v) throw { code: "NOT_AUTHENTICATED", message: "Please log in as a vendor." };
    return { vendor: v };
  });
}

export function vendorRegister(payload: any) {
  return apiCall(async () => {
    const vendor = { ...VENDOR_SEED, ...payload, status: "not_started" };
    useAuthStore.getState().setSession("vendor", undefined, vendor, "tok_vendor_demo_" + Date.now());
    return { role: "vendor", vendor };
  });
}

export function vendorSubmitKyc(payload: { idLast4: string; hasBusinessProof: boolean }) {
  return apiCall(async () => {
    const v = useAuthStore.getState().vendor;
    if (!v) throw { code: "NOT_AUTHENTICATED", message: "Vendor not found." };
    useAuthStore.getState().setVendor({ kyc: "verified", idMasked: `••••${payload.idLast4}`, verificationLevel: payload.hasBusinessProof ? "full" : "light", dailyCap: payload.hasBusinessProof ? 20000 : 5000 });
    return { ok: true, kyc: "verified" };
  });
}

export function vendorRegisterBank(payload: { accountLast4: string; ifsc: string }) {
  return apiCall(async () => {
    const v = useAuthStore.getState().vendor;
    if (!v) throw { code: "NOT_AUTHENTICATED", message: "Vendor not found." };
    useAuthStore.getState().setVendor({ bankMasked: `•••• ${payload.accountLast4}`, bankVerified: true });
    return { ok: true, bankVerified: true };
  });
}

export function vendorAcceptAgreement() {
  return apiCall(async () => {
    const v = useAuthStore.getState().vendor;
    if (!v) throw { code: "NOT_AUTHENTICATED", message: "Vendor not found." };
    useAuthStore.getState().setVendor({ status: "accepted" });
    return { ok: true, status: "accepted" };
  });
}

export function vendorToday() {
  return apiCall(async () => {
    const v = useAuthStore.getState().vendor;
    if (!v) throw { code: "NOT_AUTHENTICATED", message: "Please log in as a vendor." };
    const receivedToday = VENDOR_TRANSACTIONS.filter((t: any) => t.status === "received");
    const total = receivedToday.reduce((sum, t: any) => sum + t.amount, 0);
    return { vendor: v, receivedToday: total, count: receivedToday.length, transactions: VENDOR_TRANSACTIONS, awaitingPayout: 185, paidYesterday: 480 };
  });
}

export function vendorPayouts() {
  return apiCall(async () => ({ payouts: PAYOUTS }));
}

export function vendorInsights() {
  return apiCall(async () => ({
    revenueWeek: 4850,
    transactionsWeek: 34,
    topItems: [
      { label: "Coffee", value: 45 },
      { label: "Snacks", value: 30 },
      { label: "Prints", value: 15 },
      { label: "Other", value: 10 },
    ],
    daily: [
      { day: "Mon", value: 1200 },
      { day: "Tue", value: 950 },
      { day: "Wed", value: 1400 },
      { day: "Thu", value: 1100 },
      { day: "Fri", value: 1600 },
      { day: "Sat", value: 1300 },
      { day: "Sun", value: 800 },
    ],
  }));
}

export function vendorProfile() {
  return apiCall(async () => {
    const v = useAuthStore.getState().vendor;
    if (!v) throw { code: "NOT_AUTHENTICATED", message: "Vendor not found." };
    return { vendor: v };
  });
}
