import { Router, Request, Response } from "express";
import { collectAllSignals, collectSignalsForEmail } from "../risk/collector";
import { calculateRiskScore } from "../risk/scorer";
import { generateRiskInsight, generateBatchInsights } from "../ai/ai";
import { RiskProfile } from "../risk/signals";
import { runCoralQuery } from "../coral/client";

const router = Router();

router.get("/risk/all", async (req: Request, res: Response) => {
  try {
    const includeAI = req.query.ai === "true";
    const categoryFilter = req.query.category as string | undefined;
    const minScore = req.query.minScore ? Number(req.query.minScore) : 0;

    const signalMap = await collectAllSignals();

    let profiles: RiskProfile[] = [];
    for (const signals of signalMap.values()) {
      const profile = calculateRiskScore(signals);
      profiles.push(profile);
    }

    if (categoryFilter) {
      profiles = profiles.filter((p) => p.category === categoryFilter);
    }
    if (minScore > 0) {
      profiles = profiles.filter((p) => p.score >= minScore);
    }

    profiles.sort((a, b) => b.score - a.score);

    let aiInsights: Map<string, any> = new Map();
    if (includeAI && profiles.length > 0) {
      try {
        aiInsights = await Promise.race([
          generateBatchInsights(profiles, { onlyHighRisk: true, maxConcurrent: 3 }),
          new Promise<Map<string, any>>((_, reject) =>
            setTimeout(() => reject(new Error("Batch AI timeout")), 45_000)
          ),
        ]);
      } catch (aiErr: any) {
        console.warn("⚠️ Batch AI insights skipped:", aiErr.message);
      }
    }

    const data = profiles.map((p) => ({
      email: p.email,
      name: p.name,
      company: p.company,
      score: p.score,
      category: p.category,
      breakdown: p.breakdown,
      totalAmountDue: p.signals.stripe.totalAmountDue,
      daysOverdue: p.signals.stripe.daysOverdue,
      calculatedAt: p.calculatedAt,
      ...(aiInsights.has(p.email) ? { ai: aiInsights.get(p.email) } : {}),
    }));

    const summary = {
      total: profiles.length,
      critical: profiles.filter((p) => p.category === "critical").length,
      high_risk: profiles.filter((p) => p.category === "high_risk").length,
      watch: profiles.filter((p) => p.category === "watch").length,
      healthy: profiles.filter((p) => p.category === "healthy").length,
      totalAmountAtRisk: profiles
        .filter((p) => p.category !== "healthy")
        .reduce((s, p) => s + p.signals.stripe.totalAmountDue, 0),
    };

    res.json({ success: true, summary, data });
  } catch (err: any) {
    console.error("❌ /api/risk/all error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/risk/summary", async (_req: Request, res: Response) => {
  try {
    const signalMap = await collectAllSignals();

    const profiles: RiskProfile[] = [];
    for (const signals of signalMap.values()) {
      profiles.push(calculateRiskScore(signals));
    }

    profiles.sort((a, b) => b.score - a.score);

    const top5 = profiles.slice(0, 5).map((p) => ({
      email: p.email,
      name: p.name,
      company: p.company,
      score: p.score,
      category: p.category,
      topReason: p.breakdown[0]?.reason ?? "No signals",
      totalAmountDue: p.signals.stripe.totalAmountDue,
    }));

    res.json({
      success: true,
      data: {
        totals: {
          all: profiles.length,
          critical: profiles.filter((p) => p.category === "critical").length,
          high_risk: profiles.filter((p) => p.category === "high_risk").length,
          watch: profiles.filter((p) => p.category === "watch").length,
          healthy: profiles.filter((p) => p.category === "healthy").length,
        },
        totalAmountAtRisk: profiles
          .filter((p) => p.category !== "healthy")
          .reduce((s, p) => s + p.signals.stripe.totalAmountDue, 0),
        topRiskCustomers: top5,
      },
    });
  } catch (err: any) {
    console.error("❌ /api/risk/summary error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/risk/:email(*)", async (req: Request, res: Response) => {
  // Bump timeouts for AI-heavy route
  req.setTimeout(60_000);
  res.setTimeout(60_000);

  try {
    const { email } = req.params;
    const includeAI = req.query.ai !== "false"; // default true

    if (!email || !email.includes("@")) {
      return res.status(400).json({ success: false, error: "Invalid email" });
    }

    const signals = await collectSignalsForEmail(email);

    if (!signals) {
      return res.status(404).json({
        success: false,
        error: `No data found for customer: ${email}`,
      });
    }

    const profile = calculateRiskScore(signals);

    const [invoices] = await Promise.all([
      runCoralQuery<any[]>(`
        SELECT number, status, amount_due, amount_paid,
          due_date, status_transitions__paid_at, hosted_invoice_url
        FROM stripe.invoices
        WHERE LOWER(customer_email) = LOWER('${email.replace(/'/g, "''")}')
        ORDER BY created DESC
      `).catch(() => []),
    ]);

    // AI insight — non-blocking: times out gracefully, never fails the request
    let ai = null;
    if (includeAI) {
      try {
        ai = await Promise.race([
          generateRiskInsight(profile, invoices),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("AI timeout")), 30_000)
          ),
        ]);
      } catch (aiErr: any) {
        console.warn("⚠️ AI insight skipped:", aiErr.message);
      }
    }

    res.json({
      success: true,
      data: {
        email: profile.email,
        name: profile.name,
        company: profile.company,
        score: profile.score,
        category: profile.category,
        breakdown: profile.breakdown,
        signals: {
          stripe: profile.signals.stripe,
          hubspot: profile.signals.hubspot,
        },
        calculatedAt: profile.calculatedAt,
        ...(ai ? { ai } : {}),
      },
    });
  } catch (err: any) {
    console.error("❌ /api/risk/:email error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;