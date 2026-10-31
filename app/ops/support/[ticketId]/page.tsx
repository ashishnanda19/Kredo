import { OpsTicketDetail } from "@/components/ops/support";

export const metadata = { title: "Ticket (internal)" };

export default async function Page({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  return <OpsTicketDetail id={ticketId} />;
}
