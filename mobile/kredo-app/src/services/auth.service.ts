/**
 * Auth service (mock). Simulates OTP-based login/signup. Demo OTP is always 123456.
 * A real backend replaces these functions behind the same signatures.
 */
import { apiCall, DEMO_OTP, getStored, setStored } from "./client";
import { STUDENT_SEED, VENDOR_SEED } from "./mock-data";
import { useAuthStore } from "@/store/auth";

export async function sendOtp(phone: string, purpose: "login" | "signup") {
  return apiCall(async () => {
    // pretend to send
    await setStored(`otp:${phone}`, DEMO_OTP);
    return { phone, purpose, demoOtp: DEMO_OTP };
  });
}

export async function verifyOtp(phone: string, otp: string) {
  return apiCall(async () => {
    const stored = await getStored<string>(`otp:${phone}`);
    if (stored !== otp) throw { code: "INVALID_OTP", message: "Incorrect code. Try 123456 in demo mode." };
    return { phone, verified: true };
  });
}

export async function login(phone: string) {
  return apiCall(async () => {
    await verifyOtp(phone, DEMO_OTP);
    const student = { ...STUDENT_SEED };
    useAuthStore.getState().setSession("student", student, undefined, "tok_demo_" + Date.now());
    return { role: "student", student, token: "tok_demo_" + Date.now() };
  });
}

export async function signup(payload: { name: string; email: string; college: string; phone: string }) {
  return apiCall(async () => {
    const student = { ...STUDENT_SEED, name: payload.name, email: payload.email, college: payload.college, phone: payload.phone };
    useAuthStore.getState().setSession("student", student, undefined, "tok_demo_" + Date.now());
    return { role: "student", student, token: "tok_demo_" + Date.now() };
  });
}

export async function vendorSignup(payload: { stallName: string; ownerName: string; category: string; campusArea: string; hours: string; phone: string }) {
  return apiCall(async () => {
    const vendor = { ...VENDOR_SEED, stallName: payload.stallName, ownerName: payload.ownerName, category: payload.category, campusArea: payload.campusArea, hours: payload.hours, phone: payload.phone, status: "not_started" };
    useAuthStore.getState().setSession("vendor", undefined, vendor, "tok_vendor_demo_" + Date.now());
    return { role: "vendor", vendor, token: "tok_vendor_demo_" + Date.now() };
  });
}

export async function logout() {
  await apiCall(async () => {});
  useAuthStore.getState().logout();
}
