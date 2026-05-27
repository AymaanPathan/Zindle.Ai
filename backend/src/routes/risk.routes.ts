import { Router, Request, Response } from "express";
import { collectAllSignals, collectSignalsForEmail } from "../risk/collector";
import { calculateRiskScore } from "../risk/scorer";
import { generateRiskInsight, generateBatchInsights } from "../ai/ai";
import { RiskProfile } from "../risk/signals";

const router = Router();

// ─── GET /api/risk/all ────────────────────────────────────────────────────────
// Returns risk scores for ALL customers, sorted by score descending.
// Query params:
//   ?ai=true         — include AI insights (only for high_risk + critical)
//   ?category=high_risk  — filter by category
//   ?minScore=50     — filter by minimum score

router.get("/risk/all", async (req: Request, res: Response) => {
  try {
    const includeAI = req.query.ai === "true";
    const categoryFilter = req.query.category as string | undefined;
    const minScore = req.query.minScore ? Number(req.query.minScore) : 0;

    // 1. Collect signals from all 3 sources
    const signalMap = await collectAllSignals();

    // 2. Score every customer
    let profiles: RiskProfile[] = [];
    for (const signals of signalMap.values()) {
      const profile = calculateRiskScore(signals);
      profiles.push(profile);
    }

    // 3. Apply filters
    if (categoryFilter) {
      profiles = profiles.filter((p) => p.category === categoryFilter);
    }
    if (minScore > 0) {
      profiles = profiles.filter((p) => p.score >= minScore);
    }

    // 4. Sort by score descending (most at-risk first)
    profiles.sort((a, b) => b.score - a.score);

    // 5. Optionally enrich with AI insights
    let aiInsights: Map<string, any> = new Map();
    if (includeAI && profiles.length > 0) {
      aiInsights = await generateBatchInsights(profiles, {
        onlyHighRisk: true,
        maxConcurrent: 3,
      });
    }

    // 6. Build response
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

    // Summary stats
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

    res.json({
      success: true,
      summary,
      data,
    });
  } catch (err: any) {
    console.error("❌ /api/risk/all error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/risk/summary ────────────────────────────────────────────────────
// Fast overview — just category counts + top 5 critical customers.
// No AI. Meant for dashboard header widgets.

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

// ─── GET /api/risk/:email ─────────────────────────────────────────────────────
// Deep risk profile for a single customer.
// Query params:
//   ?ai=true  — include AI insight (default: true)

router.get("/risk/:email", async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const includeAI = req.query.ai !== "false"; // default true

    if (!email || !email.includes("@")) {
      return res.status(400).json({ success: false, error: "Invalid email" });
    }

    // 1. Collect signals for this specific customer
    const signals = await collectSignalsForEmail(email);

    if (!signals) {
      return res.status(404).json({
        success: false,
        error: `No data found for customer: ${email}`,
      });
    }

    // 2. Score
    const profile = calculateRiskScore(signals);

    // 3. AI insight
    let ai = null;
    if (includeAI) {
      try {
        ai = await generateRiskInsight(profile);
      } catch (aiErr: any) {
        console.error("⚠️ AI insight failed (non-fatal):", aiErr.message);
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