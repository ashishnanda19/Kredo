/** Client-side validation helpers. Nothing is sent anywhere. */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COLLEGE_DOMAIN = /\.(ac\.in|edu\.in|edu)$/i;

export function validateCollegeEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return "Enter your college email.";
  if (!EMAIL.test(v)) return "That doesn't look like an email. Check for typos.";
  if (!COLLEGE_DOMAIN.test(v)) return "Use your college email (ends with .ac.in, .edu.in or .edu).";
  return null;
}

export function validateName(value: string): string | null {
  const v = value.trim();
  if (!v) return "Enter your name.";
  if (v.length < 2) return "Name looks too short.";
  return null;
}

export function validateRequired(value: string, label: string): string | null {
  return value.trim() ? null : `Enter your ${label}.`;
}

export const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
