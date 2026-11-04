"use client";

import { useState } from "react";
import { GlassButton } from "@/components/glass";
import { Badge } from "@/components/ui/badge";
import { AURA_W } from "@/lib/copy-demo";
import type { QuestView } from "@/lib/domain/recovery";
import { completeQuest } from "@/lib/store/pay-actions";

const TONE = { done: "success", available: "accent", capped: "neutral", needs_overdue_paid: "warning", locked: "neutral" } as const;

/** The quests, with what each would add today and why any is unavailable. Tapped quests run through the verification mock. */
export function QuestList({ studentId, quests }: { studentId: string; quests: QuestView[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null);

  async function run(q: QuestView) {
    if (!q.manual) return;
    setBusy(q.id);
    setMsg(null);
    try {
      const r = await completeQuest(studentId, q.id as "verify_identity" | "verify_bank" | "set_reminders");
      setMsg({ id: q.id, ok: r.ok, text: r.ok ? AURA_W.questDone(r.delta) : r.message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <ul className="divide-y divide-hairline" data-testid="quest-list">
      {quests.map((q) => (
        <li key={q.id} data-testid={`quest-${q.id}`} data-status={q.status} className="py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{q.title}</p>
              {q.note && <p className="mt-0.5 text-xs text-ink-2">{q.note}</p>}
              {msg?.id === q.id && <p role="status" className={`mt-1 text-xs font-semibold ${msg.ok ? "text-ok-text" : "text-bad-text"}`}>{msg.text}</p>}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <Badge tone={TONE[q.status]}>{q.status === "available" && q.aura ? `+${q.aura} Aura` : AURA_W.questStatus[q.status]}</Badge>
              {q.manual && q.status === "available" && (
                <GlassButton size="sm" className="min-h-9 px-3 text-xs" data-testid={`do-${q.id}`} disabled={busy !== null} onClick={() => void run(q)}>
                  {busy === q.id ? AURA_W.questWorking : AURA_W.questAction}
                </GlassButton>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
