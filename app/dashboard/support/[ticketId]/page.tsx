import { TicketDetail } from "@/components/support/ticket-detail";

export const metadata = { title: "Ticket" };

export default async function Page({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  return <TicketDetail id={ticketId} />;
}
