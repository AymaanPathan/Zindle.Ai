import { Router, Request, Response } from "express";
import { buildJourney } from "../lib/journey/buildJourney";

const journeyRouter = Router();

journeyRouter.get(
  "/clients/journey",
  async (req: Request, res: Response) => {
    const email = (req.query.email as string | undefined)?.trim();

    if (!email) { 
      return res.status(400).json({
        error: "Missing required query param: email",
      });
    }

    try {
      const journey = await buildJourney(email);

      return res.json({
        customerEmail: journey.customerEmail,
        riskScore: journey.riskScore,
        riskCategory: journey.riskCategory,
        summary: journey.summary,
        patterns: journey.patterns,
        ai: journey.ai,
        events: journey.events,
      });
    } catch (err) {
      console.error("❌ Journey build failed for", email, err);
      return res.status(500).json({
        error: "Failed to build customer journey",
      });
    }
  },
);

export default journeyRouter;