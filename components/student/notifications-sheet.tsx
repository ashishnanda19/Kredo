"use client";

import { GlassSheet, GlassSheetContent, GlassSheetDescription, GlassSheetTitle } from "@/components/glass";
import { STUDENT } from "@/lib/copy-demo";
import { fmtDateTime } from "@/lib/domain/time";
import { useWorld } from "@/lib/store/world";

/** The in-app tray: reminders, overdue notices, limit changes. Opening it marks everything as seen. */
export function NotificationsTray({ open, onOpenChange, accountId }: { open: boolean; onOpenChange: (o: boolean) => void; accountId: string }) {
  const all = useWorld((s) => s.world.notifications);
  const notes = all.filter((n) => n.accountId === accountId);
  const markSeen = useWorld((s) => s.markSeen);
  const items = [...notes].sort((a, b) => b.at - a.at || b.id.localeCompare(a.id)).slice(0, 30);
  return (
    <GlassSheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) markSeen(accountId); }}>
      <GlassSheetContent>
        <GlassSheetTitle className="text-xl font-extrabold">{STUDENT.notes.title}</GlassSheetTitle>
        <GlassSheetDescription className="sr-only">Reminders and notices about your payments.</GlassSheetDescription>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-2">{STUDENT.notes.empty}</p>
        ) : (
          <ul data-testid="notes-list" className="mt-3 divide-y divide-hairline">
            {items.map((n) => (
              <li key={n.id} className="py-3">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-sm text-ink-2">{n.body}</p>
                <p className="mt-0.5 text-xs text-ink-2">{fmtDateTime(n.at)}</p>
              </li>
            ))}
          </ul>
        )}
      </GlassSheetContent>
    </GlassSheet>
  );
}

/** Count of notifications since the tray was last opened. */
export function useUnread(accountId: string | undefined): number {
  return useWorld((s) => (accountId ? s.world.notifications.filter((n) => n.accountId === accountId && n.at > (s.seen[accountId] ?? -1)).length : 0));
}
