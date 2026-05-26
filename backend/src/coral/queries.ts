

export const queries = {
  getAllClients: `
    SELECT
      h.id                                          AS hubspot_id,
      h.firstname,
      h.lastname,
      h.email,
      h.company,
      h.lifecyclestage,
      h.createdate                                  AS hubspot_created_at,

      -- Stripe aggregates (NULL-safe: 0 when no invoices)
      COALESCE(COUNT(s.id), 0)                      AS invoice_count,
      COALESCE(SUM(s.amount_due),      0)           AS total_invoiced,
      COALESCE(SUM(s.amount_paid),     0)           AS total_paid,
      COALESCE(SUM(s.amount_due - s.amount_paid), 0) AS total_due,

      COALESCE(SUM(CASE WHEN s.status = 'paid'
                        THEN 1 ELSE 0 END), 0)      AS paid_invoice_count,
      COALESCE(SUM(CASE WHEN s.status NOT IN ('paid','void')
                        THEN 1 ELSE 0 END), 0)      AS open_invoice_count,

      MAX(s.status_transitions__paid_at)            AS last_payment_at,
      MIN(CASE WHEN s.status NOT IN ('paid','void')
               THEN s.due_date END)                 AS earliest_open_due_date

    FROM hubspot.contacts h
    LEFT JOIN stripe.invoices s
      ON LOWER(s.customer_email) = LOWER(h.email)
    WHERE h.email IS NOT NULL
    GROUP BY
      h.id, h.firstname, h.lastname, h.email,
      h.company, h.lifecyclestage, h.createdate
    ORDER BY h.createdate DESC
  `,

  getAllHubspotContacts: `
    SELECT
      id,
      firstname,
      lastname,
      email,
      company,
      lifecyclestage,
      createdate
    FROM hubspot.contacts
    WHERE email IS NOT NULL
    ORDER BY createdate DESC
  `,

  getHubspotContactByEmail: (email: string) => `
    SELECT
      id,
      firstname,
      lastname,
      email,
      company,
      lifecyclestage,
      createdate
    FROM hubspot.contacts
    WHERE LOWER(email) = LOWER('${email}')
    LIMIT 1
  `,

  getRecentInvoices: `
    SELECT
      s.id,
      s.number,
      s.customer_email,
      s.customer_name,
      h.firstname,
      h.lastname,
      h.company,
      s.amount_paid,
      s.amount_due,
      (s.amount_due - s.amount_paid)  AS amount_remaining,
      s.status,
      s.created,
      s.due_date,
      s.hosted_invoice_url,
      s.invoice_pdf
    FROM stripe.invoices s
    INNER JOIN hubspot.contacts h
      ON LOWER(h.email) = LOWER(s.customer_email)
    ORDER BY s.created DESC
    LIMIT 20
  `,


  getRevenueByStatus: `
    SELECT
      s.status,
      COUNT(*)              AS count,
      SUM(s.amount_paid)    AS total_revenue,
      SUM(s.amount_due)     AS total_invoiced,
      SUM(s.amount_due - s.amount_paid) AS total_outstanding
    FROM stripe.invoices s
    INNER JOIN hubspot.contacts h
      ON LOWER(h.email) = LOWER(s.customer_email)
    GROUP BY s.status
    ORDER BY total_revenue DESC
  `,


  getTopCustomers: `
    SELECT
      h.email,
      h.firstname,
      h.lastname,
      h.company,
      COUNT(s.id)           AS total_invoices,
      SUM(s.amount_paid)    AS total_paid
    FROM hubspot.contacts h
    INNER JOIN stripe.invoices s
      ON LOWER(s.customer_email) = LOWER(h.email)
      AND s.status = 'paid'
    GROUP BY h.email, h.firstname, h.lastname, h.company
    ORDER BY total_paid DESC
    LIMIT 10
  `,


  getInvoiceById: (id: string) => `
    SELECT
      s.id,
      s.number,
      s.status,
      s.customer_email,
      s.customer_name,
      s.amount_due,
      s.amount_paid,
      (s.amount_due - s.amount_paid)  AS amount_remaining,
      s.created,
      s.due_date,
      s.status_transitions__paid_at   AS paid_at,
      s.hosted_invoice_url,
      s.invoice_pdf,

      -- HubSpot enrichment
      h.id            AS hubspot_id,
      h.firstname,
      h.lastname,
      h.company,
      h.lifecyclestage
    FROM stripe.invoices s
    INNER JOIN hubspot.contacts h
      ON LOWER(h.email) = LOWER(s.customer_email)
    WHERE s.id = '${id}'
    LIMIT 1
  `,


getCustomerInvoices: (email: string) => `
  SELECT
    s.id,
    s.number,
    s.status,
    s.amount_due,
    s.amount_paid,
     s.total, 
    (s.amount_due - s.amount_paid)  AS amount_remaining,
    s.created,
    s.due_date,
    s.status_transitions__paid_at   AS paid_at,
    s.hosted_invoice_url,
    s.invoice_pdf
  FROM stripe.invoices s
  INNER JOIN hubspot.contacts h
    ON LOWER(h.email) = LOWER(s.customer_email)
  WHERE LOWER(s.customer_email) = LOWER('${email}')
  ORDER BY s.created DESC
`,  

getCustomerProfileAndInvoices: (email: string) => `
  SELECT
    h.id              AS hubspot_id,
    h.firstname,
    h.lastname,
    h.email,
    h.company,
    h.lifecyclestage,
    h.createdate,

    s.id              AS invoice_id,
    s.number,
    s.status,
    s.amount_due,
    s.amount_paid,
    (s.amount_due - s.amount_paid) AS amount_remaining,
    s.created,
    s.due_date,
    s.status_transitions__paid_at,
    s.hosted_invoice_url,
    s.invoice_pdf

  FROM hubspot.contacts h
  LEFT JOIN stripe.invoices s
    ON LOWER(s.customer_email) = LOWER(h.email)
  WHERE LOWER(h.email) = LOWER('${email}')
  ORDER BY s.created DESC
`,


  getCustomerInvoicesByStatus: (email: string, status: string) => `
    SELECT
      s.id,
      s.number,
      s.status,
      s.amount_due,
      s.amount_paid,
      (s.amount_due - s.amount_paid)  AS amount_remaining,
      s.created,
      s.due_date,
      s.status_transitions__paid_at   AS paid_at,
      s.hosted_invoice_url,
      s.invoice_pdf
    FROM stripe.invoices s
    INNER JOIN hubspot.contacts h
      ON LOWER(h.email) = LOWER(s.customer_email)
    WHERE LOWER(s.customer_email) = LOWER('${email}')
      AND s.status = '${status}'
    ORDER BY s.created ASC
  `,


  getInvoicesByDateRange: (
    from: string,
    to: string,
    email?: string,
  ) => `
    SELECT
      s.id,
      s.number,
      s.status,
      s.customer_email,
      h.firstname,
      h.lastname,
      h.company,
      s.amount_due,
      s.amount_paid,
      (s.amount_due - s.amount_paid)  AS amount_remaining,
      s.created,
      s.due_date,
      s.hosted_invoice_url,
      s.invoice_pdf
    FROM stripe.invoices s
    INNER JOIN hubspot.contacts h
      ON LOWER(h.email) = LOWER(s.customer_email)
    WHERE s.created BETWEEN '${from}' AND '${to}'
      ${email ? `AND LOWER(s.customer_email) = LOWER('${email}')` : ""}
    ORDER BY s.created DESC
  `,

  getJourneyInvoiceById: (invoiceId: string) => `
    SELECT
      s.id,
      s.number,
      s.customer_email,
      s.amount_due,
      s.amount_paid,
      (s.amount_due - s.amount_paid)  AS amount_remaining,
      s.status,
      s.created,
      s.due_date,
      s.status_transitions__paid_at   AS paid_at,
      s.hosted_invoice_url,
      s.invoice_pdf
    FROM stripe.invoices s
    INNER JOIN hubspot.contacts h
      ON LOWER(h.email) = LOWER(s.customer_email)
    WHERE s.id = '${invoiceId}'
    LIMIT 1
  `,


  getCustomerProfile360: (email: string) => `
    SELECT
      -- ── Identity (HubSpot) ──────────────────────────────────────────
      h.id                                            AS hubspot_id,
      h.firstname,
      h.lastname,
      h.email,
      h.company,
      h.lifecyclestage,
      h.createdate                                    AS hubspot_created_at,

      -- ── Invoice Counts ──────────────────────────────────────────────
      COALESCE(COUNT(s.id), 0)                        AS invoice_count,
      COALESCE(SUM(CASE WHEN s.status = 'paid'
                        THEN 1 ELSE 0 END), 0)        AS paid_count,
      COALESCE(SUM(CASE WHEN s.status = 'open'
                        THEN 1 ELSE 0 END), 0)        AS open_count,
      COALESCE(SUM(CASE WHEN s.status = 'uncollectible'
                        THEN 1 ELSE 0 END), 0)        AS uncollectible_count,
      COALESCE(SUM(CASE WHEN s.status = 'void'
                        THEN 1 ELSE 0 END), 0)        AS void_count,

      -- ── Financial Totals ────────────────────────────────────────────
      COALESCE(SUM(s.amount_due),  0)                 AS total_invoiced,
      COALESCE(SUM(s.amount_paid), 0)                 AS total_paid,
      COALESCE(SUM(s.amount_due - s.amount_paid), 0)  AS total_due,

      -- ── Payment Health ──────────────────────────────────────────────
      CASE
        WHEN COALESCE(SUM(s.amount_due), 0) = 0 THEN NULL
        ELSE ROUND(
          COALESCE(SUM(s.amount_paid), 0) * 100.0
          / NULLIF(SUM(s.amount_due), 0), 2
        )
      END                                             AS payment_rate_pct,

      -- ── Key Dates ───────────────────────────────────────────────────
      MAX(s.status_transitions__paid_at)              AS last_paid_at,
      MAX(s.created)                                  AS last_invoice_created_at,
      MIN(CASE WHEN s.status NOT IN ('paid','void')
               THEN s.due_date END)                   AS earliest_open_due_date,

      -- ── Days-since / days-until helpers (use in app layer too) ──────
      DATEDIFF('day',
        MAX(s.status_transitions__paid_at),
        CURRENT_DATE
      )                                               AS days_since_last_payment,
      DATEDIFF('day',
        CURRENT_DATE,
        MIN(CASE WHEN s.status NOT IN ('paid','void')
                 THEN s.due_date END)
      )                                               AS days_until_earliest_due

    FROM hubspot.contacts h
    LEFT JOIN stripe.invoices s
      ON LOWER(s.customer_email) = LOWER(h.email)
    WHERE LOWER(h.email) = LOWER('${email}')
    GROUP BY
      h.id, h.firstname, h.lastname, h.email,
      h.company, h.lifecyclestage, h.createdate
    LIMIT 1
  `,


  getCustomerRevenueByYear: (email: string) => `
    SELECT
      DATE_TRUNC('year', s.created)   AS year,
      COUNT(s.id)                     AS invoice_count,
      SUM(s.amount_due)               AS total_invoiced,
      SUM(s.amount_paid)              AS total_paid,
      SUM(s.amount_due - s.amount_paid) AS total_due
    FROM stripe.invoices s
    INNER JOIN hubspot.contacts h
      ON LOWER(h.email) = LOWER(s.customer_email)
    WHERE LOWER(s.customer_email) = LOWER('${email}')
    GROUP BY DATE_TRUNC('year', s.created)
    ORDER BY year ASC
  `,


  getCustomerRevenueByMonth: (email: string) => `
    SELECT
      DATE_TRUNC('month', s.created)  AS month,
      COUNT(s.id)                     AS invoice_count,
      SUM(s.amount_due)               AS total_invoiced,
      SUM(s.amount_paid)              AS total_paid,
      SUM(s.amount_due - s.amount_paid) AS total_due
    FROM stripe.invoices s
    INNER JOIN hubspot.contacts h
      ON LOWER(h.email) = LOWER(s.customer_email)
    WHERE LOWER(s.customer_email) = LOWER('${email}')
    GROUP BY DATE_TRUNC('month', s.created)
    ORDER BY month ASC
  `,


  getHubspotEmailEvents: (email: string) => `
    SELECT
      recipient,
      type,
      created,
      subject,
      sender
    FROM hubspot.email_events
    WHERE LOWER(recipient) = LOWER('${email}')
    ORDER BY created ASC
  `,


  getJourneyEmailEvents: (email: string) => `
    SELECT
      email,
      type,
      created,
      email_id,
      link,
      ip_address,
      user_agent
    FROM email_events
    WHERE LOWER(email) = LOWER('${email}')
    ORDER BY created ASC
  `,


  getCustomerEmailTimeline: (email: string) => `
    SELECT
      'hubspot'   AS source,
      type,
      created,
      subject,
      sender,
      NULL        AS link,
      NULL        AS email_id
    FROM hubspot.email_events
    WHERE LOWER(recipient) = LOWER('${email}')

    UNION ALL

    SELECT
      'resend'    AS source,
      type,
      created,
      NULL        AS subject,
      NULL        AS sender,
      link,
      email_id
    FROM email_events
    WHERE LOWER(email) = LOWER('${email}')

    ORDER BY created ASC
  `,


  getOverdueClients: `
    SELECT
      h.email,
      h.firstname,
      h.lastname,
      h.company,
      COUNT(s.id)                             AS invoice_count,
      SUM(s.amount_due - s.amount_paid)       AS total_due,
      MAX(s.due_date)                         AS latest_due_date,
      MIN(s.due_date)                         AS earliest_due_date,
      DATEDIFF('day', MIN(s.due_date), CURRENT_DATE) AS oldest_overdue_days
    FROM hubspot.contacts h
    INNER JOIN stripe.invoices s
      ON LOWER(s.customer_email) = LOWER(h.email)
      AND s.status NOT IN ('paid', 'void')
    GROUP BY h.email, h.firstname, h.lastname, h.company
    ORDER BY total_due DESC
  `,


  getCallPriorityClients: `
    SELECT
      h.email,
      h.firstname,
      h.lastname,
      h.company,
      COUNT(s.id)                             AS open_invoices,
      SUM(s.amount_due - s.amount_paid)       AS total_due,
      MAX(s.due_date)                         AS latest_due_date,
      MIN(s.due_date)                         AS earliest_due_date
    FROM hubspot.contacts h
    INNER JOIN stripe.invoices s
      ON LOWER(s.customer_email) = LOWER(h.email)
      AND s.status NOT IN ('paid', 'void')
    GROUP BY h.email, h.firstname, h.lastname, h.company
    ORDER BY total_due DESC
    LIMIT 5
  `,


  getClientsOverdueBeyondDays: (days: number) => `
    SELECT
      h.email,
      h.firstname,
      h.lastname,
      h.company,
      COUNT(s.id)                             AS overdue_invoice_count,
      SUM(s.amount_due - s.amount_paid)       AS total_due,
      MIN(s.due_date)                         AS oldest_due_date,
      DATEDIFF('day', MIN(s.due_date), CURRENT_DATE) AS overdue_days
    FROM hubspot.contacts h
    INNER JOIN stripe.invoices s
      ON LOWER(s.customer_email) = LOWER(h.email)
      AND s.status NOT IN ('paid', 'void')
    WHERE DATEDIFF('day', s.due_date, CURRENT_DATE) > ${days}
    GROUP BY h.email, h.firstname, h.lastname, h.company
    ORDER BY overdue_days DESC
  `,


  getCustomerRiskSummary: (email: string) => `
    SELECT
      h.email,
      h.firstname,
      h.lastname,
      h.company,
      h.lifecyclestage,

      COUNT(s.id)                             AS invoice_count,
      SUM(s.amount_due)                       AS total_invoiced,
      SUM(s.amount_paid)                      AS total_paid,
      SUM(s.amount_due - s.amount_paid)       AS total_due,

      SUM(CASE WHEN s.status = 'paid'         THEN 1 ELSE 0 END) AS paid_invoices,
      SUM(CASE WHEN s.status NOT IN ('paid','void')
                                              THEN 1 ELSE 0 END) AS unpaid_invoices,
      SUM(CASE WHEN s.status = 'uncollectible' THEN 1 ELSE 0 END) AS uncollectible_invoices,

      ROUND(
        SUM(s.amount_paid) * 100.0 / NULLIF(SUM(s.amount_due), 0),
        2
      )                                       AS payment_rate_pct,

      MAX(s.status_transitions__paid_at)      AS last_paid_at,
      MIN(CASE WHEN s.status NOT IN ('paid','void')
               THEN s.due_date END)           AS earliest_open_due_date,
      DATEDIFF('day',
        MIN(CASE WHEN s.status NOT IN ('paid','void')
                 THEN s.due_date END),
        CURRENT_DATE
      )                                       AS oldest_overdue_days
    FROM hubspot.contacts h
    LEFT JOIN stripe.invoices s
      ON LOWER(s.customer_email) = LOWER(h.email)
    WHERE LOWER(h.email) = LOWER('${email}')
    GROUP BY h.email, h.firstname, h.lastname, h.company, h.lifecyclestage
    LIMIT 1
  `,


  getRiskTierSummary: `
    SELECT
      CASE
        WHEN COUNT(s.id) = 0
          THEN 'no_invoices'
        WHEN SUM(CASE WHEN s.status = 'uncollectible' THEN 1 ELSE 0 END) > 0
          THEN 'delinquent'
        WHEN ROUND(SUM(s.amount_paid)*100.0 / NULLIF(SUM(s.amount_due),0), 2) >= 90
          THEN 'healthy'
        WHEN ROUND(SUM(s.amount_paid)*100.0 / NULLIF(SUM(s.amount_due),0), 2) >= 50
          THEN 'at_risk'
        ELSE 'delinquent'
      END                                     AS risk_tier,
      COUNT(DISTINCT h.id)                    AS customer_count,
      SUM(COALESCE(s.amount_due - s.amount_paid, 0)) AS total_exposure
    FROM hubspot.contacts h
    LEFT JOIN stripe.invoices s
      ON LOWER(s.customer_email) = LOWER(h.email)
    WHERE h.email IS NOT NULL
    GROUP BY risk_tier
    ORDER BY total_exposure DESC
  `,


  getNeverPaidCustomers: `
    SELECT
      h.email,
      h.firstname,
      h.lastname,
      h.company,
      COUNT(s.id)                           AS invoice_count,
      SUM(s.amount_due)                     AS total_owed,
      MIN(s.due_date)                       AS first_due_date
    FROM hubspot.contacts h
    INNER JOIN stripe.invoices s
      ON LOWER(s.customer_email) = LOWER(h.email)
    GROUP BY h.email, h.firstname, h.lastname, h.company
    HAVING SUM(CASE WHEN s.status = 'paid' THEN 1 ELSE 0 END) = 0
    ORDER BY total_owed DESC
  `,


  getPartiallyPayingCustomers: `
    SELECT
      h.email,
      h.firstname,
      h.lastname,
      h.company,
      COUNT(s.id)                           AS invoice_count,
      SUM(s.amount_paid)                    AS total_paid,
      SUM(s.amount_due - s.amount_paid)     AS total_due,
      ROUND(
        SUM(s.amount_paid)*100.0 / NULLIF(SUM(s.amount_due),0), 2
      )                                     AS payment_rate_pct
    FROM hubspot.contacts h
    INNER JOIN stripe.invoices s
      ON LOWER(s.customer_email) = LOWER(h.email)
    GROUP BY h.email, h.firstname, h.lastname, h.company
    HAVING
      SUM(CASE WHEN s.status = 'paid' THEN 1 ELSE 0 END) > 0
      AND SUM(CASE WHEN s.status NOT IN ('paid','void') THEN 1 ELSE 0 END) > 0
    ORDER BY total_due DESC
  `,


  searchCustomers: (term: string) => `
    SELECT
      h.id                                          AS hubspot_id,
      h.firstname,
      h.lastname,
      h.email,
      h.company,
      h.lifecyclestage,
      COALESCE(SUM(s.amount_due - s.amount_paid), 0) AS total_due,
      COALESCE(COUNT(s.id), 0)                      AS invoice_count
    FROM hubspot.contacts h
    LEFT JOIN stripe.invoices s
      ON LOWER(s.customer_email) = LOWER(h.email)
    WHERE
      LOWER(h.email)     LIKE LOWER('%${term}%')
      OR LOWER(h.firstname) LIKE LOWER('%${term}%')
      OR LOWER(h.lastname)  LIKE LOWER('%${term}%')
      OR LOWER(h.company)   LIKE LOWER('%${term}%')
    GROUP BY
      h.id, h.firstname, h.lastname,
      h.email, h.company, h.lifecyclestage
    ORDER BY total_due DESC
    LIMIT 20
  `,


  getCustomerByInvoiceId: (invoiceId: string) => `
    SELECT
      h.id            AS hubspot_id,
      h.firstname,
      h.lastname,
      h.email,
      h.company,
      h.lifecyclestage,
      h.createdate
    FROM stripe.invoices s
    INNER JOIN hubspot.contacts h
      ON LOWER(h.email) = LOWER(s.customer_email)
    WHERE s.id = '${invoiceId}'
    LIMIT 1
  `,
};