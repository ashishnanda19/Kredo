/** Demo-only constants. None of these belong in a real deployment. */
import { istStartOf } from "../domain/time";

/** The demo PIN every seeded persona uses, shown on screen in demo mode. */
export const DEMO_PIN = "1234";
/** The demo one-time code, shown on screen in demo mode. */
export const DEMO_OTP = "123456";

export const SEED = 20261030;
/** Where the seeded history ends and the live demo begins: 30 Oct 2026, 09:00 India time (matches MOCK_TODAY). */
export const SEED_NOW = istStartOf("2026-10-30", 9);
/** How far back the seeded history starts. Persona stories reach about 100 days; backgrounds about 75. */
export const SEED_HISTORY_DAYS = 110;

export const CAMPUS = "Manipal University Jaipur Campus";
export const COLLEGE = "Manipal University Jaipur";

export type PersonaKind = "student" | "vendor";

export interface Persona {
  id: string;
  kind: PersonaKind;
  label: string;
  /** The story this person shows on stage. */
  story: string;
  studentId?: string;
  vendorId?: string;
}

/** The people the Demo Director can jump into. A persona with both ids owns a student and a stall account. */
export const PERSONAS: Persona[] = [
  { id: "aarav", kind: "student", label: "Aarav (new)", story: "Just verified. Aura 50, limit ₹1,000, no coin spends.", studentId: "stu-aarav" },
  { id: "diya", kind: "student", label: "Diya (steady)", story: "Five on-time repayments. One active coin spend.", studentId: "stu-diya" },
  { id: "rohan", kind: "student", label: "Rohan (streak)", story: "A long on-time streak, one step from the next limit.", studentId: "stu-rohan" },
  { id: "meera", kind: "student", label: "Meera (late once)", story: "Paid 4 days late once. One coin spend 2 days overdue.", studentId: "stu-meera" },
  { id: "kabir", kind: "student", label: "Kabir (defaulter)", story: "Defaulted 40 days ago and cleared it. The post-default cap applies.", studentId: "stu-kabir" },
  { id: "ishita", kind: "student", label: "Ishita (blocked)", story: "Overdue 35 days. New spends are blocked; the recovery path shows.", studentId: "stu-ishita" },
  { id: "neel", kind: "student", label: "Neel (quest runner)", story: "Rebuilding with capped, risk-reducing quests.", studentId: "stu-neel" },
  { id: "sana", kind: "student", label: "Sana (power user)", story: "Many small spends; rewards still pay out once a week.", studentId: "stu-sana" },
  { id: "tanvi", kind: "student", label: "Tanvi", story: "Background student for the metrics.", studentId: "stu-tanvi" },
  { id: "vikram", kind: "student", label: "Vikram (has a stall too)", story: "A student who also runs Stationery Corner. Shows the switch, and the self-pay block.", studentId: "stu-vikram", vendorId: "ven-stationery" },
  { id: "zoya", kind: "student", label: "Zoya", story: "Background student for the metrics.", studentId: "stu-zoya" },
  { id: "arjun", kind: "student", label: "Arjun", story: "Background student, sometimes late.", studentId: "stu-arjun" },
  { id: "v-gupta", kind: "vendor", label: "Gupta Chai Tapri", story: "High volume, small tickets.", vendorId: "ven-gupta-chai" },
  { id: "v-print", kind: "vendor", label: "Campus Print Hub", story: "Prints and copies.", vendorId: "ven-print-hub" },
  { id: "v-mess", kind: "vendor", label: "Hostel Mess Thali", story: "Lunch and dinner thali.", vendorId: "ven-mess-thali" },
  { id: "v-wash", kind: "vendor", label: "QuickWash Laundry", story: "Larger tickets.", vendorId: "ven-quickwash" },
  { id: "v-night", kind: "vendor", label: "Night Canteen (suspended)", story: "Suspended: its QR is rejected.", vendorId: "ven-night-canteen" },
  { id: "v-juice", kind: "vendor", label: "Juice Junction (pending)", story: "Verification pending: shows the review queue.", vendorId: "ven-juice" },
  { id: "v-book", kind: "vendor", label: "Book Barn", story: "Larger tickets; a lower daily cap.", vendorId: "ven-book-barn" },
];

export const personaById = (id: string): Persona | undefined => PERSONAS.find((p) => p.id === id);
