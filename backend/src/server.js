/**
 * server.js - Entry point for the Job Matcher Express API.
 * Loads env vars, connects to MongoDB, mounts routes, starts listening.
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const { connectDB } = require("./config/db");

const authRoutes = require("./routes/auth");
const resumeRoutes = require("./routes/resume");
const jobRoutes = require("./routes/job");
const userRoutes = require("./routes/user");

const app = express();

// ─── Security & Parsing Middleware ───────────────────────────────────────────
// app.use(helmet());                        // Disabled for troubleshooting
const frontendUrl = process.env.FRONTEND_URL;
app.use(
  cors({
    origin: frontendUrl ? [frontendUrl, "http://localhost:5173", "http://localhost:3000"] : true,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// ─── Static Files (uploaded resumes served during dev) ───────────────────────
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/job", jobRoutes);
app.use("/api/user", userRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
});
