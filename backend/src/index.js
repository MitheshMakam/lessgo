require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const interviewRoutes = require("./routes/interview");
const leetcodeRoutes = require("./routes/leetcode");
const roadmapRoutes = require("./routes/roadmaps");
const resourceRoutes = require("./routes/resources");
const dashboardRoutes = require("./routes/dashboard");
const applicationRoutes = require("./routes/applications");
const analyticsRoutes = require("./routes/analytics");
const oaSimulatorRoutes = require("./routes/oaSimulator");
const interviewBotRoutes = require("./routes/interviewBot");
const resumeRoutes = require("./routes/resume");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "LessGo API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/leetcode", leetcodeRoutes);
app.use("/api/roadmaps", roadmapRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/oa-simulator", oaSimulatorRoutes);
app.use("/api/interview-bot", interviewBotRoutes);
app.use("/api/resume", resumeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 LessGo API running on http://localhost:${PORT}`);
});
