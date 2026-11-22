import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Role = "student" | "vendor" | null;

export interface Student {
  id: string;
  name: string;
  email: string;
  college: string;
  course: string;
  year: string;
  phone: string;
  idMasked: string;
  verified: boolean;
  limit: number;
  used: number;
  aura: number;
  krs: number;
  tier: string;
  level: number;
  memberSince: string;
  nextReview: string;
}

export interface Vendor {
  id: string;
  stallName: string;
  ownerName: string;
  category: string;
  campusArea: string;
  hours: string;
  bankMasked: string;
  bankVerified: boolean;
  verificationLevel: "full" | "light";
  dailyCap: number;
  status: "not_started" | "pending" | "accepted" | "rejected" | "suspended";
  qrVersion: number;
  kyc?: string;
  idMasked?: string;
}

export interface AuthState {
  role: Role;
  student: Student | null;
  vendor: Vendor | null;
  token: string | null;
  isVerified: boolean;
  setSession: (role: Role, student?: Student, vendor?: Vendor, token?: string) => void;
  setStudent: (student: Partial<Student>) => void;
  setVendor: (vendor: Partial<Vendor>) => void;
  logout: () => void;
  updateAura: (aura: number) => void;
  updateLimit: (used: number) => void;
  verifyUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: null,
      student: null,
      vendor: null,
      token: null,
      isVerified: false,
      setSession: (role, student, vendor, token) =>
        set({ role, student, vendor, token: token ?? null, isVerified: role !== null }),
      setStudent: (patch) => set((s) => ({ student: s.student ? { ...s.student, ...patch } : null })),
      setVendor: (patch) => set((s) => ({ vendor: s.vendor ? { ...s.vendor, ...patch } : null })),
      logout: () =>
        set({ role: null, student: null, vendor: null, token: null, isVerified: false }),
      updateAura: (aura) =>
        set((s) => ({ student: s.student ? { ...s.student, aura } : null })),
      updateLimit: (used) =>
        set((s) => ({ student: s.student ? { ...s.student, used } : null })),
      verifyUser: () => set({ isVerified: true }),
    }),
    {
      name: "kredo-auth",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
