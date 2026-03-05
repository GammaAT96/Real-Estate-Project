import "./config/env.js"; // Validate env FIRST

import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";

import { Sentry } from "./config/sentry.js";
import { logger } from "./config/logger.js";
import { swaggerSpec } from "./config/swagger.js";
import { globalErrorHandler } from "./middleware/error.middleware.js";
import { generalRateLimiter } from "./middleware/rateLimit.middleware.js";

import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import companyRoutes from "./modules/company/company.routes.js";
import projectRoutes from "./modules/project/project.routes.js";
import plotRoutes from "./modules/plot/plot.routes.js";
import bookingRoutes from "./modules/booking/booking.routes.js";
import saleRoutes from "./modules/sale/sale.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";

const app = express();

/* ─────────────────────────────────────────────────────────────
   1️⃣  SECURITY HEADERS
   NOTE: @sentry/node v8 auto-captures requests — no manual
         requestHandler() needed anymore.
───────────────────────────────────────────────────────────── */
app.use(helmet());

/* ─────────────────────────────────────────────────────────────
   3️⃣  CORS (Allow frontend + send cookies)
───────────────────────────────────────────────────────────── */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:4173",
    ],
    credentials: true,
  })
);

/* ─────────────────────────────────────────────────────────────
   4️⃣  HTTP REQUEST LOGGING
───────────────────────────────────────────────────────────── */
app.use(pinoHttp.default({ logger }));

/* ─────────────────────────────────────────────────────────────
   5️⃣  BODY + COOKIE PARSING
───────────────────────────────────────────────────────────── */
app.use(express.json());
app.use(cookieParser());

/* ─────────────────────────────────────────────────────────────
   6️⃣  RATE LIMITING
───────────────────────────────────────────────────────────── */
app.use("/api/", generalRateLimiter);

/* ─────────────────────────────────────────────────────────────
   7️⃣  UTILITY ROUTES
───────────────────────────────────────────────────────────── */
app.get("/", (_req, res) => {
  res.json({ message: "Real Estate Backend Running 🚀" });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});


/* ─────────────────────────────────────────────────────────────
   8️⃣  SWAGGER DOCS
───────────────────────────────────────────────────────────── */
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Real Estate API Docs",
    swaggerOptions: { persistAuthorization: true },
  })
);

/* ─────────────────────────────────────────────────────────────
   9️⃣  API ROUTES
───────────────────────────────────────────────────────────── */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/plots", plotRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/sales", saleRoutes);
// Routes
app.use("/api/dashboard", dashboardRoutes);

// Sentry error handler (v8+)
Sentry.setupExpressErrorHandler(app);

// Global error handler (MUST be last)
app.use(globalErrorHandler);

export default app;