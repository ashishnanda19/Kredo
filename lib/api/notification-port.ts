/**
 * NotificationPort: push, SMS and WhatsApp delivery. The MVP shows reminders in the in-app tray only; this port is
 * where real delivery plugs in later. The mock records what would have been sent.
 */
export interface OutboundNotification {
  accountId: string;
  title: string;
  body: string;
}

export interface NotificationPort {
  deliver(n: OutboundNotification): Promise<void>;
}

export function createMockNotifications(): NotificationPort & { sent: OutboundNotification[] } {
  const sent: OutboundNotification[] = [];
  return {
    sent,
    async deliver(n) {
      sent.push(n);
    },
  };
}
