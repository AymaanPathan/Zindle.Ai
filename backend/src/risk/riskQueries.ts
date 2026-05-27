/**
 * riskQueries.ts
 *
 * SQL queries used by the risk signal collector.
 * All Stripe queries are HubSpot-gated (INNER JOIN) so we only score
 * customers who exist in HubSpot.
 *
 * ⚠️  CRITICAL: paid_invoices is counted by STATUS = 'paid', NOT by
 *     amount_paid > 0. Stripe test-mode (and occasionally live) invoices
 *     can have status='paid' while amount_paid=0 due to sync timing or
 *     how the invoice was settled. Status is the authoritative field.
 */

export const riskQueries = {

  // ── Who counts as a customer ─────────────────────────────────────────
  // Only HubSpot contacts — matching the source-of-truth rule.
  getAllKnownEmails: `
    SELECT email
    FROM hubspot.contacts
    WHERE email IS NOT NULL
  `,

  // ── Stripe: current open/overdue state ───────────────────────────────
  // open_invoice_count : invoices not yet paid or voided
  // total_amount_due   : sum of amount still owed on open invoices
  // max_days_overdue   : how many days since the oldest open due_date
  // failed_payments    : invoices whose status is 'uncollectible'
  //                      (Stripe marks these after repeated failures)
  //
  // INNER JOIN hubspot.contacts ensures we skip orphan Stripe invoices.
  // In riskQueries.ts — getStripeRiskSignals:
    getStripeRiskSignals: `
      SELECT
        s.customer_email,
        COUNT(*)                                    AS open_invoice_count,
        -- For open invoices, amount_due IS the amount owed (payment not yet processed)
        SUM(s.amount_due)                           AS total_amount_due,
        MAX(
          CASE
            WHEN s.due_date IS NOT NULL
            THEN DATEDIFF('day', s.due_date, CURRENT_DATE)
            ELSE 0
          END
        )                                           AS max_days_overdue,
        SUM(
          CASE WHEN s.status = 'uncollectible' THEN 1 ELSE 0 END
        )                                           AS failed_payments
      FROM stripe.invoices s
      INNER JOIN hubspot.contacts h
        ON LOWER(h.email) = LOWER(s.customer_email)
      WHERE s.status NOT IN ('paid', 'void')       -- only OPEN invoices
      GROUP BY s.customer_email
    `,

  // ── Stripe: historical payment behaviour ─────────────────────────────
  // paid_invoices      : counted by STATUS = 'paid'  ← not amount_paid
  // historically_late  : invoices that were eventually paid but only
  //                      after their due_date had passed
  getStripePaymentHistory: `
    SELECT
      s.customer_email,
      COUNT(*)                                              AS total_invoices,

      -- Count by status, not by amount_paid column
      SUM(CASE WHEN s.status = 'paid' THEN 1 ELSE 0 END)   AS paid_invoices,

      -- Late: paid after due date
      SUM(
        CASE
          WHEN s.status = 'paid'
            AND s.status_transitions__paid_at IS NOT NULL
            AND s.due_date IS NOT NULL
            AND s.status_transitions__paid_at > s.due_date
          THEN 1
          ELSE 0
        END
      )                                                     AS historically_late
    FROM stripe.invoices s
    INNER JOIN hubspot.contacts h
      ON LOWER(h.email) = LOWER(s.customer_email)
    GROUP BY s.customer_email
  `,

  // ── HubSpot: contact identity ─────────────────────────────────────────
  getHubSpotContacts: `
    SELECT
      id,
      email,
      firstname,
      lastname,
      company,
      lifecyclestage
    FROM hubspot.contacts
    WHERE email IS NOT NULL
  `,

  // ── HubSpot: email engagement signals ────────────────────────────────
  getHubSpotEngagementSignals: `
    SELECT
      recipient                               AS email,
      MAX(CASE WHEN type = 'OPEN'  THEN created END) AS last_open,
      MAX(CASE WHEN type = 'REPLY' THEN created END) AS last_reply,
      SUM(CASE WHEN type = 'OPEN'  THEN 1 ELSE 0 END) AS total_opens,
      SUM(CASE WHEN type = 'REPLY' THEN 1 ELSE 0 END) AS total_replies,
      COUNT(*)                                         AS total_sent,
      SUM(CASE WHEN type = 'BOUNCE' THEN 1 ELSE 0 END) AS total_bounces
    FROM hubspot.email_events
    GROUP BY recipient
  `,

};