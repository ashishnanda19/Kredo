/**
 * Mock API client. Simulates network latency and occasional failures so the UI can
 * be built against realistic loading/error states. A real backend replaces this file
 * (same function signatures) without touching screens.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const DELAY_MS = 600;

const delay = (ms: number = DELAY_MS) => new Promise((r) => setTimeout(r, ms));

export type ApiError = { code: string; message: string };

function fail(code: string, message: string): never {
  const err: any = new Error(message);
  err.code = code;
  throw err;
}

export async function apiCall<T>(fn: () => Promise<T>, opts?: { failRate?: number }): Promise<T> {
  await delay(opts?.failRate ? 0 : DELAY_MS);
  if (opts?.failRate && Math.random() < opts.failRate) {
    fail("REQUEST_FAILED", "Something went wrong. Please try again.");
  }
  return fn();
}

export function mockError(code: string, message: string): ApiError {
  return { code, message };
}

/** Simulated OTP for every phone number in demo mode. */
export const DEMO_OTP = "123456";

/** Store a persisted value. */
export async function setStored(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

/** Read a persisted value. */
export async function getStored<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : null;
}
