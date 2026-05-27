import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";

import helloRouter from "./routes/hello.routes";
import clientsRouter from "./routes/clients.routes";
import { runCoralQuery } from "./coral/client";
import { queries } from "./coral/queries";
import journeyRouter from "./routes/journey.route";
import customerRouter       from "./routes/customer.route"; 
import resendWebhookRouter from "./routes/webhooks.routes";
import chatRouter from "./routes/chat.route"; 
dotenv.config();

const app: Application = express();

const PORT = process.env.PORT || 5000;

// CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use(resendWebhookRouter);
app.use("/api", helloRouter);
app.use("/api", clientsRouter);
app.use("/api", journeyRouter);
app.use("/api", chatRouter);
app.use("/api", customerRouter); 
app.get("/invoices", async (req: Request, res: Response) => {
  try {
    const data = await runCoralQuery(queries.getRecentInvoices);

    res.json(data);
  } catch (error) {
    console.error("Coral Query Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
    });
  }
});

app.get("/", (req: Request, res: Response) => {
  res.send("API is running 🚀");
});


// Debug: print all routes
app._router.stack
  .filter((r: any) => r.route || r.handle?.stack)
  .forEach((r: any) => {
    if (r.route) {
      console.log(`Route: ${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`);
    } else if (r.handle?.stack) {
      r.handle.stack.forEach((nested: any) => {
        if (nested.route) {
          console.log(`Route: ${Object.keys(nested.route.methods).join(',').toUpperCase()} ${nested.route.path}`);
        }
      });
    }
  });
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});