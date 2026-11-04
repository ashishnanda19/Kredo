"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, ChevronDown, ChevronLeft, Clock, Coffee, IdCard, Layers, LocateFixed, Lock, Printer, Search, Share, Sparkles, UtensilsCrossed, X } from "lucide-react";
import { CountUp } from "@/components/shared/count-up";
import { LogoMark } from "@/components/shared/logo";
import { BRAND } from "@/lib/config";
import { formatINR } from "@/lib/format";
import { student } from "@/lib/mock-data";
import { buildOffer, LOAN_PRODUCTS } from "@/lib/mock-portal";
import { CampusMap, Dot, MapButton, StatusBar } from "./parts";

const G = "#22C55E";
const A = "#F59E0B";
const BLUE = "#2F7DF6";
const Y = "#F5D832";

/* ------------------------------------------------------------------ Verify */
export function VerifyScreen({ phase = "pending" }: { phase?: "pending" | "accepted" }) {
  const ok = phase === "accepted";
  return (
    <div className="flex h-full flex-col bg-white text-[#0b0b0c]">
      <StatusBar />
      <div className="flex items-center justify-between px-[20px] pt-[6px]">
        <ChevronLeft className="size-[26px]" aria-hidden />
        <span className="text-[15px] font-semibold text-[#6b6b70]">Step 3 of 4</span>
        <X className="size-[22px] text-[#6b6b70]" aria-hidden />
      </div>
      <div className="mx-[20px] mt-[14px] h-[3px] rounded-full bg-[#ececec]">
        <motion.div className="h-full rounded-full" style={{ background: Y }} initial={false} animate={{ width: ok ? "100%" : "75%" }} transition={{ duration: 0.6 }} />
      </div>
      <h3 className="px-[20px] pt-[22px] text-[34px] font-bold tracking-[-0.03em]">Verify</h3>
      <p className="px-[20px] pt-[4px] text-[15px] text-[#6b6b70]">College ID, front and back. Photos stay on this phone.</p>

      <div className="mx-[20px] mt-[20px] rounded-[14px] bg-[#f3f2f0] px-[16px] py-[12px]">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[#6b6b70]">College</p>
        <p className="text-[17px] font-semibold">{student.college}</p>
      </div>

      <div className="mx-[20px] mt-[14px] grid grid-cols-2 gap-[12px]">
        {["Front", "Back"].map((s, i) => (
          <div key={s} className="relative overflow-hidden rounded-[14px] bg-[#f3f2f0] p-[10px]">
            <div className="relative aspect-[1.586/1] overflow-hidden rounded-[10px] bg-gradient-to-br from-[#e7e9f3] to-[#d8dcea]">
              <span className="absolute left-[8px] top-[8px] size-[24px] rounded-full bg-[#b9bfd6]" />
              <span className="absolute left-[38px] top-[11px] h-[5px] w-[50%] rounded bg-[#b9bfd6]" />
              <span className="absolute left-[38px] top-[21px] h-[5px] w-[35%] rounded bg-[#c8cde0]" />
              <span className="absolute bottom-[10px] left-[8px] h-[5px] w-[70%] rounded bg-[#c8cde0]" />
              {!ok && <span className="absolute inset-x-0 h-[2px] animate-scan" style={{ background: BLUE, boxShadow: `0 0 10px 3px ${BLUE}55`, animationDelay: `${i * 0.6}s` }} />}
              {ok && <span className="absolute right-[6px] top-[6px] grid size-[20px] place-items-center rounded-full" style={{ background: G }}><Check className="size-[13px] text-white" strokeWidth={3} aria-hidden /></span>}
            </div>
            <p className="pt-[8px] text-[13px] font-semibold">{s}</p>
          </div>
        ))}
      </div>

      <div className="mx-[20px] mt-[16px] flex items-center gap-[12px] rounded-[14px] border border-black/[.06] px-[14px] py-[12px]">
        <span className="grid size-[34px] place-items-center rounded-full" style={{ background: ok ? `${G}22` : `${A}22` }}>
          {ok ? <Check className="size-[18px]" style={{ color: G }} strokeWidth={3} aria-hidden /> : <Clock className="size-[18px]" style={{ color: A }} aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={phase} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="text-[16px] font-semibold">
              {ok ? "Accepted" : "Pending review"}
            </motion.p>
          </AnimatePresence>
          <p className="text-[13px] text-[#6b6b70]">{ok ? "Student status confirmed" : "Usually under 2 working days"}</p>
        </div>
      </div>
      <div className="mt-auto px-[20px] pb-[40px]">
        <div className="grid h-[52px] place-items-center rounded-full bg-[#0b0b0c] text-[17px] font-semibold text-white">{ok ? "Continue" : "Submitted"}</div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Limit unlocked */
export function LimitUnlockedScreen({ active = true, amount = student.limit }: { active?: boolean; amount?: number }) {
  return (
    <div className="flex h-full flex-col bg-white text-[#0b0b0c]">
      <StatusBar />
      <div className="flex flex-1 flex-col items-center px-[24px] pt-[70px] text-center">
        <span className="grid size-[64px] place-items-center rounded-full" style={{ background: Y }}>
          <Sparkles className="size-[30px] text-[#111]" aria-hidden />
        </span>
        <p className="pt-[22px] text-[15px] font-semibold uppercase tracking-[0.08em] text-[#6b6b70]">Limit unlocked</p>
        <p className="pt-[6px] text-[64px] font-bold tracking-[-0.04em]">{active ? <CountUp value={amount} format={formatINR} immediate duration={1.4} /> : formatINR(amount)}</p>
        <p className="pt-[6px] text-[15px] text-[#6b6b70]">Set by our lending partner. Subject to lender policy.</p>
        <div className="mt-[34px] w-full space-y-[10px] text-left">
          {[
            ["Spend at campus vendors", "Canteen, cafe, xerox, stationery"],
            ["Repay by the due date", "Reminders before every due date"],
            ["Grow your limit", "On-time repayments help"],
          ].map(([a, b]) => (
            <div key={a} className="flex items-center gap-[12px] rounded-[14px] bg-[#f3f2f0] px-[14px] py-[12px]">
              <Dot c={G} />
              <div>
                <p className="text-[16px] font-semibold">{a}</p>
                <p className="text-[13px] text-[#6b6b70]">{b}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-[20px] pb-[40px]">
        <div className="grid h-[52px] place-items-center rounded-full bg-[#0b0b0c] text-[17px] font-semibold text-white">Start using {BRAND.name}</div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------- Dues list ("My Dues") */
const DUES = [
  { n: "3d", sub: "DUE IN", title: "Campus Cafe", line: "→ due 2 Nov", amt: "₹650", left: G, right: A, chip: "Due soon", chipC: A },
  { n: "13d", sub: "DUE IN", title: "Fresh Fold Laundry", line: "→ due 12 Nov", amt: "₹500", left: G, right: G, chip: "On track", chipC: G },
  { n: "✓", sub: "PAID", title: "Annapurna Canteen", line: "→ paid 10 Oct", amt: "₹90", left: G, right: G, chip: "Paid", chipC: G },
  { n: "✓", sub: "PAID", title: "Shree Stationery", line: "→ paid 8 Oct", amt: "₹130", left: G, right: G, chip: "Paid", chipC: G },
];

export function DuesListScreen() {
  return (
    <div className="relative h-full bg-[#EAF1E4] text-[#0b0b0c]">
      <div className="absolute inset-x-0 top-0"><CampusMap height={420} /></div>
      <div className="absolute inset-x-0 top-0"><StatusBar /></div>
      <div className="absolute right-[14px] top-[70px] flex flex-col gap-[10px]">
        <MapButton><Layers className="size-[18px]" aria-hidden /></MapButton>
        <MapButton><LocateFixed className="size-[18px]" aria-hidden /></MapButton>
      </div>
      <div className="absolute inset-x-0 bottom-0 top-[330px] rounded-t-[22px] bg-white px-[16px] pt-[10px] shadow-[0_-6px_24px_rgba(0,0,0,0.08)]">
        <span className="mx-auto block h-[5px] w-[36px] rounded-full bg-black/15" />
        <div className="flex items-center justify-between pt-[10px]">
          <p className="flex items-center gap-[4px] text-[24px] font-bold tracking-[-0.02em]">My Dues <ChevronDown className="size-[18px]" aria-hidden /></p>
          <span className="grid size-[32px] place-items-center rounded-full bg-[#f3f2f0] text-[13px] font-semibold">{student.initials}</span>
        </div>
        <div className="mt-[10px] flex h-[38px] items-center gap-[8px] rounded-[10px] bg-[#f3f2f0] px-[10px] text-[15px] text-[#8a8a90]">
          <Search className="size-[16px]" aria-hidden /> Search vendors
        </div>
        <ul className="mt-[6px] divide-y divide-black/[.06]">
          {DUES.map((d) => (
            <li key={d.title} className="flex items-center gap-[12px] py-[12px]">
              <div className="w-[52px] text-center">
                <p className="text-[24px] font-bold leading-none tracking-[-0.03em]">{d.n}</p>
                <p className="pt-[3px] text-[9px] font-bold tracking-[0.08em] text-[#8a8a90]">{d.sub}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-semibold">
                  {d.title} <span className="font-normal text-[#6b6b70]">{d.line}</span>
                </p>
                <p className="flex items-center gap-[10px] pt-[3px] text-[13px] text-[#6b6b70]">
                  <span className="flex items-center gap-[5px]"><Dot c={d.left} /> Spent</span>
                  <span className="flex items-center gap-[5px]"><Dot c={d.right} /> {d.amt}</span>
                </p>
              </div>
              <span className="rounded-full px-[8px] py-[3px] text-[11px] font-bold" style={{ color: d.chipC === A ? "#9a4505" : "#15803d", background: `${d.chipC}1f` }}>{d.chip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Campus pay */
export function CampusPayScreen({ phase = "sheet" }: { phase?: "sheet" | "paid" }) {
  const paid = phase === "paid";
  return (
    <div className="relative h-full bg-[#EAF1E4] text-[#0b0b0c]">
      <div className="absolute inset-x-0 top-0"><CampusMap height={560} zoom={1.25} /></div>
      <div className="absolute inset-x-0 top-0"><StatusBar /></div>
      <div className="absolute right-[14px] top-[70px] flex flex-col gap-[10px]">
        <MapButton><Layers className="size-[18px]" aria-hidden /></MapButton>
        <MapButton><Share className="size-[18px]" aria-hidden /></MapButton>
        <MapButton><LocateFixed className="size-[18px]" aria-hidden /></MapButton>
      </div>
      <div className="absolute inset-x-[10px] bottom-[14px] rounded-[26px] bg-white p-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.16)]">
        <AnimatePresence mode="wait" initial={false}>
          {!paid ? (
            <motion.div key="sheet" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-[10px]">
                  <span className="grid size-[36px] place-items-center rounded-full bg-[#f3f2f0]"><Coffee className="size-[18px]" aria-hidden /></span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8a90]">On campus · 8am to 9pm</p>
                    <p className="text-[18px] font-semibold">Campus Cafe</p>
                  </div>
                </div>
                <span className="grid size-[28px] place-items-center rounded-full bg-[#f3f2f0]"><X className="size-[14px]" aria-hidden /></span>
              </div>
              <p className="mt-[10px] inline-flex items-center gap-[6px] rounded-full bg-[#22C55E1f] px-[10px] py-[4px] text-[12px] font-semibold text-[#15803d]">
                <Check className="size-[13px]" strokeWidth={3} aria-hidden /> Accepts {BRAND.name}
              </p>
              <div className="mt-[14px] flex items-end justify-between border-t border-black/[.06] pt-[12px]">
                <div>
                  <p className="text-[12px] text-[#6b6b70]">Amount</p>
                  <p className="text-[34px] font-bold leading-none tracking-[-0.03em]" style={{ color: "#15803d" }}>₹120</p>
                  <p className="pt-[4px] text-[12px] text-[#6b6b70]">Fee ₹5 · total ₹125</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-[#6b6b70]">Repay by</p>
                  <span className="mt-[2px] inline-block rounded-[6px] px-[8px] py-[3px] text-[15px] font-bold text-[#111]" style={{ background: Y }}>30 Nov</span>
                </div>
              </div>
              <div className="mt-[14px] grid h-[48px] place-items-center rounded-full text-[17px] font-semibold text-white" style={{ background: BLUE }}>Pay ₹120</div>
            </motion.div>
          ) : (
            <motion.div key="paid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }} className="py-[6px] text-center">
              <span className="mx-auto grid size-[54px] place-items-center rounded-full" style={{ background: G }}><Check className="size-[28px] text-white" strokeWidth={3} aria-hidden /></span>
              <p className="pt-[10px] text-[22px] font-bold tracking-[-0.02em]">Paid ₹120</p>
              <p className="text-[14px] text-[#6b6b70]">at Campus Cafe · 1:12 pm</p>
              <div className="mt-[12px] flex items-center justify-between rounded-[12px] bg-[#f3f2f0] px-[12px] py-[10px] text-left text-[13px]">
                <span className="text-[#6b6b70]">Receipt PAY-91003 · saved</span>
                <span className="font-semibold">Due 30 Nov</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Offer (charges itemised up front) */
export function OfferScreen() {
  const o = buildOffer(LOAN_PRODUCTS[0], 3000, 3);
  const rows: [string, string][] = [["Approved amount", formatINR(o.amount)], ["Interest", formatINR(o.interest)], ["Processing fee", formatINR(o.processing)], ["Other charges", formatINR(o.other)]];
  return (
    <div className="flex h-full flex-col bg-[#f6f5f3] text-[#0b0b0c]">
      <StatusBar />
      <div className="flex items-center gap-[8px] px-[16px] pt-[6px] text-[17px] text-[#2F7DF6]"><ChevronLeft className="size-[22px]" aria-hidden /> Loans</div>
      <h3 className="px-[20px] pt-[12px] text-[30px] font-bold tracking-[-0.03em]">Your offer</h3>
      <p className="px-[20px] pt-[2px] text-[14px] text-[#6b6b70]">{o.productName} · {o.tenure} months</p>
      <div className="mx-[16px] mt-[14px] rounded-[18px] bg-white p-[16px]">
        <ul className="divide-y divide-black/[.06]">
          {rows.map(([k, v]) => (
            <li key={k} className="flex justify-between py-[11px] text-[16px]"><span className="text-[#6b6b70]">{k}</span><span className="font-semibold">{v}</span></li>
          ))}
        </ul>
        <div className="mt-[4px] flex justify-between border-t-2 border-[#0b0b0c] pt-[12px] text-[18px] font-bold"><span>Total repayable</span><span>{formatINR(o.total)}</span></div>
      </div>
      <p className="mx-[20px] mt-[12px] text-[13px] text-[#6b6b70]">{formatINR(o.perMonth)} a month · from our lending partner. Review the key facts before you accept.</p>
    </div>
  );
}

/* --------------------------------------------------------- Receipt */
export function PayReceiptScreen() {
  const rows: [string, string][] = [["Vendor", "Campus Cafe"], ["Amount", "₹120"], ["Fee", "₹5"], ["Total to repay", "₹125"], ["Repay by", "30 Nov"], ["Method", `${BRAND.name} card ••0042`]];
  return (
    <div className="flex h-full flex-col bg-[#f6f5f3] text-[#0b0b0c]">
      <StatusBar />
      <div className="flex items-center gap-[8px] px-[16px] pt-[6px] text-[17px] text-[#2F7DF6]"><ChevronLeft className="size-[22px]" aria-hidden /> Activity</div>
      <h3 className="px-[20px] pt-[12px] text-[30px] font-bold tracking-[-0.03em]">Receipt</h3>
      <div className="mx-[16px] mt-[14px] rounded-[18px] bg-white p-[16px]">
        <ul className="divide-y divide-black/[.06]">
          {rows.map(([k, v]) => (
            <li key={k} className="flex justify-between py-[11px] text-[16px]"><span className="text-[#6b6b70]">{k}</span><span className="font-semibold">{v}</span></li>
          ))}
        </ul>
      </div>
      <p className="mx-[20px] mt-[12px] flex items-center gap-[6px] text-[13px] text-[#15803d]"><Check className="size-[14px]" strokeWidth={3} aria-hidden /> Payment matched with lender records</p>
    </div>
  );
}

/* --------------------------------------------------------- Credit passport (dark indigo) */
export function PassportScreen() {
  const stats: [string, string, string][] = [["6", "on-time repayments", "y"], ["₹4,350", "total repaid", "g"], ["₹5,000", "current limit", "g"], ["82", "Aura, Main Character", "p"]];
  const stickers: [string][] = [["Verified"], ["On time"], ["Limit up"]];
  return (
    <div className="relative h-full overflow-hidden text-white" style={{ background: "linear-gradient(180deg,#0A0620 0%,#160A47 55%,#1B0B5E 100%)" }}>
      <div aria-hidden className="absolute inset-0 opacity-50" style={{ backgroundImage: "radial-gradient(rgba(180,170,255,.35) 1px, transparent 1px)", backgroundSize: "12px 12px", maskImage: "radial-gradient(80% 50% at 50% 35%, #000, transparent)" }} />
      <div aria-hidden className="absolute -top-[120px] left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-[#6D4BFF] opacity-30 blur-[80px]" />
      <div className="relative">
        <StatusBar dark />
        <div className="flex items-center justify-between px-[20px] pt-[6px]">
          <div className="flex items-center gap-[10px]">
            <LogoMark className="size-[34px]" />
            <p className="text-[26px] font-extrabold leading-none tracking-[-0.05em]">Credit passport</p>
          </div>
          <span className="grid size-[34px] place-items-center rounded-full bg-white/10"><Share className="size-[16px]" aria-hidden /></span>
        </div>
        <div className="flex gap-[8px] px-[20px] pt-[12px] text-[13px] font-bold">
          {["2026", "This semester", "All time"].map((p, i) => (
            <span key={p} className="rounded-full px-[12px] py-[6px]" style={i === 0 ? { background: Y, color: "#111" } : { background: "rgba(255,255,255,.1)" }}>{p}</span>
          ))}
        </div>
        <svg viewBox="0 0 390 200" className="mt-[8px] w-full" aria-hidden>
          <defs>
            <linearGradient id="pp-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#F5D832" stopOpacity=".45" /><stop offset="1" stopColor="#8B7BFF" stopOpacity="0" /></linearGradient>
          </defs>
          <path d="M40 175 L110 152 L180 138 L250 104 L320 72 L360 58 L360 200 L40 200Z" fill="url(#pp-area)" />
          <path d="M40 175 L110 152 L180 138 L250 104 L320 72 L360 58" fill="none" stroke="#F5D832" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {[[40, 175, "₹1k"], [180, 138, "₹3k"], [360, 58, "₹5k"]].map(([x, y, l]) => (
            <g key={l as string}><circle cx={x as number} cy={y as number} r="6" fill="#fff" stroke="#F5D832" strokeWidth="3" /><text x={(x as number) - 10} y={(y as number) - 14} fontSize="13" fontWeight="700" fill="#fff">{l}</text></g>
          ))}
        </svg>
        <div className="grid grid-cols-2 gap-[10px] px-[16px] pt-[4px]">
          {stats.map(([v, k, tone]) => (
            <div key={k} className={tone === "y" ? "rounded-[20px] bg-[#F5D832] p-[14px] text-[#111]" : "rounded-[20px] bg-white/[.08] p-[14px] ring-1 ring-white/12"}>
              <p className="text-[30px] font-extrabold leading-none tracking-[-0.05em]">{v}</p>
              <p className={tone === "y" ? "pt-[6px] text-[13px] font-medium text-black/65" : "pt-[6px] text-[13px] text-white/60"}>{k}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-[8px] px-[16px] pt-[12px]">
          {stickers.map(([label]) => (
            <span key={label} className="rounded-full border border-white/20 bg-white/[.06] px-[12px] py-[6px] text-[12.5px] font-semibold">{label}</span>
          ))}
        </div>
        <ul className="space-y-[8px] px-[16px] pt-[14px]">
          {([["Repaid ₹1,150", "on time", "+3 Aura"], ["Limit up to ₹5,000", "step 4", "new"], ["Repaid ₹600", "3 in a row", "+4 Aura"]] as const).map(([a, b, c]) => (
            <li key={a} className="flex items-center justify-between rounded-[16px] bg-white/[.06] px-[12px] py-[9px] ring-1 ring-white/10">
              <span className="leading-tight"><span className="block text-[13.5px] font-bold">{a}</span><span className="block text-[12px] text-white/55">{b}</span></span>
              <span className="rounded-full bg-[#F5D832] px-[9px] py-[3px] text-[11.5px] font-extrabold text-[#111]">{c}</span>
            </li>
          ))}
        </ul>
        <p className="px-[20px] pt-[12px] text-[12px] text-white/55">Internal score, not a bureau score. Sample data.</p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Lock screen reminders */
export function LockScreenReminders({ wallpaper = "linear-gradient(180deg,#3A0E07 0%,#8E2A12 45%,#E2572A 100%)" }: { wallpaper?: string }) {
  const notes = [
    { icon: Clock, t: "Repayment due tomorrow", d: "₹1,150 · due 2 Nov", time: "now" },
    { icon: Check, t: "Paid ₹120 at Campus Cafe", d: "Receipt saved", time: "2h ago" },
    { icon: Bell, t: "Statement ready", d: "October", time: "Yesterday" },
  ];
  return (
    <div className="relative h-full text-white" style={{ background: wallpaper }}>
      <StatusBar dark />
      <div className="flex flex-col items-center pt-[10px]">
        <Lock className="size-[18px] opacity-80" aria-hidden />
        <p className="pt-[6px] text-[18px] font-semibold opacity-90">Thursday 30 October</p>
        <p className="text-[96px] font-bold leading-none tracking-[-0.04em]">9:41</p>
      </div>
      <ul className="mt-auto space-y-[8px] px-[12px] pt-[230px]">
        {notes.map((n) => (
          <li key={n.t} className="flex items-start gap-[10px] rounded-[20px] bg-white/[.18] p-[12px] backdrop-blur-md">
            <LogoMark className="size-[36px]" />
            <div className="min-w-0 flex-1">
              <p className="flex justify-between text-[14px] font-semibold"><span>{BRAND.name}</span><span className="font-normal opacity-70">{n.time}</span></p>
              <p className="text-[15px] font-semibold">{n.t}</p>
              <p className="text-[14px] opacity-80">{n.d}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Icons used by the landing notification feed (kept here so screens and feed share one look). */
export const FEED_ICONS = { Coffee, Printer, UtensilsCrossed, IdCard, Bell, Clock, Check, Sparkles };
