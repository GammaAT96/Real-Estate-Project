import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { globalErrorHandler } from "./middleware/error.middleware.js";

import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import companyRoutes from "./modules/company/company.routes.js";
import projectRoutes from "./modules/project/project.routes.js";
import plotRoutes from "./modules/plot/plot.routes.js";
import bookingRoutes from "./modules/booking/booking.routes.js";
import saleRoutes from "./modules/sale/sale.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";

const app = express();

// ── Middleware (MUST be before routes) ──────────────────
app.use(cors({
  origin: [
    "http://localhost:5173", // Vite default
    "http://localhost:3000", // Next.js / CRA default
    "http://localhost:4173", // Vite preview
  ],
  credentials: true, // Required for cookies (refresh token)
}));
app.use(express.json());
app.use(cookieParser());

// ── Utility routes ──────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "Real Estate Backend Running 🚀" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Swagger Docs ─────────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "Real Estate API Docs",
  swaggerOptions: { persistAuthorization: true },
}));

// ── API Routes ───────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/plots", plotRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ── Global error handler (MUST be last) ─────────────────
app.use(globalErrorHandler);

export default app;

