import { JourneyEvent } from "../../types/journey";
import { formatISODate } from "./helpers";

/**
 * Maps a HubSpot contact row to its contact_created JourneyEvent.
 * Returns [] if contact is null (not found in CRM).
 */
export function mapHubspotToJourneyEvents(contact: any): JourneyEvent[] {
  if (!contact) return [];

  const fullName = `${contact.firstname ?? ""} ${contact.lastname ?? ""}`.trim();

  return [
    {
      id: `hubspot_contact_${contact.id}`,
      type: "contact_created",
      label: "Contact Added to CRM",
      source: "hubspot",
      timestamp: formatISODate(contact.createdate),
      status: "completed",
      metadata: {
        hubspotId: contact.id,
        name: fullName || null,
        company: contact.company ?? null,
        lifecycleStage: contact.lifecyclestage ?? null,
      },
    },
  ];
}

/**
 * Maps HubSpot email_events rows (e.g. marketing emails, sequences)
 * to JourneyEvents.  These are separate from Resend transactional emails.
 */
export function mapHubspotEmailEventsToJourneyEvents(
  emailEvents: any[],
): JourneyEvent[] {
  const typeMap: Record<string, JourneyEvent["type"]> = {
    SENT: "email_sent",
    DELIVERED: "email_delivered",
    OPEN: "email_opened",
    CLICK: "email_clicked",
  };

  return emailEvents
    .map((e): JourneyEvent | null => {
      const mappedType =
        typeMap[(e.type ?? "").toUpperCase()];

      if (!mappedType) return null;

      return {
        id: `hubspot_email_${e.id ?? e.created}`,
        type: mappedType,
        label: `CRM Email: ${e.subject ?? mappedType}`,
        source: "hubspot",
        timestamp: formatISODate(e.created),
        status: "completed",
        metadata: {
          subject: e.subject ?? null,
          sender: e.sender ?? null,
          recipient: e.recipient ?? null,
        },
      };
    })
    .filter((e): e is JourneyEvent => e !== null);
}