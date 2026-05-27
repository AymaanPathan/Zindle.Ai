import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

router.post(
  "/webhooks/resend",
  async (req: Request, res: Response) => {
    try {
      console.log(
        "🔥 RESEND WEBHOOK:",
        JSON.stringify(req.body, null, 2),
      );

      const { type, data } = req.body;

      const email =
        data?.to?.[0] ||
        data?.email ||
        data?.recipient;

      if (!email || !type) {
        return res.status(400).json({
          error: "Missing required fields",
        });
      }

      const eventTypeMap: Record<string, string> = {
        "email.sent": "sent",
        "email.delivered": "delivered",
        "email.opened": "opened",
        "email.clicked": "clicked",
        "email.bounced": "bounced",
        "email.complained": "complained",
      };

      const mappedType = eventTypeMap[type];

      // Ignore unsupported webhook events
      if (!mappedType) {
        console.log(`⚠️ Ignored event type: ${type}`);

        return res.status(200).json({
          ignored: true,
        });
      }

      const { error } = await supabase
        .from("email_events")
        .insert({
          email,
          type: mappedType,
          created: new Date().toISOString(),
          raw: req.body,
        });

      if (error) {
        console.error(
          "❌ Supabase insert failed:",
          error.message,
        );

        return res.status(500).json({
          error: error.message,
        });
      }

      console.log(
        `📧 Email event stored: ${email} → ${mappedType}`,
      );

      return res.status(200).json({
        ok: true,
      });
    } catch (err: any) {
      console.error("❌ Webhook error:", err.message);

      return res.status(500).json({
        error: err.message,
      });
    }
  },
);

export default router;