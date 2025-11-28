import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import adminRoutes from "./app/routes/admin.routes.js";
import analyticsRoutes from "./app/routes/analytics.routes.js";
import authRoutes from "./app/routes/auth.routes.js";
import contractorRoutes from "./app/routes/contractor.routes.js";
import disputeRoutes from "./app/routes/dispute.routes.js";
import expenseRoutes from "./app/routes/expense.routes.js";
import faqRoutes from "./app/routes/faq.routes.js";
import jobRoutes from "./app/routes/job.routes.js";
import mediaRoutes from "./app/routes/media.routes.js";
import messageRoutes from "./app/routes/message.routes.js";
import notificationRoutes from "./app/routes/notification.routes.js";
import notificationPreferenceRoutes from "./app/routes/notification_preference.routes.js";
import paymentRoutes from "./app/routes/payment.routes.js";
import premiumRoutes from "./app/routes/premium.routes.js";
import promotionRoutes from "./app/routes/promotion.routes.js";
import propertyRoutes from "./app/routes/property.routes.js";
import quoteRoutes from "./app/routes/quote.routes.js";
import referralRoutes from "./app/routes/referral.routes.js";
import requestRoutes from "./app/routes/request.routes.js";
import reviewRoutes from "./app/routes/review.routes.js";
import routeRoutes from "./app/routes/route.routes.js";
import subscriptionRoutes from "./app/routes/subscription.routes.js";
import userRoutes from "./app/routes/user.routes.js";
import verificationRoutes from "./app/routes/verification.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isDemoMode = process.env.DEMO_MODE === "true";

if (isDemoMode) {
  console.log("🎭 DEMO MODE ENABLED");
  console.log("   - Authentication bypassed");
  console.log("   - Using SQLite database");
  console.log("   - Add ?role=contractor or ?role=homeowner to switch roles");
  console.log("");
}

// Middleware
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ["http://localhost:8080", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Lawnr API is running" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/contractors", contractorRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/notification-preferences", notificationPreferenceRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/faqs", faqRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: "Route not found" } });
});

app.listen(PORT, () => {
  console.log(`🚀 Lawnr API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  if (isDemoMode) {
    console.log(`📦 Demo database: ./demo.db`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    console.log(`💚 Health: http://localhost:${PORT}/health`);
  }
});

export default app;
