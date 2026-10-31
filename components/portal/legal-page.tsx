import Link from "next/link";
import { PortalShell } from "./page-shell";
import { VERSIONS } from "@/lib/mock-data";

const DOCS = {
  privacy: {
    title: "Privacy notice (summary)",
    version: VERSIONS.privacy,
    body: [
      "Who we are: this is an app that connects students with a regulated lending partner. We are not a bank or lender.",
      "What we collect: your mobile number, student details, and masked identity references. ID card photos are only previewed in your browser in this demo and are never stored or sent.",
      "Why: to verify you are a student, to assess a loan request if you apply, and to send service messages. Each purpose has its own consent.",
      "Your rights: view, correct, delete or withdraw at any time from your profile, under My data and privacy.",
    ],
  },
  terms: {
    title: "Terms (summary)",
    version: VERSIONS.terms,
    body: [
      "These are placeholder terms for a design preview. Real terms will be provided by the lending partner and reviewed by legal counsel.",
      "Loans are offered by the lending partner on their terms. Approval is not guaranteed and depends on lender policy.",
      "Repayment dates, charges and total repayable are shown in your offer before you accept.",
    ],
  },
  "key-facts": {
    title: "Key fact summary",
    version: VERSIONS.keyFacts,
    body: [
      "Placeholder. The real key fact summary lists the amount, all charges, the total repayable, the number and size of instalments, the due dates, late charges and how to complain.",
      "Everything you pay is itemised before you accept an offer.",
    ],
  },
} as const;

export function LegalPage({ doc }: { doc: keyof typeof DOCS }) {
  const d = DOCS[doc];
  return (
    <PortalShell width="max-w-2xl" back={{ href: "/", label: "Home" }}>
      <h1 className="text-3xl font-extrabold tracking-tight">{d.title}</h1>
      <p className="mt-1 text-xs text-muted">Version {d.version} · Placeholder text for a design preview, to be replaced with reviewed legal copy.</p>
      <div className="mt-5 space-y-3 text-[15px] leading-relaxed">
        {d.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <nav aria-label="Legal documents" className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-neon-blue">
        <Link href="/legal/privacy">Privacy</Link>
        <Link href="/legal/terms">Terms</Link>
        <Link href="/legal/key-facts">Key facts</Link>
      </nav>
    </PortalShell>
  );
}
