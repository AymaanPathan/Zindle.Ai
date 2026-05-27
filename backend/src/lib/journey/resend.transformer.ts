import { JourneyEvent } from "../../types/journey";
import { formatISODate } from "./helpers";

/**
 * Normalises Resend webhook event type strings.
 *
 * Resend sends both formats depending on version:
 *   - Legacy:  "sent" | "delivered" | "opened" | "clicked" | "bounced"
 *   - Current: "email.sent" | "email.delivered" | "email.opened" | ...
 */
function normaliseResendType(raw: string): string {
  return (raw ?? "").toLowerCase().replace(/^email\./, "");
}

/**
 * Maps raw Resend email_events rows to JourneyEvents.
 *
 * Key behaviours:
 *  - The first "sent" event → `email_sent`   (initial invoice email)
 *  - Subsequent "sent" events → `follow_up_sent` with a numbered label
 *  - "bounced" → `email_bounced` with warning status
 *  - Opens / clicks carry ip_address + user_agent metadata for context
 */
export function mapEmailEventsToJourneyEvents(
  emailEvents: any[],
): JourneyEvent[] {
  const events: JourneyEvent[] = [];

  // Count how many times an email has been sent so we can label follow-ups.
  let sentCount = 0;

  for (const e of emailEvents) {
    const type = normaliseResendType(e.type);
    const ts = formatISODate(e.created);

    switch (type) {

      // ── Sent ──────────────────────────────────────────────────────────────

      case "sent": {
        sentCount++;
        const isFollowUp = sentCount > 1;

        events.push({
          id: `resend_sent_${e.email_id ?? e.id ?? sentCount}`,
          type: isFollowUp ? "follow_up_sent" : "email_sent",
          label: isFollowUp
            ? `Follow-up Email Sent (#${sentCount - 1})`
            : "Invoice Email Sent",
          source: "resend",
          timestamp: ts,
          status: "completed",
          metadata: {
            emailId: e.email_id ?? null,
            isFollowUp,
            followUpNumber: isFollowUp ? sentCount - 1 : undefined,
          },
        });
        break;
      }

      // ── Delivered ─────────────────────────────────────────────────────────

      case "delivered":
        events.push({
          id: `resend_delivered_${e.email_id ?? e.id}`,
          type: "email_delivered",
          label: "Email Delivered",
          source: "resend",
          timestamp: ts,
          status: "completed",
          metadata: {
            emailId: e.email_id ?? null,
          },
        });
        break;

      // ── Opened ────────────────────────────────────────────────────────────

      case "opened":
        events.push({
          id: `resend_opened_${e.id}`,
          type: "email_opened",
          label: "Email Opened",
          source: "resend",
          timestamp: ts,
          status: "completed",
          metadata: {
            emailId: e.email_id ?? null,
            // Useful for "opened at midnight" style AI insights
            ipAddress: e.ip_address ?? null,
            userAgent: e.user_agent ?? null,
          },
        });
        break;

      // ── Clicked ───────────────────────────────────────────────────────────

      case "clicked":
        events.push({
          id: `resend_clicked_${e.id}`,
          type: "email_clicked",
          label: "Payment Link Clicked",
          source: "resend",
          timestamp: ts,
          status: "completed",
          metadata: {
            emailId: e.email_id ?? null,
            link: e.link ?? null,
            ipAddress: e.ip_address ?? null,
          },
        });
        break;

      // ── Bounced ───────────────────────────────────────────────────────────

      case "bounced":
      case "bounce":
        events.push({
          id: `resend_bounced_${e.email_id ?? e.id}`,
          type: "email_bounced",
          label: "Email Bounced",
          source: "resend",
          timestamp: ts,
          // Treat a bounce as a warning — it's not "ghosted" but needs attention
          status: "warning",
          metadata: {
            emailId: e.email_id ?? null,
          },
        });
        break;

      // ── Unknown types — skip silently ─────────────────────────────────────

      default:
        break;
    }
  }

  return events;
}